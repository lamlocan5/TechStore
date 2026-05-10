package com.example.product_service.service;

import com.example.product_service.dto.request.ProductVariantRequest;
import com.example.product_service.dto.response.ProductBasicInfo;
import com.example.product_service.dto.response.ProductVariantResponse;
import com.example.product_service.dto.response.VariantSpecResponse;
import com.example.product_service.dto.response.VariantStatsResponse;
import com.example.product_service.entity.BrandEntity;
import com.example.product_service.entity.ProductEntity;
import com.example.product_service.entity.ProductVariantEntity;
import com.example.product_service.entity.VariantSpecEntity;
import com.example.product_service.exception.AppException;
import com.example.product_service.exception.ErrorCode;
import com.example.product_service.repository.BrandRepository;
import com.example.product_service.repository.ProductRepository;
import com.example.product_service.repository.ProductVariantRepository;
import com.example.product_service.repository.VariantSpecRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ProductVariantService {

    private final ProductVariantRepository variantRepo;
    private final ProductRepository productRepo;
    private final VariantSpecRepository variantSpecRepo;
    private final BrandRepository brandRepo;

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

    private ProductVariantResponse mapToResponse(ProductVariantEntity e) {
        List<VariantSpecEntity> variantSpecEntities = variantSpecRepo.findByProductVariantId(e.getId());
        List<VariantSpecResponse> variantSpecResponses = variantSpecEntities.stream()
                .map(this::mapToSpecResponse)
                .toList();

        // Build product basic info with brand name
        ProductEntity product = e.getProduct();
        ProductBasicInfo productInfo = null;
        if (product != null) {
            String brandName = null;
            if (product.getBrand().getId() != null) {
                brandName = brandRepo.findById(product.getBrand().getId())
                        .map(BrandEntity::getName)
                        .orElse(null);
            }
            
            productInfo = ProductBasicInfo.builder()
                    .id(product.getId())
                    .name(product.getName())
                    .brandId(product.getBrand().getId())
                    .brandName(brandName)
                    .build();
        }

        return ProductVariantResponse.builder()
                .id(e.getId())
                .productId(e.getProduct().getId())
                .sku(e.getSku())
                .color(e.getColor())
                .ramGb(e.getRamGb())
                .storageGb(e.getStorageGb())
                .cpuModel(e.getCpuModel())
                .igpu(e.getIgpu())
                .gpuModel(e.getGpuModel())
                .chipsetModel(e.getChipsetModel())
                .os(e.getOs())
                .priceList(e.getPriceList())
                .priceSale(e.getPriceSale())
                .stock(e.getStock())
                .weightG(e.getWeightG())
                .allowPreorder(e.getAllowPreorder())
                .specs(variantSpecResponses)
                .product(productInfo)
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .build();
    }

    public ProductVariantResponse create(ProductVariantRequest req) {
        ProductEntity product = productRepo.findById(req.getProductId())
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        ProductVariantEntity e = ProductVariantEntity.builder()
                .product(product)
                .sku(req.getSku())
                .color(req.getColor())
                .ramGb(req.getRamGb())
                .storageGb(req.getStorageGb())
                .cpuModel(req.getCpuModel())
                .igpu(req.getIgpu())
                .gpuModel(req.getGpuModel())
                .chipsetModel(req.getChipsetModel())
                .os(req.getOs())
                .priceList(req.getPriceList())
                .priceSale(req.getPriceSale())
                .stock(req.getStock())
                .weightG(req.getWeightG())
                .allowPreorder(req.getAllowPreorder())
                .createdAt(LocalDateTime.now())
                .build();

        return mapToResponse(variantRepo.save(e));
    }

    public ProductVariantResponse update(Long id, ProductVariantRequest req) {
        ProductVariantEntity e = variantRepo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_VARIANT_NOT_FOUND));

        e.setSku(req.getSku());
        e.setColor(req.getColor());
        e.setRamGb(req.getRamGb());
        e.setStorageGb(req.getStorageGb());
        e.setCpuModel(req.getCpuModel());
        e.setIgpu(req.getIgpu());
        e.setGpuModel(req.getGpuModel());
        e.setChipsetModel(req.getChipsetModel());
        e.setOs(req.getOs());
        e.setPriceList(req.getPriceList());
        e.setPriceSale(req.getPriceSale());
        e.setStock(req.getStock());
        e.setWeightG(req.getWeightG());
        e.setAllowPreorder(req.getAllowPreorder());
        e.setUpdatedAt(LocalDateTime.now());

        return mapToResponse(variantRepo.save(e));
    }

    public void delete(Long id) {
        variantRepo.deleteById(id);
    }

    public List<ProductVariantResponse> findAll() {
        // Chỉ trả về biến thể còn hàng (>0)
        return variantRepo.findByStockGreaterThan(0).stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public Page<ProductVariantResponse> findAll(Pageable pageable) {
        // Chỉ trả về biến thể còn hàng (>0)
        return variantRepo.findByStockGreaterThan(0, pageable).map(this::mapToResponse);
    }

    public List<ProductVariantResponse> findByProduct(Long productId) {
        return variantRepo.findByProductId(productId).stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public List<ProductVariantResponse> searchBySku(String sku) {
        return variantRepo.findBySkuContainingIgnoreCase(sku).stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public Page<ProductVariantResponse> searchBySku(String sku, Pageable pageable) {
        return variantRepo.findBySkuContainingIgnoreCase(sku, pageable).map(this::mapToResponse);
    }

    public ProductVariantResponse getById(Long id) {
        ProductVariantEntity e = variantRepo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_VARIANT_NOT_FOUND));
        return mapToResponse(e);
    }

    public ProductVariantResponse addStock(Long id, Integer quantity) {
        if (quantity == null || quantity <= 0) {
            throw new AppException(ErrorCode.INVALID_STOCK_QUANTITY);
        }
        
        ProductVariantEntity e = variantRepo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_VARIANT_NOT_FOUND));
        
        int currentStock = e.getStock() != null ? e.getStock() : 0;
        e.setStock(currentStock + quantity);
        e.setUpdatedAt(LocalDateTime.now());
        
        return mapToResponse(variantRepo.save(e));
    }

    public ProductVariantResponse reduceStock(Long id, Integer quantity) {
        if (quantity == null || quantity <= 0) {
            throw new AppException(ErrorCode.INVALID_STOCK_QUANTITY);
        }
        
        ProductVariantEntity e = variantRepo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_VARIANT_NOT_FOUND));
        
        int currentStock = e.getStock() != null ? e.getStock() : 0;
        if (currentStock < quantity) {
            throw new AppException(ErrorCode.INSUFFICIENT_STOCK);
        }
        
        e.setStock(currentStock - quantity);
        e.setUpdatedAt(LocalDateTime.now());
        
        return mapToResponse(variantRepo.save(e));
    }

    public ProductVariantResponse setStock(Long id, Integer quantity) {
        if (quantity == null || quantity < 0) {
            throw new AppException(ErrorCode.INVALID_STOCK_QUANTITY);
        }
        
        ProductVariantEntity e = variantRepo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_VARIANT_NOT_FOUND));
        
        e.setStock(quantity);
        e.setUpdatedAt(LocalDateTime.now());
        
        return mapToResponse(variantRepo.save(e));
    }

    public boolean checkStockAvailability(Long variantId, Integer requestedQuantity) {
        ProductVariantEntity e = variantRepo.findById(variantId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_VARIANT_NOT_FOUND));
        
        int currentStock = e.getStock() != null ? e.getStock() : 0;
        return currentStock >= requestedQuantity;
    }

    public void reserveStock(Long variantId, Integer quantity) {
        reduceStock(variantId, quantity);
    }

    public void releaseStock(Long variantId, Integer quantity) {
        addStock(variantId, quantity);
    }

    public VariantStatsResponse getStatistics() {
        Long totalVariants = variantRepo.count();
        Long totalStock = variantRepo.getTotalStock();
        
        return VariantStatsResponse.builder()
                .totalVariants(totalVariants)
                .totalStock(totalStock != null ? totalStock : 0L)
                .build();
    }
}
