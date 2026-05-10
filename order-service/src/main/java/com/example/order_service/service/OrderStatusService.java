package com.example.order_service.service;

import com.example.order_service.dto.request.OrderStatusRequest;
import com.example.order_service.dto.response.OrderStatusResponse;
import com.example.order_service.entity.OrderStatusEntity;
import com.example.order_service.exception.AppException;
import com.example.order_service.exception.ErrorCode;
import com.example.order_service.repository.OrderStatusRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class OrderStatusService {

    private final OrderStatusRepository orderStatusRepository;

    private OrderStatusResponse mapToResponse(OrderStatusEntity entity) {
        return OrderStatusResponse.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .name(entity.getName())
                .description(entity.getDescription())
                .color(entity.getColor())
                .displayOrder(entity.getDisplayOrder())
                .isActive(entity.getIsActive())
                .isDefault(entity.getIsDefault())
                .build();
    }

    public OrderStatusResponse create(OrderStatusRequest request) {
        // Check if code already exists
        if (orderStatusRepository.existsByCode(request.getCode())) {
            throw new AppException(ErrorCode.INVALID_KEY); // You may want to add a specific error code
        }

        // If this is set as default, unset other defaults
        if (Boolean.TRUE.equals(request.getIsDefault())) {
            List<OrderStatusEntity> existingDefaults = orderStatusRepository.findAll()
                    .stream()
                    .filter(OrderStatusEntity::getIsDefault)
                    .collect(Collectors.toList());
            existingDefaults.forEach(status -> status.setIsDefault(false));
            orderStatusRepository.saveAll(existingDefaults);
        }

        OrderStatusEntity entity = OrderStatusEntity.builder()
                .code(request.getCode())
                .name(request.getName())
                .description(request.getDescription())
                .color(request.getColor())
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .isDefault(request.getIsDefault() != null ? request.getIsDefault() : false)
                .build();

        return mapToResponse(orderStatusRepository.save(entity));
    }

    public OrderStatusResponse update(Long id, OrderStatusRequest request) {
        OrderStatusEntity entity = orderStatusRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_KEY)); // You may want to add a specific error code

        // Check if code is being changed and if new code already exists
        if (!entity.getCode().equals(request.getCode()) && orderStatusRepository.existsByCode(request.getCode())) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }

        // If this is set as default, unset other defaults
        if (Boolean.TRUE.equals(request.getIsDefault()) && !entity.getIsDefault()) {
            List<OrderStatusEntity> existingDefaults = orderStatusRepository.findAll()
                    .stream()
                    .filter(OrderStatusEntity::getIsDefault)
                    .filter(s -> !s.getId().equals(id))
                    .collect(Collectors.toList());
            existingDefaults.forEach(status -> status.setIsDefault(false));
            orderStatusRepository.saveAll(existingDefaults);
        }

        entity.setCode(request.getCode());
        entity.setName(request.getName());
        entity.setDescription(request.getDescription());
        entity.setColor(request.getColor());
        if (request.getDisplayOrder() != null) {
            entity.setDisplayOrder(request.getDisplayOrder());
        }
        if (request.getIsActive() != null) {
            entity.setIsActive(request.getIsActive());
        }
        if (request.getIsDefault() != null) {
            entity.setIsDefault(request.getIsDefault());
        }

        return mapToResponse(orderStatusRepository.save(entity));
    }

    public void delete(Long id) {
        OrderStatusEntity entity = orderStatusRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_KEY));

        // Prevent deletion if it's the only status or if there are orders using it
        // You may want to add more validation here
        orderStatusRepository.delete(entity);
    }

    public List<OrderStatusResponse> getAll() {
        return orderStatusRepository.findAllByOrderByDisplayOrderAsc()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<OrderStatusResponse> getActive() {
        return orderStatusRepository.findByIsActiveTrueOrderByDisplayOrderAsc()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public OrderStatusResponse getById(Long id) {
        OrderStatusEntity entity = orderStatusRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_KEY));
        return mapToResponse(entity);
    }

    public OrderStatusResponse getByCode(String code) {
        OrderStatusEntity entity = orderStatusRepository.findByCode(code)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_KEY));
        return mapToResponse(entity);
    }
}

