package com.example.gateway.configuration;

import com.example.gateway.service.IdentityService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.Arrays;
import java.util.List;

@Component
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationFilter implements GlobalFilter, Ordered {
    @NonFinal
    private String[] excludedPaths = {
            "/identity/auth/.*",
            "/identity/users/createUser",
            "/product/products.*",
            "/product.*",
            "/search/image",           // endpoint tìm kiếm ảnh (public)
            "/image-search/health",    // kiểm tra sức khỏe dịch vụ AI
            "/image-search/stats"      // thống kê dịch vụ AI
    };
    @NonFinal
    @Value("${app.api-prefix}")
    private String apiPrefix;

    IdentityService identityService;
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        if (isPublic(exchange.getRequest())) {
            log.info("Skip AuthenticationFilter for path: {}", exchange.getRequest().getPath());
            return chain.filter(exchange);
        }

        log.info("AuthenticationFilter started");
        // Lấy token từ header
        List<String> authHeader = exchange.getRequest().getHeaders().get(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || authHeader.isEmpty()) {
            return Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No Authorization"));
        }

        String token = authHeader.getFirst().replace("Bearer ", "");
        log.info("AuthenticationFilter token: " + token);
        // Xác thực token với identity-service
        return identityService.introspect(token).flatMap(introspectResponseApiResponse -> {
            if (introspectResponseApiResponse.getResult().isValid()) {
                return chain.filter(exchange);
            }
            return Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No Authorization"));
        });
    }

    @Override
    public int getOrder() {
        return -1;
    }

    private boolean isPublic(ServerHttpRequest request) {
        String fullPath = request.getURI().getPath();
        log.info("=== Checking if path is public ===");
        log.info("Full path: {}", fullPath);
        log.info("API prefix: {}", apiPrefix);

        boolean result = Arrays.stream(excludedPaths).anyMatch(excludedPath -> {
            String pattern = apiPrefix + excludedPath;
            boolean matches = fullPath.matches(pattern);
            log.info("Testing pattern: {} -> {}", pattern, matches);
            return matches;
        });

        log.info("Final result: {}", result);
        return result;
    }
}
