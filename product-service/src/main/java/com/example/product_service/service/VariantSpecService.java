package com.example.product_service.service;

import com.example.product_service.dto.request.VariantSpecRequest;
import com.example.product_service.dto.response.VariantSpecResponse;
import com.example.product_service.entity.*;
import com.example.product_service.exception.AppException;
import com.example.product_service.exception.ErrorCode;
import com.example.product_service.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class VariantSpecService {

    private final VariantSpecRepository repo;
    private final ProductVariantRepository variantRepo;
    private final SpecAttributeRepository attrRepo;

    private VariantSpecResponse mapToResponse(VariantSpecEntity e) {
        return VariantSpecResponse.builder()
                .id(e.getId())
                .productVariantId(e.getProductVariant().getId())
                .specAttributeId(e.getSpecAttribute().getId())
                .attributeKey(e.getSpecAttribute().getKeyName())
                .attributeLabel(e.getSpecAttribute().getLabel())
                .value(e.getValue())
                .build();
    }

    public VariantSpecResponse create(VariantSpecRequest req) {
        ProductVariantEntity variant = variantRepo.findById(req.getProductVariantId())
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_VARIANT_NOT_FOUND));
        SpecAttributeEntity attr = attrRepo.findById(req.getSpecAttributeId())
                .orElseThrow(() -> new AppException(ErrorCode.SPEC_ATTRIBUTE_NOT_FOUND));

        VariantSpecEntity e = VariantSpecEntity.builder()
                .id(req.getId())
                .productVariant(variant)
                .specAttribute(attr)
                .value(req.getValue())
                .build();

        return mapToResponse(repo.save(e));
    }

    public void delete(String id) {
        repo.deleteById(id);
    }

    public List<VariantSpecResponse> findByVariant(Long variantId) {
        return repo.findByProductVariantId(variantId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }
}
