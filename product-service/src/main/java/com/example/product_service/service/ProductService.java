package com.example.product_service.service;

import com.example.product_service.dto.request.ProductRequest;
import com.example.product_service.dto.response.ProductResponse;
import com.example.product_service.dto.response.ProductVariantResponse;
import com.example.product_service.dto.response.VariantSpecResponse;
import com.example.product_service.entity.*;
import com.example.product_service.exception.AppException;
import com.example.product_service.exception.ErrorCode;
import com.example.product_service.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final BrandRepository brandRepository;
    private final ProductVariantRepository productVariantRepository;
    private final AIImageSearchClient aiImageSearchClient;

    private VariantSpecResponse mapToSpecResponse(VariantSpecEntity specEntity) {
        return VariantSpecResponse.builder()
                .id(specEntity.getId())
                .productVariantId(specEntity.getProductVariant().getId())
                .specAttributeId(specEntity.getSpecAttribute().getId())
                .attributeKey(specEntity.getSpecAttribute().getKeyName())
                .attributeLabel(specEntity.getSpecAttribute().getLabel())
                .value(specEntity.getValue())
                .build();
    }

    private ProductVariantResponse mapToVariantResponse(ProductVariantEntity variantEntity) {
        List<VariantSpecResponse> specs = variantEntity.getSpecs() != null
                ? variantEntity.getSpecs().stream()
                        .map(this::mapToSpecResponse)
                        .collect(Collectors.toList())
                : List.of();

        return ProductVariantResponse.builder()
                .id(variantEntity.getId())
                .productId(variantEntity.getProduct().getId())
                .sku(variantEntity.getSku())
                .color(variantEntity.getColor())
                .ramGb(variantEntity.getRamGb())
                .storageGb(variantEntity.getStorageGb())
                .cpuModel(variantEntity.getCpuModel())
                .igpu(variantEntity.getIgpu())
                .gpuModel(variantEntity.getGpuModel())
                .chipsetModel(variantEntity.getChipsetModel())
                .os(variantEntity.getOs())
                .priceList(variantEntity.getPriceList())
                .priceSale(variantEntity.getPriceSale())
                .stock(variantEntity.getStock())
                .weightG(variantEntity.getWeightG())
                .createdAt(variantEntity.getCreatedAt())
                .updatedAt(variantEntity.getUpdatedAt())
                .specs(specs)
                .build();
    }

    private ProductResponse mapToResponse(ProductEntity entity) {
        // Lấy danh sách variants của product (chỉ để tính giá và stock, không trả về full variants)
        List<ProductVariantEntity> variantEntities = productVariantRepository.findByProductId(entity.getId());

        // Tính minPrice, maxPrice, totalStock từ variants
        Long minPrice = null;
        Long maxPrice = null;
        Integer totalStock = 0;

        if (!variantEntities.isEmpty()) {
            minPrice = variantEntities.stream()
                    .map(ProductVariantEntity::getPriceSale)
                    .filter(price -> price != null && price > 0)
                    .min(Long::compare)
                    .orElse(null);

            maxPrice = variantEntities.stream()
                    .map(ProductVariantEntity::getPriceSale)
                    .filter(price -> price != null && price > 0)
                    .max(Long::compare)
                    .orElse(null);

            totalStock = variantEntities.stream()
                    .map(ProductVariantEntity::getStock)
                    .filter(stock -> stock != null)
                    .mapToInt(Integer::intValue)
                    .sum();
        }

        // Lấy danh sách category IDs và names
        List<Long> categoryIds = entity.getCategories() != null
                ? entity.getCategories().stream()
                        .map(CategoryEntity::getId)
                        .collect(Collectors.toList())
                : List.of();

        List<String> categoryNames = entity.getCategories() != null
                ? entity.getCategories().stream()
                        .map(CategoryEntity::getName)
                        .collect(Collectors.toList())
                : List.of();

        // Lấy brand name
        String brandName = entity.getBrand() != null ? entity.getBrand().getName() : null;

        return ProductResponse.builder()
                .id(entity.getId())
                .categoryIds(categoryIds)
                .brandId(entity.getBrand() != null ? entity.getBrand().getId() : null)
                .name(entity.getName())
                .slug(entity.getSlug())
                .shortDescription(entity.getShortDescription())
                .description(entity.getDescription())
                .priceList(entity.getPriceList())
                .priceSale(entity.getPriceSale())
                .avatar(entity.getAvatar())
                .images(entity.getImages())
                .status(entity.getStatus())
                .firstImage(entity.getFirstImage())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .variants(variantEntities.stream()
                        .map(this::mapToVariantResponse)
                        .toList()) // Không nạp variants ở list view để nhẹ dữ liệu
                .brandName(brandName)
                .categoryNames(categoryNames)
                .minPrice(minPrice)
                .maxPrice(maxPrice)
                .totalStock(totalStock)
                .variantCount(variantEntities.size())
                .build();
    }

    public ProductResponse createProduct(ProductRequest request) {
        // Lấy danh sách categories
        List<CategoryEntity> categories = request.getCategoryIds() != null
                ? request.getCategoryIds().stream()
                        .map(categoryId -> categoryRepository.findById(categoryId)
                                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND)))
                        .collect(Collectors.toList())
                : List.of();

        BrandEntity brand = brandRepository.findById(request.getBrandId())
                .orElseThrow(() -> new AppException(ErrorCode.BRAND_NOT_FOUND));

        ProductEntity entity = ProductEntity.builder()
                .categories(categories)
                .brand(brand)
                .name(request.getName())
                .slug(request.getSlug())
                .shortDescription(request.getShortDescription())
                .description(request.getDescription())
                .priceList(request.getPriceList())
                .priceSale(request.getPriceSale())
                .avatar(request.getAvatar())
                .images(request.getImages())
                .status(request.getStatus())
                .firstImage(request.getFirstImage())
                .build();

        ProductEntity savedEntity = productRepository.save(entity);

        // Index images in AI Image Search service
        indexProductImages(savedEntity);

        return mapToResponse(savedEntity);
    }

    public ProductResponse updateProduct(Long id, ProductRequest request) {
        ProductEntity entity = productRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        // Check if images have changed
        boolean imagesChanged = !java.util.Objects.equals(entity.getAvatar(), request.getAvatar())
                || !java.util.Objects.equals(entity.getImages(), request.getImages())
                || !java.util.Objects.equals(entity.getFirstImage(), request.getFirstImage());

        // Cập nhật danh sách categories
        if (request.getCategoryIds() != null) {
            List<CategoryEntity> categories = request.getCategoryIds().stream()
                    .map(categoryId -> categoryRepository.findById(categoryId)
                            .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND)))
                    .collect(Collectors.toList());
            entity.setCategories(categories);
        }

        BrandEntity brand = brandRepository.findById(request.getBrandId())
                .orElseThrow(() -> new AppException(ErrorCode.BRAND_NOT_FOUND));

        entity.setBrand(brand);
        entity.setName(request.getName());
        entity.setSlug(request.getSlug());
        entity.setShortDescription(request.getShortDescription());
        entity.setDescription(request.getDescription());
        entity.setPriceList(request.getPriceList());
        entity.setPriceSale(request.getPriceSale());
        entity.setAvatar(request.getAvatar());
        entity.setImages(request.getImages());
        entity.setStatus(request.getStatus());
        entity.setFirstImage(request.getFirstImage());

        ProductEntity savedEntity = productRepository.save(entity);

        // Re-index images if they changed
        if (imagesChanged) {
            indexProductImages(savedEntity);
        }

        return mapToResponse(savedEntity);
    }

    public void deleteProduct(Long id) {
        if (!productRepository.existsById(id)) {
            throw new AppException(ErrorCode.PRODUCT_NOT_FOUND);
        }

        // Remove from AI Image Search index
        aiImageSearchClient.removeProduct(id);

        productRepository.deleteById(id);
    }

    /**
     * Index product images in AI Image Search service
     */
    private void indexProductImages(ProductEntity product) {
        try {
            List<String> imageUrls = aiImageSearchClient.collectImageUrls(
                    product.getAvatar(),
                    product.getImages(),
                    product.getFirstImage()
            );

            if (!imageUrls.isEmpty()) {
                var result = aiImageSearchClient.indexProduct(product.getId(), imageUrls);
                log.info("Indexed product {}: {} images indexed, {} failed",
                        product.getId(), result.getImagesIndexed(), result.getImagesFailed());
            }
        } catch (Exception e) {
            log.error("Failed to index images for product {}: {}", product.getId(), e.getMessage());
            // Don't throw - indexing failure should not block product creation/update
        }
    }

    public List<ProductResponse> searchByName(String name) {
        return productRepository.findByNameContainingIgnoreCase(name)
                .stream().map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public Page<ProductResponse> searchByName(String name, Pageable pageable) {
        // Tạo fuzzy pattern từ name để hỗ trợ typo tolerance
        // Ví dụ: "macbok" -> "%m%a%c%b%o%k%" sẽ match "macbook"
        String fuzzyPattern = null;
        if (name != null && !name.trim().isEmpty()) {
            String cleanName = name.trim().toLowerCase().replaceAll("\\s+", "");
            if (!cleanName.isEmpty()) {
                // Tạo pattern với các ký tự cách nhau bằng %
                fuzzyPattern = "%" + String.join("%", cleanName.split("")) + "%";
            }
        }
        
        return productRepository.searchByNameWithFuzzy(
                name != null && !name.trim().isEmpty() ? name.trim() : null,
                fuzzyPattern,
                pageable
        ).map(this::mapToResponse);
    }

    public Page<ProductResponse> getAllProducts(Pageable pageable) {
        return productRepository.findAll(pageable)
                .map(this::mapToResponse);
    }

    public ProductResponse getProductById(Long id) {
        ProductEntity entity = productRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
        return mapToResponse(entity);
    }
    /**
     * Search products với filters: keyword (fuzzy search), price range, brand
     * - Fuzzy search: "macbok" sẽ tìm được "macbook"
     * - Có thể có cả 2 điều kiện (price + brand) hoặc không có điều kiện nào
     */
    /**
 * Search products với filters: keyword (fuzzy search), price range, brand
 * - Fuzzy search: "macbok" sẽ tìm được "macbook"
 * - Có thể có cả 2 điều kiện (price + brand) hoặc không có điều kiện nào
 */
public Page<ProductResponse> searchProducts(
        String keyword,
        Long minPrice,
        Long maxPrice,
        Long brandId,
        Pageable pageable) {

    // Tạo fuzzy pattern từ keyword để hỗ trợ typo tolerance
    String fuzzyPattern = null;
    if (keyword != null && !keyword.trim().isEmpty()) {
        String cleanKeyword = keyword.trim().toLowerCase().replaceAll("\\s+", "");
        if (!cleanKeyword.isEmpty()) {
            fuzzyPattern = "%" + String.join("%", cleanKeyword.split("")) + "%";
        }
    }

    return productRepository.searchProducts(
            keyword != null && !keyword.trim().isEmpty() ? keyword.trim() : null,
            fuzzyPattern,
            minPrice,
            maxPrice,
            brandId,
            pageable
    ).map(this::mapToResponse);
}

/**
 * Search products với filters bao gồm categoryId
 * - Hỗ trợ tìm kiếm theo category (laptop, điện thoại, etc.)
 * - Fuzzy search cho keyword
 * - Filter theo price range, brand, category
 */
public Page<ProductResponse> searchProductsWithCategory(
        String keyword,
        Long minPrice,
        Long maxPrice,
        Long brandId,
        Long categoryId,
        Pageable pageable) {

    // Tạo fuzzy pattern từ keyword để hỗ trợ typo tolerance
    String fuzzyPattern = null;
    if (keyword != null && !keyword.trim().isEmpty()) {
        String cleanKeyword = keyword.trim().toLowerCase().replaceAll("\\s+", "");
        if (!cleanKeyword.isEmpty()) {
            fuzzyPattern = "%" + String.join("%", cleanKeyword.split("")) + "%";
        }
    }

    return productRepository.searchProductsWithCategory(
            keyword != null && !keyword.trim().isEmpty() ? keyword.trim() : null,
            fuzzyPattern,
            minPrice,
            maxPrice,
            brandId,
            categoryId,
            pageable
    ).map(this::mapToResponse);
}

/**
 * Get products by list of IDs
 * - Dùng cho AI search / recommendation / cart
 */
public List<ProductResponse> getProductsByIds(List<Long> ids) {
    if (ids == null || ids.isEmpty()) {
        return List.of();
    }
    return productRepository.findAllById(ids)
            .stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
}

    public Page<ProductResponse> getProductsByBrand(Long brandId, Pageable pageable) {
        if (!brandRepository.existsById(brandId)) {
            throw new AppException(ErrorCode.BRAND_NOT_FOUND);
        }

        return productRepository.findByBrandId(brandId, pageable)
                .map(this::mapToResponse);
    }
}

