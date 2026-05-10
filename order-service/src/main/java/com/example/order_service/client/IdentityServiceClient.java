package com.example.order_service.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class IdentityServiceClient {

    private final RestTemplate restTemplate;

    @Value("${identity.service.url:http://localhost:8080/identity}")
    private String identityServiceUrl;

    /**
     * Lấy token JWT từ SecurityContext hiện tại
     */
    private String getTokenFromContext() {
        try {
            var auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof Jwt jwt) {
                return jwt.getTokenValue();
            }
        } catch (Exception e) {
            log.warn("Cannot get token from SecurityContext: {}", e.getMessage());
        }
        return null;
    }

    /**
     * Internal: cộng total_spent cho user khi đơn hoàn thành
     * @param userIdOrUsername có thể là userId (UUID) hoặc username
     */
    public void addTotalSpent(String userIdOrUsername, Long amount) {
        try {
            // userIdOrUsername có thể là username hoặc userId
            // Nếu là username, cần lấy userId trước
            String actualUserId = userIdOrUsername;
            
            // Kiểm tra xem có phải UUID không (UUID có format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
            if (!userIdOrUsername.matches("^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$")) {
                // Không phải UUID, có thể là username, cần lấy userId
                log.info("userIdOrUsername '{}' is not a UUID, trying to get userId from username", userIdOrUsername);
                actualUserId = getUserIdFromUsername(userIdOrUsername);
                if (actualUserId == null) {
                    log.error("Cannot find userId for username: {}", userIdOrUsername);
                    return;
                }
            }
            
            String url = identityServiceUrl + "/users/internal/" + actualUserId + "/add-spent";
            log.info("Calling addTotalSpent: url={}, userId={}, amount={}", url, actualUserId, amount);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> body = Map.of("amount", amount);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, request, Map.class);
            
            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Successfully added total spent for user {}: {}", actualUserId, amount);
            } else {
                log.error("Failed to add total spent for user {}: HTTP {}", actualUserId, response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("Error when calling addTotalSpent for user {}: {}", userIdOrUsername, e.getMessage(), e);
        }
    }
    
    /**
     * Lấy userId từ username bằng cách gọi API identity-service internal endpoint
     */
    private String getUserIdFromUsername(String username) {
        try {
            String url = identityServiceUrl + "/users/internal/by-username/" + username;
            log.info("Getting userId from username: {}", username);
            
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                String userId = (String) body.get("result");
                if (userId != null) {
                    log.info("Found userId {} for username {}", userId, username);
                    return userId;
                }
            }
            
            log.warn("Cannot find userId for username: {}", username);
        } catch (Exception e) {
            log.error("Error getting userId from username {}: {}", username, e.getMessage());
        }
        return null;
    }

    /**
     * Lấy rank hiện tại của user từ identity-service
     * @param userId có thể là userId (UUID) hoặc username
     * @return tên rank dạng String (BRONZE/SILVER/...), hoặc null nếu lỗi
     */
    public String getUserRank(String userId) {
        try {
            String actualUserId = userId;
            
            // Kiểm tra xem có phải UUID không (UUID có format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
            if (!userId.matches("^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$")) {
                // Không phải UUID, có thể là username, cần lấy userId
                log.info("userId '{}' is not a UUID, trying to get userId from username", userId);
                actualUserId = getUserIdFromUsername(userId);
                if (actualUserId == null) {
                    log.error("Cannot find userId for username: {}", userId);
                    return null;
                }
            }
            
            String url = identityServiceUrl + "/users/" + actualUserId;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            // Thêm token từ SecurityContext hiện tại
            String token = getTokenFromContext();
            if (token != null) {
                headers.setBearerAuth(token);
            }

            HttpEntity<Void> request = new HttpEntity<>(headers);
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, request, Map.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                Map<String, Object> result = (Map<String, Object>) body.get("result");
                if (result != null && result.get("rank") != null) {
                    log.info("Got rank for user {} ({}): {}", userId, actualUserId, result.get("rank"));
                    return result.get("rank").toString();
                }
            }
        } catch (Exception e) {
            log.error("Error when getting rank for user {}: {}", userId, e.getMessage());
        }
        return null;
    }
}


