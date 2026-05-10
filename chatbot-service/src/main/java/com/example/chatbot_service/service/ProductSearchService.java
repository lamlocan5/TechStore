package com.example.chatbot_service.service;

import com.example.chatbot_service.client.ProductServiceClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductSearchService {

    private final ProductServiceClient productServiceClient;

    // Hardcoded category IDs for reliable lookup
    private static final Map<String, Long> CATEGORY_IDS = new HashMap<>();
    static {
        // Điện thoại
        CATEGORY_IDS.put("Điện thoại", 31L);
        CATEGORY_IDS.put("điện thoại", 31L);

        // Laptop categories
        CATEGORY_IDS.put("Laptop Gaming", 33L);
        CATEGORY_IDS.put("laptop gaming", 33L);
        CATEGORY_IDS.put("Laptop Văn phòng", 33L);
        CATEGORY_IDS.put("laptop văn phòng", 33L);
        CATEGORY_IDS.put("Laptop Học sinh", 33L);
        CATEGORY_IDS.put("laptop học sinh", 33L);
        CATEGORY_IDS.put("Laptop Sinh viên", 33L);
        CATEGORY_IDS.put("laptop sinh viên", 33L);
        CATEGORY_IDS.put("Laptop Doanh nghiệp", 33L);
        CATEGORY_IDS.put("laptop doanh nghiệp", 33L);
        CATEGORY_IDS.put("Laptop Doanh nhân", 33L);
        CATEGORY_IDS.put("laptop doanh nhân", 33L);
        CATEGORY_IDS.put("Laptop Đồ họa", 33L);
        CATEGORY_IDS.put("laptop đồ họa", 33L);
        CATEGORY_IDS.put("Laptop Kỹ thuật", 33L);
        CATEGORY_IDS.put("laptop kỹ thuật", 33L);

        // Default laptop (dùng Gaming làm default vì phổ biến)
        CATEGORY_IDS.put("Laptop", 33L);
        CATEGORY_IDS.put("laptop", 33L);
    }

    // Cache for brand lookups
    private Map<String, Long> brandCache = new HashMap<>();

    /**
     * Search products based on Gemini function call parameters
     * Implements smart query building and result formatting
     *
     * @param params Function call parameters from Gemini
     * @return Formatted product list for AI consumption
     */
    @Cacheable(value = "productContext", key = "#params.toString()")
    public String searchProducts(Map<String, Object> params) {
        try {
            log.info("Searching products with params: {}", params);

            // Extract parameters
            String category = getStringParam(params, "category");
            String brand = getStringParam(params, "brand");
            Double minPrice = getDoubleParam(params, "min_price");
            Double maxPrice = getDoubleParam(params, "max_price");
            String keywords = getStringParam(params, "keywords");
            Integer ramGb = getIntParam(params, "ram_gb");
            Integer storageGb = getIntParam(params, "storage_gb");
            String chipset = getStringParam(params, "chipset"); // For smartphones
            Integer limit = getIntParam(params, "limit", 3);

            // Lookup categoryId and brandId
            Long categoryId = lookupCategoryId(category);
            Long brandId = lookupBrandId(brand);

            // Build keyword for search - only use brand name as keyword if no categoryId
            // Don't use feature keywords (camera, pin, etc.) as they don't match product names
            String searchKeyword = null;
            if (categoryId == null && brand != null) {
                searchKeyword = brand;
            }

            log.info("Advanced search: categoryId={}, brandId={}, keyword={}, minPrice={}, maxPrice={}",
                     categoryId, brandId, searchKeyword, minPrice, maxPrice);

            // Call advanced search API with categoryId filter
            Map<String, Object> response = productServiceClient.advancedSearch(
                    searchKeyword,
                    minPrice != null ? minPrice.longValue() : null,
                    maxPrice != null ? maxPrice.longValue() : null,
                    brandId,
                    categoryId,
                    1,
                    Math.min(limit * 2, 20) // Fetch more to allow for RAM/storage filtering
            );

            // Extract and format products
            List<Map<String, Object>> products = extractProducts(response);

            // Filter by RAM, storage (price already filtered by API)
            products = filterProducts(products, null, null, ramGb, storageGb);

            // Format for AI
            String formattedResult = formatProductsForAI(products, limit);
            log.info("ProductSearchService returning formatted result:\n{}", formattedResult);
            return formattedResult;

        } catch (Exception e) {
            log.error("Error searching products", e);
            return "Không thể tìm kiếm sản phẩm. Vui lòng thử lại.";
        }
    }

    /**
     * Lookup categoryId from category name
     * Uses hardcoded map for reliability
     */
    private Long lookupCategoryId(String category) {
        if (category == null || category.isBlank()) return null;

        String normalizedCategory = normalizeCategory(category);
        if (normalizedCategory == null) return null;

        // Use hardcoded category IDs for reliability
        Long categoryId = CATEGORY_IDS.get(normalizedCategory);
        if (categoryId != null) {
            log.info("Found hardcoded categoryId {} for '{}'", categoryId, normalizedCategory);
            return categoryId;
        }

        log.warn("No categoryId found for '{}', search will not filter by category", normalizedCategory);
        return null;
    }

    /**
     * Lookup brandId from brand name
     */
    private Long lookupBrandId(String brand) {
        if (brand == null || brand.isBlank()) return null;

        // Check cache first
        if (brandCache.containsKey(brand.toLowerCase())) {
            return brandCache.get(brand.toLowerCase());
        }

        try {
            Map<String, Object> response = productServiceClient.getBrands(brand, 1, 10);
            List<Map<String, Object>> brands = extractListFromResponse(response, "result");

            if (!brands.isEmpty()) {
                // Find best match
                for (Map<String, Object> b : brands) {
                    String brandName = b.get("name").toString().toLowerCase();
                    if (brandName.contains(brand.toLowerCase()) ||
                        brand.toLowerCase().contains(brandName)) {
                        Long id = ((Number) b.get("id")).longValue();
                        brandCache.put(brand.toLowerCase(), id);
                        log.info("Found brandId {} for '{}'", id, brand);
                        return id;
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error looking up brandId for '{}'", brand, e);
        }

        return null;
    }

    /**
     * Extract list from API response
     */
    private List<Map<String, Object>> extractListFromResponse(Map<String, Object> response, String key) {
        try {
            Object resultObj = response.get("result");
            if (resultObj instanceof Map) {
                Object dataObj = ((Map<String, Object>) resultObj).get(key);
                if (dataObj instanceof List) {
                    return (List<Map<String, Object>>) dataObj;
                }
            }
            if (resultObj instanceof List) {
                return (List<Map<String, Object>>) resultObj;
            }
        } catch (Exception e) {
            log.error("Error extracting list from response", e);
        }
        return new ArrayList<>();
    }

    /**
     * Build keyword query for search
     */
    private String buildKeywordQuery(String keywords, String chipset) {
        List<String> parts = new ArrayList<>();
        if (keywords != null && !keywords.isBlank()) {
            parts.add(keywords);
        }
        if (chipset != null && !chipset.isBlank()) {
            parts.add(chipset);
        }
        return parts.isEmpty() ? null : String.join(" ", parts);
    }

    /**
     * Get product details by ID
     */
    @Cacheable(value = "productContext", key = "'product_' + #productId")
    public String getProductDetails(Long productId, boolean includeVariants) {
        try {
            log.info("Getting product details for ID: {}", productId);

            Map<String, Object> productResponse = productServiceClient.getProductById(productId);
            Map<String, Object> product = extractResult(productResponse);

            if (product == null) {
                return "Không tìm thấy sản phẩm với ID: " + productId;
            }

            StringBuilder details = new StringBuilder();
            details.append("**").append(product.get("name")).append("**\n");
            details.append("Giá: ").append(formatPrice(product.get("priceSale"))).append(" VNĐ\n");
            details.append("Mô tả: ").append(product.get("description")).append("\n");

            if (includeVariants) {
                Map<String, Object> variantsResponse =
                        productServiceClient.getVariantsByProductId(productId);
                List<Map<String, Object>> variants = extractProducts(variantsResponse);

                if (!variants.isEmpty()) {
                    details.append("\nPhiên bản:\n");
                    for (Map<String, Object> variant : variants) {
                        details.append("- ")
                                .append(variant.getOrDefault("color", ""))
                                .append(" | RAM: ").append(variant.getOrDefault("ramGb", ""))
                                .append("GB | Storage: ").append(variant.getOrDefault("storageGb", ""))
                                .append("GB | Giá: ").append(formatPrice(variant.get("priceSale")))
                                .append(" VNĐ\n");
                    }
                }
            }

            return details.toString();

        } catch (Exception e) {
            log.error("Error getting product details", e);
            return "Không thể lấy thông tin sản phẩm.";
        }
    }

    /**
     * Compare multiple products
     */
    public String compareProducts(List<Long> productIds) {
        if (productIds == null || productIds.size() < 2) {
            return "Cần ít nhất 2 sản phẩm để so sánh.";
        }

        if (productIds.size() > 5) {
            return "Chỉ có thể so sánh tối đa 5 sản phẩm cùng lúc.";
        }

        try {
            log.info("Comparing products: {}", productIds);

            List<Map<String, Object>> products = new ArrayList<>();
            for (Long productId : productIds) {
                Map<String, Object> response = productServiceClient.getProductById(productId);
                Map<String, Object> product = extractResult(response);
                if (product != null) {
                    products.add(product);
                }
            }

            return formatProductComparison(products);

        } catch (Exception e) {
            log.error("Error comparing products", e);
            return "Không thể so sánh sản phẩm.";
        }
    }

    // Private helper methods

    private String buildSearchQuery(String category, String brand, String keywords, String chipset) {
        List<String> queryParts = new ArrayList<>();

        if (category != null && !category.isBlank()) {
            // Map category aliases to standard terms
            String normalizedCategory = normalizeCategory(category);
            queryParts.add(normalizedCategory);
        }
        if (brand != null && !brand.isBlank()) {
            queryParts.add(brand);
        }
        if (keywords != null && !keywords.isBlank()) {
            queryParts.add(keywords);
        }
        if (chipset != null && !chipset.isBlank()) {
            queryParts.add(chipset);
        }

        return queryParts.isEmpty() ? null : String.join(" ", queryParts);
    }

    /**
     * Normalize category aliases to standard terms (matching database category names)
     */
    private String normalizeCategory(String category) {
        if (category == null) return null;
        String lower = category.toLowerCase().trim();

        // Smartphone aliases -> "Điện thoại"
        if (lower.contains("phone") || lower.contains("điện thoại") ||
            lower.contains("dien thoai") || lower.contains("smartphone") ||
            lower.contains("di động") || lower.contains("di dong")) {
            return "Điện thoại";
        }

        // Laptop specific categories
        if (lower.contains("laptop") || lower.contains("máy tính xách tay") ||
            lower.contains("may tinh xach tay") || lower.contains("notebook")) {

            // Gaming laptop
            if (lower.contains("gaming") || lower.contains("game") || lower.contains("chơi game")) {
                return "Laptop Gaming";
            }
            // Văn phòng
            if (lower.contains("văn phòng") || lower.contains("van phong") || lower.contains("office")) {
                return "Laptop Văn phòng";
            }
            // Học sinh - Sinh viên
            if (lower.contains("học sinh") || lower.contains("hoc sinh") ||
                lower.contains("sinh viên") || lower.contains("sinh vien") ||
                lower.contains("student") || lower.contains("học tập")) {
                return "Laptop Sinh viên";
            }
            // Doanh nghiệp
            if (lower.contains("doanh nghiệp") || lower.contains("doanh nghiep") ||
                lower.contains("business") || lower.contains("enterprise")) {
                return "Laptop Doanh nghiệp";
            }
            // Doanh nhân
            if (lower.contains("doanh nhân") || lower.contains("doanh nhan") ||
                lower.contains("executive") || lower.contains("cao cấp")) {
                return "Laptop Doanh nhân";
            }
            // Đồ họa - Kỹ thuật
            if (lower.contains("đồ họa") || lower.contains("do hoa") ||
                lower.contains("kỹ thuật") || lower.contains("ky thuat") ||
                lower.contains("design") || lower.contains("graphic") ||
                lower.contains("workstation") || lower.contains("render")) {
                return "Laptop Đồ họa";
            }

            // Default laptop
            return "Laptop";
        }

        return category;
    }

    private List<Map<String, Object>> extractProducts(Map<String, Object> response) {
        try {
            Map<String, Object> result = extractResult(response);
            if (result == null) return new ArrayList<>();

            // Try "result" first (for product list), then "data" (for variants)
            Object dataObj = result.get("result");
            if (dataObj == null) {
                dataObj = result.get("data");
            }

            if (dataObj instanceof List) {
                return (List<Map<String, Object>>) dataObj;
            }

            return new ArrayList<>();
        } catch (Exception e) {
            log.error("Error extracting products from response", e);
            return new ArrayList<>();
        }
    }

    private Map<String, Object> extractResult(Map<String, Object> response) {
        try {
            Object resultObj = response.get("result");
            if (resultObj instanceof Map) {
                return (Map<String, Object>) resultObj;
            }
            return null;
        } catch (Exception e) {
            log.error("Error extracting result from response", e);
            return null;
        }
    }

    private List<Map<String, Object>> filterProducts(
            List<Map<String, Object>> products,
            Double minPrice,
            Double maxPrice,
            Integer minRam,
            Integer minStorage
    ) {
        log.info("Filtering products with minPrice: {}, maxPrice: {}, minRam: {}, minStorage: {}",
                 minPrice, maxPrice, minRam, minStorage);

        List<Map<String, Object>> filtered = products.stream()
                .filter(product -> {
                    // Filter by price
                    if (minPrice != null || maxPrice != null) {
                        Object priceObj = product.get("priceSale");
                        if (priceObj == null) priceObj = product.get("priceList");
                        if (priceObj == null) {
                            log.debug("Product {} has no price, excluding", product.get("id"));
                            return false;
                        }

                        double price = ((Number) priceObj).doubleValue();
                        if (minPrice != null && price < minPrice) {
                            log.debug("Product {} price {} < minPrice {}, excluding",
                                     product.get("id"), price, minPrice);
                            return false;
                        }
                        if (maxPrice != null && price > maxPrice) {
                            log.debug("Product {} price {} > maxPrice {}, excluding",
                                     product.get("id"), price, maxPrice);
                            return false;
                        }
                    }

                    // Filter by RAM (if available in product data)
                    if (minRam != null && product.containsKey("ramGb")) {
                        Object ramObj = product.get("ramGb");
                        if (ramObj != null) {
                            int ram = ((Number) ramObj).intValue();
                            if (ram < minRam) {
                                log.debug("Product {} RAM {} < minRam {}, excluding",
                                         product.get("id"), ram, minRam);
                                return false;
                            }
                        }
                    }

                    // Filter by storage
                    if (minStorage != null && product.containsKey("storageGb")) {
                        Object storageObj = product.get("storageGb");
                        if (storageObj != null) {
                            int storage = ((Number) storageObj).intValue();
                            if (storage < minStorage) {
                                log.debug("Product {} storage {} < minStorage {}, excluding",
                                         product.get("id"), storage, minStorage);
                                return false;
                            }
                        }
                    }

                    return true;
                })
                .toList();

        log.info("Filtered from {} to {} products", products.size(), filtered.size());
        return filtered;
    }

    private String formatProductsForAI(List<Map<String, Object>> products, int limit) {
        if (products.isEmpty()) {
            return "Không tìm thấy sản phẩm phù hợp với tiêu chí tìm kiếm.";
        }

        StringBuilder formatted = new StringBuilder();
        formatted.append("Tìm thấy ").append(products.size()).append(" sản phẩm:\n\n");

        int count = 0;
        for (Map<String, Object> product : products) {
            if (count >= limit) break;

            String productName = product.get("name").toString();
            String productId = product.get("id").toString();

            // Use existing slug from database, or generate if not available
            String slug;
            if (product.containsKey("slug") && product.get("slug") != null) {
                slug = product.get("slug").toString();
            } else {
                slug = generateSlug(productName);
                log.warn("Product {} missing slug field, generated: {}", productId, slug);
            }

            String productUrl = "http://localhost:3000/products/" + slug + "-" + productId;
            log.debug("Generated product URL: {} for product ID: {}", productUrl, productId);

            formatted.append(++count).append(". **")
                    .append(productName).append("**\n");
            formatted.append("   - Giá: ").append(formatPrice(product.get("priceSale")))
                    .append(" VNĐ\n");
            formatted.append("   - [Xem tại đây](").append(productUrl).append(")\n\n");
        }

        return formatted.toString();
    }

    /**
     * Generate URL-friendly slug from product name
     */
    private String generateSlug(String name) {
        if (name == null || name.isEmpty()) {
            return "product";
        }

        return name.toLowerCase()
                .replaceAll("[àáạảãâầấậẩẫăằắặẳẵ]", "a")
                .replaceAll("[èéẹẻẽêềếệểễ]", "e")
                .replaceAll("[ìíịỉĩ]", "i")
                .replaceAll("[òóọỏõôồốộổỗơờớợởỡ]", "o")
                .replaceAll("[ùúụủũưừứựửữ]", "u")
                .replaceAll("[ỳýỵỷỹ]", "y")
                .replaceAll("[đ]", "d")
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "")
                .replaceAll("-+", "-");
    }

    private String formatProductComparison(List<Map<String, Object>> products) {
        if (products.isEmpty()) {
            return "Không tìm thấy sản phẩm để so sánh.";
        }

        StringBuilder comparison = new StringBuilder();
        comparison.append("**So sánh ").append(products.size()).append(" sản phẩm:**\n\n");

        // Product names
        comparison.append("| Tiêu chí | ");
        for (Map<String, Object> product : products) {
            comparison.append(product.get("name")).append(" | ");
        }
        comparison.append("\n|----------|");
        for (int i = 0; i < products.size(); i++) {
            comparison.append("----------|");
        }
        comparison.append("\n");

        // Prices
        comparison.append("| Giá | ");
        for (Map<String, Object> product : products) {
            comparison.append(formatPrice(product.get("priceSale"))).append(" VNĐ | ");
        }
        comparison.append("\n");

        // Brand (if available)
        comparison.append("| Thương hiệu | ");
        for (Map<String, Object> product : products) {
            Object brand = product.get("brandName");
            comparison.append(brand != null ? brand : "N/A").append(" | ");
        }
        comparison.append("\n");

        return comparison.toString();
    }

    private String formatPrice(Object priceObj) {
        if (priceObj == null) return "Liên hệ";

        try {
            long price = ((Number) priceObj).longValue();
            return String.format("%,d", price).replace(",", ".");
        } catch (Exception e) {
            return priceObj.toString();
        }
    }

    private String getStringParam(Map<String, Object> params, String key) {
        Object value = params.get(key);
        return value != null ? value.toString() : null;
    }

    private Double getDoubleParam(Map<String, Object> params, String key) {
        Object value = params.get(key);
        if (value == null) return null;
        try {
            return ((Number) value).doubleValue();
        } catch (Exception e) {
            return null;
        }
    }

    private Integer getIntParam(Map<String, Object> params, String key) {
        return getIntParam(params, key, null);
    }

    private Integer getIntParam(Map<String, Object> params, String key, Integer defaultValue) {
        Object value = params.get(key);
        if (value == null) return defaultValue;
        try {
            return ((Number) value).intValue();
        } catch (Exception e) {
            return defaultValue;
        }
    }
}
