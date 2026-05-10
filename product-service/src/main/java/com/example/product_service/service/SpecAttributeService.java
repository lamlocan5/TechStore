package com.example.product_service.service;

import com.example.product_service.dto.request.SpecAttributeRequest;
import com.example.product_service.dto.response.SpecAttributeResponse;
import com.example.product_service.entity.SpecAttributeEntity;
import com.example.product_service.exception.AppException;
import com.example.product_service.exception.ErrorCode;
import com.example.product_service.repository.SpecAttributeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class SpecAttributeService {

    private final SpecAttributeRepository repo;

    private SpecAttributeResponse mapToResponse(SpecAttributeEntity e) {
        return SpecAttributeResponse.builder()
                .id(e.getId())
                .keyName(e.getKeyName())
                .label(e.getLabel())
                .dataType(e.getDataType())
                .searchable(e.getSearchable())
                .facetable(e.getFacetable())
                .build();
    }

    public SpecAttributeResponse create(SpecAttributeRequest req) {
        SpecAttributeEntity e = SpecAttributeEntity.builder()
                .keyName(req.getKeyName())
                .label(req.getLabel())
                .dataType(req.getDataType())
                .searchable(req.getSearchable())
                .facetable(req.getFacetable())
                .build();
        return mapToResponse(repo.save(e));
    }

    public SpecAttributeResponse update(Long id, SpecAttributeRequest req) {
        SpecAttributeEntity e = repo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.SPEC_ATTRIBUTE_NOT_FOUND));
        e.setKeyName(req.getKeyName());
        e.setLabel(req.getLabel());
        e.setDataType(req.getDataType());
        e.setSearchable(req.getSearchable());
        e.setFacetable(req.getFacetable());
        return mapToResponse(repo.save(e));
    }

    public void delete(Long id) {
        repo.deleteById(id);
    }

    public List<SpecAttributeResponse> getAll() {
        return repo.findAll().stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public Page<SpecAttributeResponse> getAll(Pageable pageable) {
        return repo.findAll(pageable).map(this::mapToResponse);
    }

    public List<SpecAttributeResponse> search(String label) {
        return repo.findByLabelContainingIgnoreCase(label).stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public Page<SpecAttributeResponse> search(String label, Pageable pageable) {
        return repo.findByLabelContainingIgnoreCase(label, pageable).map(this::mapToResponse);
    }
}
