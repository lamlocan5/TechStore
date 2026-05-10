package com.example.gateway.controller;

import com.example.gateway.dto.response.AISearchResponse;
import com.example.gateway.dto.response.ApiResponse;
import com.example.gateway.dto.response.ImageSearchResult;
import com.example.gateway.dto.response.ProductWithSimilarity;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/search")
@Slf4j
public class ImageSearchController {

    private final WebClient aiImageSearchWebClient;
    private final WebClient productServiceWebClient;

        @Value("${image-search.max-file-size:5242880}") // mặc định 5MB
    private long maxFileSize;

    @Value("${image-search.allowed-types:image/jpeg,image/png,image/webp,image/gif}")
    private String allowedTypes;

    public ImageSearchController(
            @Qualifier("aiImageSearchWebClient") WebClient aiImageSearchWebClient,
            @Qualifier("productServiceWebClient") WebClient productServiceWebClient
    ) {
        this.aiImageSearchWebClient = aiImageSearchWebClient;
        this.productServiceWebClient = productServiceWebClient;
    }

        /**
         * Tìm kiếm sản phẩm bằng ảnh: kiểm tra tệp, gọi dịch vụ AI lấy danh sách id kèm độ tương đồng,
         * sau đó gọi product-service lấy chi tiết và ghép kết quả theo thứ tự độ tương đồng.
         */
    @PostMapping(value = "/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Mono<ApiResponse<List<ProductWithSimilarity>>> searchByImage(
            @RequestPart("file") FilePart file,
            @RequestParam(defaultValue = "10") int topK
    ) {
        // Kiểm tra định dạng file
        String contentType = file.headers().getContentType() != null
                ? file.headers().getContentType().toString()
                : "";

        if (!isValidImageType(contentType)) {
            return Mono.error(new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid file type. Allowed: " + allowedTypes
            ));
        }

                // Chuẩn hóa tham số topK
        if (topK < 1 || topK > 50) {
            topK = 10;
        }

        final int finalTopK = topK;

