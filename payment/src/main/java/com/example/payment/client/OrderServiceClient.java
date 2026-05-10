package com.example.payment.client;

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

@Slf4j
@Component
@RequiredArgsConstructor
public class OrderServiceClient {

    private final RestTemplate restTemplate;

    @Value("${order.service.url:http://localhost:8084/api}")
    private String orderServiceUrl;

    /**
     * Cập nhật trạng thái thanh toán của đơn hàng
     * Sử dụng internal endpoint không yêu cầu authentication
     * @param orderId ID của đơn hàng
     * @param paymentStatus Trạng thái thanh toán (PAID, UNPAID, REFUNDED)
     * @return true nếu cập nhật thành công, false nếu thất bại
     */
    public boolean updatePaymentStatus(Long orderId, String paymentStatus) {
        try {
            // Sử dụng internal endpoint không yêu cầu authentication
            String url = orderServiceUrl + "/orders/internal/" + orderId + "/payment-status?status=" + paymentStatus;
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("Content-Type", "application/json");
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            ResponseEntity<?> response = restTemplate.exchange(
                    url,
                    HttpMethod.PUT,
                    entity,
                    Object.class
            );
            
            log.info("Updated payment status for order {} to {}", orderId, paymentStatus);
            return response.getStatusCode().is2xxSuccessful();
        } catch (HttpClientErrorException e) {
            log.error("Failed to update payment status for order {}: {}", orderId, e.getMessage());
            return false;
        } catch (Exception e) {
            log.error("Unexpected error updating payment status for order {}: {}", orderId, e.getMessage());
            return false;
        }
    }

    /**
     * Kiểm tra đơn hàng có tồn tại và hợp lệ không
     * @param orderId ID của đơn hàng
     * @return true nếu đơn hàng tồn tại và hợp lệ
     */
    public boolean validateOrder(Long orderId) {
        try {
            String url = orderServiceUrl + "/orders/internal/" + orderId;
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("Content-Type", "application/json");
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            ResponseEntity<?> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    Object.class
            );
            
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            log.error("Failed to validate order {}: {}", orderId, e.getMessage());
            return false;
        }
    }
}

