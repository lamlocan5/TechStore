package com.example.order_service.client;

import com.example.order_service.exception.AppException;
import com.example.order_service.exception.ErrorCode;
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

import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class ProductServiceClient {

    private final RestTemplate restTemplate;

    @Value("${product.service.url:http://localhost:8083/product}")
    private String productServiceUrl;

    public boolean checkStockAvailability(Long variantId, Integer quantity) {
        try {
            String url = productServiceUrl + "/variants/" + variantId;
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                Map<String, Object> result = (Map<String, Object>) body.get("result");
                if (result != null) {
                    Integer stock = result.get("stock") != null ? 
                        Integer.valueOf(result.get("stock").toString()) : 0;
                    return stock >= quantity;
                }
            }
            return false;
        } catch (HttpClientErrorException.NotFound e) {
            log.error("Product variant not found: {}", variantId);
            throw new AppException(ErrorCode.PRODUCT_VARIANT_NOT_FOUND);
        } catch (Exception e) {
            log.error("Error checking stock availability for variant {}: {}", variantId, e.getMessage());
            throw new RuntimeException("Failed to check stock availability: " + e.getMessage(), e);
        }
    }

    public void reserveStock(Long variantId, Integer quantity) {
        try {
            String url = productServiceUrl + "/variants/internal/" + variantId + "/stock/reduce";
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("quantity", quantity);
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("Content-Type", "application/json");
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            
            restTemplate.exchange(url, HttpMethod.POST, request, Map.class);
        } catch (HttpClientErrorException.BadRequest e) {
            log.error("Insufficient stock for variant {}: {}", variantId, e.getMessage());
            throw new AppException(ErrorCode.INSUFFICIENT_STOCK);
        } catch (HttpClientErrorException.NotFound e) {
            log.error("Product variant not found: {}", variantId);
            throw new AppException(ErrorCode.PRODUCT_VARIANT_NOT_FOUND);
        } catch (Exception e) {
            log.error("Error reserving stock for variant {}: {}", variantId, e.getMessage());
            throw new RuntimeException("Failed to reserve stock: " + e.getMessage(), e);
        }
    }

    public void releaseStock(Long variantId, Integer quantity) {
        try {
            String url = productServiceUrl + "/variants/internal/" + variantId + "/stock/add";
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("quantity", quantity);
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("Content-Type", "application/json");
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            
            restTemplate.exchange(url, HttpMethod.POST, request, Map.class);
        } catch (HttpClientErrorException.NotFound e) {
            log.error("Product variant not found: {}", variantId);
            throw new AppException(ErrorCode.PRODUCT_VARIANT_NOT_FOUND);
        } catch (Exception e) {
            log.error("Error releasing stock for variant {}: {}", variantId, e.getMessage());
            throw new RuntimeException("Failed to release stock: " + e.getMessage(), e);
        }
    }
}

