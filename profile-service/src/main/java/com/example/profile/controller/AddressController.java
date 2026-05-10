package com.example.profile.controller;

import java.util.List;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.profile.dto.ApiResponse;
import com.example.profile.dto.request.AddressRequest;
import com.example.profile.dto.response.AddressResponse;
import com.example.profile.service.AddressService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/addresses")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class AddressController {
    AddressService addressService;

    private String getAuthenticatedUserId() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    @PostMapping
    ApiResponse<AddressResponse> createAddress(@RequestBody AddressRequest request) {
        String userId = getAuthenticatedUserId();
        log.info("Creating address for user: {}", userId);
        // Override userId from request with authenticated user ID
        request.setUserId(userId);
        AddressResponse response = addressService.createAddress(request);
        return ApiResponse.<AddressResponse>builder().result(response).build();
    }

    @PutMapping("/{addressId}")
    ApiResponse<AddressResponse> updateAddress(@PathVariable Integer addressId, @RequestBody AddressRequest request) {
        String userId = getAuthenticatedUserId();
        log.info("Updating address with ID: {} for user: {}", addressId, userId);
        // Override userId from request with authenticated user ID
        request.setUserId(userId);
        AddressResponse response = addressService.updateAddress(addressId, request);
        return ApiResponse.<AddressResponse>builder().result(response).build();
    }

    @GetMapping("/{addressId}")
    ApiResponse<AddressResponse> getAddressById(@PathVariable Integer addressId) {
        String userId = getAuthenticatedUserId();
        log.info("Getting address with ID: {} for user: {}", addressId, userId);
        AddressResponse response = addressService.getAddressById(addressId, userId);
        return ApiResponse.<AddressResponse>builder().result(response).build();
    }

    @GetMapping("/my-address")
    ApiResponse<AddressResponse> getMyAddress() {
        String userId = getAuthenticatedUserId();
        log.info("Getting address for user: {}", userId);
        AddressResponse response = addressService.getAddressByUserId(userId);
        return ApiResponse.<AddressResponse>builder().result(response).build();
    }

    @GetMapping("/my-address/default")
    ApiResponse<AddressResponse> getMyDefaultAddress() {
        String userId = getAuthenticatedUserId();
        log.info("Getting default address for user: {}", userId);
        AddressResponse response = addressService.getDefaultAddressByUserId(userId);
        return ApiResponse.<AddressResponse>builder().result(response).build();
    }

    @GetMapping("/my-addresses")
    ApiResponse<List<AddressResponse>> getMyAddresses() {
        String userId = getAuthenticatedUserId();
        log.info("Getting all addresses for user: {}", userId);
        List<AddressResponse> responses = addressService.getAllAddressesByUserId(userId);
        return ApiResponse.<List<AddressResponse>>builder().result(responses).build();
    }

    @DeleteMapping("/{addressId}")
    ApiResponse<Void> deleteAddress(@PathVariable Integer addressId) {
        String userId = getAuthenticatedUserId();
        log.info("Deleting address with ID: {} for user: {}", addressId, userId);
        addressService.deleteAddress(addressId, userId);
        return ApiResponse.<Void>builder().build();
    }

    @DeleteMapping("/my-addresses")
    ApiResponse<Void> deleteMyAddresses() {
        String userId = getAuthenticatedUserId();
        log.info("Deleting all addresses for user: {}", userId);
        addressService.deleteAddressByUserId(userId);
        return ApiResponse.<Void>builder().build();
    }

    @PutMapping("/{addressId}/set-default")
    ApiResponse<AddressResponse> setDefaultAddress(@PathVariable Integer addressId) {
        String userId = getAuthenticatedUserId();
        log.info("Setting address with ID: {} as default for user: {}", addressId, userId);
        AddressResponse response = addressService.setDefaultAddress(addressId, userId);
        return ApiResponse.<AddressResponse>builder().result(response).build();
    }
}
