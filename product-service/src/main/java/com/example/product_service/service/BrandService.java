package com.example.product_service.service;

import com.example.product_service.dto.request.BrandRequest;
import com.example.product_service.dto.response.BrandResponse;
import com.example.product_service.entity.BrandEntity;
import com.example.product_service.exception.AppException;
import com.example.product_service.exception.ErrorCode;
import com.example.product_service.repository.BrandRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import jakarta.transaction.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class BrandService {

    private final BrandRepository brandRepository;

    private BrandResponse mapToResponse(BrandEntity entity) {
        return BrandResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .logo(entity.getLogo())
                .build();
    }

    public BrandResponse createBrand(BrandRequest request) {
        BrandEntity entity = BrandEntity.builder()
                .name(request.getName())
                .logo(request.getLogo())
                .build();

        return mapToResponse(brandRepository.save(entity));
    }

    public BrandResponse updateBrand(Long id, BrandRequest request) {
        BrandEntity entity = brandRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.BRAND_NOT_FOUND));

        entity.setName(request.getName());
        entity.setLogo(request.getLogo());

        return mapToResponse(brandRepository.save(entity));
    }

    public void deleteBrand(Long id) {
        if (!brandRepository.existsById(id)) {
            throw new AppException(ErrorCode.BRAND_NOT_FOUND);
        }
        brandRepository.deleteById(id);
    }

    public List<BrandResponse> searchByName(String name) {
        return brandRepository.findByNameContainingIgnoreCase(name)
                .stream().map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public Page<BrandResponse> searchByName(String name, Pageable pageable) {
        return brandRepository.findByNameContainingIgnoreCase(name, pageable)
                .map(this::mapToResponse);
    }

    public List<BrandResponse> getAllBrands() {
        return brandRepository.findAll()
                .stream().map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public Page<BrandResponse> getAllBrands(Pageable pageable) {
        return brandRepository.findAll(pageable)
                .map(this::mapToResponse);
    }

    public BrandResponse getBrandById(Long id) {
        BrandEntity entity = brandRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.BRAND_NOT_FOUND));

        return mapToResponse(entity);
    }
}
