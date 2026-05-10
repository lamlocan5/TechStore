package com.example.product_service.service;

import com.example.product_service.dto.request.ImageIndexRequest;
import com.example.product_service.dto.response.ImageIndexResponse;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class AIImageSearchClient {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final String baseUrl;
    private final boolean enabled;

    public AIImageSearchClient(
            RestTemplate restTemplate,
            ObjectMapper objectMapper,
            @Value("${ai.image-search.url}") String baseUrl,
            @Value("${ai.image-search.enabled:true}") boolean enabled
    ) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        this.baseUrl = baseUrl;
        this.enabled = enabled;
    }

    /**
     * Index product images in AI search service
     *
     * @param productId  Product ID from database
     * @param imageUrls  List of image URLs to index
     * @return ImageIndexResponse with indexing results
     */
    public ImageIndexResponse indexProduct(Long productId, List<String> imageUrls) {
        if (!enabled) {
            log.info("AI Image Search is disabled. Skipping indexing for product {}", productId);
            return ImageIndexResponse.builder()
                    .productId(productId)
                    .imagesIndexed(0)
                    .imagesFailed(0)
                    .build();
        }

        if (imageUrls == null || imageUrls.isEmpty()) {
            log.info("No images to index for product {}", productId);
            return ImageIndexResponse.builder()
                    .productId(productId)
                    .imagesIndexed(0)
                    .imagesFailed(0)
                    .build();
        }

        try {
            String url = baseUrl + "/api/image-search/index";

            // Build request with snake_case field names for Python API
            Map<String, Object> requestBody = Map.of(
                    "product_id", productId,
                    "image_urls", imageUrls
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            log.info("Indexing {} images for product {} at {}", imageUrls.size(), productId, url);

            ResponseEntity<Map> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    Map.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> result = (Map<String, Object>) response.getBody().get("result");
                if (result != null) {
                    return ImageIndexResponse.builder()
                            .productId(((Number) result.get("product_id")).longValue())
                            .imagesIndexed((Integer) result.get("images_indexed"))
                            .imagesFailed((Integer) result.get("images_failed"))
                            .build();
                }
            }

            log.warn("Unexpected response from AI service for product {}: {}", productId, response);
            return ImageIndexResponse.builder()
                    .productId(productId)
                    .imagesIndexed(0)
                    .imagesFailed(imageUrls.size())
                    .build();

        } catch (Exception e) {
            log.error("Failed to index product {} in AI service: {}", productId, e.getMessage());
            return ImageIndexResponse.builder()
                    .productId(productId)
                    .imagesIndexed(0)
                    .imagesFailed(imageUrls.size())
                    .build();
        }
    }

    /**
     * Remove product from AI search index
     *
     * @param productId Product ID to remove
     * @return true if removed successfully
     */
    public boolean removeProduct(Long productId) {
        if (!enabled) {
            log.info("AI Image Search is disabled. Skipping removal for product {}", productId);
            return true;
        }

        try {
            String url = baseUrl + "/api/image-search/index/" + productId;

            log.info("Removing product {} from AI index at {}", productId, url);

            ResponseEntity<Map> response = restTemplate.exchange(
                    url,
                    HttpMethod.DELETE,
                    null,
                    Map.class
            );

            boolean success = response.getStatusCode().is2xxSuccessful();
            log.info("Removal of product {} from AI index: {}", productId, success ? "success" : "failed");
            return success;

        } catch (Exception e) {
            log.error("Failed to remove product {} from AI service: {}", productId, e.getMessage());
            return false;
        }
    }

    /**
     * Parse images JSON string to list of URLs
     *
     * @param imagesJson JSON string containing image URLs
     * @return List of image URLs
     */
    public List<String> parseImagesJson(String imagesJson) {
        if (imagesJson == null || imagesJson.isEmpty()) {
            return new ArrayList<>();
        }

        try {
            return objectMapper.readValue(imagesJson, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            log.warn("Failed to parse images JSON: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    /**
     * Collect all image URLs from product fields
     *
     * @param avatar     Main product image
     * @param imagesJson JSON string of additional images
     * @param firstImage First image reference
     * @return Combined list of all image URLs
     */
    public List<String> collectImageUrls(String avatar, String imagesJson, String firstImage) {
        List<String> urls = new ArrayList<>();

        // Add avatar if present
        if (avatar != null && !avatar.isEmpty()) {
            urls.add(avatar);
        }

        // Parse and add images from JSON
        List<String> parsedImages = parseImagesJson(imagesJson);
        for (String img : parsedImages) {
            if (img != null && !img.isEmpty() && !urls.contains(img)) {
                urls.add(img);
            }
        }

        // Add firstImage if not already included
        if (firstImage != null && !firstImage.isEmpty() && !urls.contains(firstImage)) {
            urls.add(firstImage);
        }

        return urls;
    }

    /**
     * Check if AI Image Search service is healthy
     *
     * @return true if service is healthy
     */
    public boolean isHealthy() {
        if (!enabled) {
            return true;
        }

        try {
            String url = baseUrl + "/api/image-search/health";
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            log.warn("AI Image Search service health check failed: {}", e.getMessage());
            return false;
        }
    }
}