        // Đọc nội dung file và kiểm tra kích thước
        return DataBufferUtils.join(file.content())
                .flatMap(dataBuffer -> {
                    byte[] bytes = new byte[dataBuffer.readableByteCount()];
                    dataBuffer.read(bytes);
                    DataBufferUtils.release(dataBuffer);

                    // Kiểm tra kích thước file
                    if (bytes.length > maxFileSize) {
                        return Mono.error(new ResponseStatusException(
                                HttpStatus.BAD_REQUEST,
                                "File too large. Maximum size: " + (maxFileSize / 1024 / 1024) + "MB"
                        ));
                    }

                                        // Gọi dịch vụ AI để lấy danh sách sản phẩm tương tự
                    return callAISearchService(bytes, file.filename(), contentType, finalTopK);
                })
                .flatMap(aiResponse -> {
                    if (aiResponse.getResults() == null || aiResponse.getResults().isEmpty()) {
                        return Mono.just(ApiResponse.<List<ProductWithSimilarity>>builder()
                                .code(1000)
                                .message("No similar products found")
                                .result(Collections.emptyList())
                                .build());
                    }

                    // Lấy danh sách id và map độ tương đồng
                    List<Long> productIds = aiResponse.getResults().stream()
                            .map(ImageSearchResult::getProductId)
                            .collect(Collectors.toList());

                    Map<Long, Double> similarityMap = aiResponse.getResults().stream()
                            .collect(Collectors.toMap(
                                    ImageSearchResult::getProductId,
                                    ImageSearchResult::getSimilarity
                            ));

                    // Gọi product-service để lấy chi tiết sản phẩm
                    return callProductService(productIds)
                            .map(products -> {
                                // Ghép kết quả, giữ nguyên thứ tự theo độ tương đồng
                                List<ProductWithSimilarity> mergedResults = mergeResults(
                                        products, similarityMap, productIds
                                );

                                return ApiResponse.<List<ProductWithSimilarity>>builder()
                                        .code(1000)
                                        .message("Found " + mergedResults.size() + " similar products")
                                        .result(mergedResults)
                                        .build();
                            });
                })
                .onErrorResume(e -> {
                    log.error("Image search failed: {}", e.getMessage());
                    if (e instanceof ResponseStatusException) {
                        return Mono.error(e);
                    }
                    return Mono.error(new ResponseStatusException(
                            HttpStatus.INTERNAL_SERVER_ERROR,
                            "Image search failed: " + e.getMessage()
                    ));
                });
    }

        /**
         * Gọi dịch vụ AI Image Search và chuẩn hóa dữ liệu trả về.
         */
    @SuppressWarnings("unchecked")
    private Mono<AISearchResponse> callAISearchService(byte[] imageBytes, String filename, String contentType, int topK) {
        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        builder.part("file", imageBytes)
                .filename(filename != null ? filename : "image.jpg")
                .contentType(MediaType.parseMediaType(contentType));

        return aiImageSearchWebClient.post()
                .uri(uriBuilder -> uriBuilder
                        .path("/api/image-search/search")
                        .queryParam("top_k", topK)
                        .build())
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(builder.build()))
                .retrieve()
                .onStatus(HttpStatusCode::isError, response ->
                        response.bodyToMono(String.class)
                                .flatMap(body -> Mono.error(new ResponseStatusException(
                                        HttpStatus.valueOf(response.statusCode().value()),
                                        "AI service error: " + body
                                )))
                )
                .bodyToMono(Map.class)
                .map(responseMap -> {
                    log.info("AI service response: {}", responseMap);

                    Map<String, Object> resultMap = (Map<String, Object>) responseMap.get("result");
                    if (resultMap == null) {
                        return AISearchResponse.builder()
                                .queryProcessed(false)
                                .totalResults(0)
                                .results(Collections.emptyList())
                                .build();
                    }

                    Boolean queryProcessed = (Boolean) resultMap.get("query_processed");
                    Integer totalResults = (Integer) resultMap.get("total_results");
                    List<Map<String, Object>> resultsRaw = (List<Map<String, Object>>) resultMap.get("results");

                    List<ImageSearchResult> results = new ArrayList<>();
                    if (resultsRaw != null) {
                        for (Map<String, Object> item : resultsRaw) {
                            Number productId = (Number) item.get("product_id");
                            Number similarity = (Number) item.get("similarity");
                            if (productId != null && similarity != null) {
                                results.add(ImageSearchResult.builder()
                                        .productId(productId.longValue())
                                        .similarity(similarity.doubleValue())
                                        .build());
                            }
                        }
                    }

                    return AISearchResponse.builder()
                            .queryProcessed(queryProcessed)
                            .totalResults(totalResults)
                            .results(results)
                            .build();
                })
                .doOnError(e -> log.error("AI service call failed: {}", e.getMessage()));
    }

        /**
         * Gọi product-service để lấy danh sách sản phẩm theo ID.
         */
    @SuppressWarnings("unchecked")
    private Mono<List<Map<String, Object>>> callProductService(List<Long> productIds) {
        String idsParam = productIds.stream()
                .map(String::valueOf)
                .collect(Collectors.joining(","));

        return productServiceWebClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/products/batch")
                        .queryParam("ids", idsParam)
                        .build())
                .retrieve()
                .onStatus(HttpStatusCode::isError, response ->
                        response.bodyToMono(String.class)
                                .flatMap(body -> Mono.error(new ResponseStatusException(
                                        HttpStatus.valueOf(response.statusCode().value()),
                                        "Product service error: " + body
                                )))
                )
                .bodyToMono(Map.class)
                .map(responseMap -> {
                    Object result = responseMap.get("result");
                    if (result instanceof List) {
                        return (List<Map<String, Object>>) result;
                    }
                    return Collections.<Map<String, Object>>emptyList();
                })
                .doOnError(e -> log.error("Product service call failed: {}", e.getMessage()));
    }

        /**
         * Ghép sản phẩm với độ tương đồng, giữ thứ tự giống kết quả AI.
         */
    private List<ProductWithSimilarity> mergeResults(
            List<Map<String, Object>> products,
            Map<Long, Double> similarityMap,
            List<Long> orderedProductIds
    ) {
                // Map hỗ trợ tra cứu sản phẩm nhanh theo id
        Map<Long, Map<String, Object>> productMap = products.stream()
                .filter(p -> p.get("id") != null)
                .collect(Collectors.toMap(
                        p -> ((Number) p.get("id")).longValue(),
                        p -> p,
                        (a, b) -> a // In case of duplicates, keep first
                ));

                // Duyệt theo thứ tự AI trả về để giữ thứ tự độ tương đồng
        List<ProductWithSimilarity> results = new ArrayList<>();
        for (Long productId : orderedProductIds) {
            Map<String, Object> product = productMap.get(productId);
            Double similarity = similarityMap.get(productId);

            if (product != null && similarity != null) {
                results.add(ProductWithSimilarity.builder()
                        .product(product)
                        .similarity(similarity)
                        .build());
            }
        }

        return results;
    }

    /**
     * Validate image content type
     */
    private boolean isValidImageType(String contentType) {
        if (contentType == null || contentType.isEmpty()) {
            return false;
        }
        return Arrays.stream(allowedTypes.split(","))
                .anyMatch(type -> contentType.toLowerCase().contains(type.trim().toLowerCase()));
    }
}
