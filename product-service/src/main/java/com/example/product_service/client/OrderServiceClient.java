package com.example.product_service.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrderServiceClient {

    private final RestTemplate restTemplate;

    @Value("${order.service.url:http://localhost:8084/api}")
    private String orderServiceUrl;

    /**
     * Kiểm tra xem user đã mua sản phẩm (có order COMPLETED với productId này) chưa
     * @param userId ID của user
     * @param productId ID của sản phẩm
     * @return true nếu user đã mua sản phẩm, false nếu chưa
     */
    public boolean hasUserPurchasedProduct(String userId, Long productId) {
        try {
            // Gọi API internal của order service để kiểm tra
            // Tạo endpoint mới trong order service hoặc sử dụng endpoint hiện có
            String url = orderServiceUrl + "/orders/internal/check-purchase?userId=" + userId + "&productId=" + productId;
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("Content-Type", "application/json");
            HttpEntity<Void> request = new HttpEntity<>(headers);
            
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, request, Map.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                Map<String, Object> result = (Map<String, Object>) body.get("result");
                if (result != null && result.containsKey("hasPurchased")) {
                    return Boolean.TRUE.equals(result.get("hasPurchased"));
                }
            }
            return false;
        } catch (HttpClientErrorException.NotFound e) {
            log.debug("User {} has not purchased product {}", userId, productId);
            return false;
        } catch (Exception e) {
            log.error("Error checking purchase status for user {} and product {}: {}", userId, productId, e.getMessage());
            // Trong trường hợp lỗi, trả về false để an toàn (user không được đánh giá)
            return false;
        }
    }
}

