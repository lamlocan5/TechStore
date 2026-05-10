package com.example.profile.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.profile.dto.request.AddressRequest;
import com.example.profile.dto.response.AddressResponse;
import com.example.profile.entity.Address;
import com.example.profile.exception.AppException;
import com.example.profile.exception.ErrorCode;
import com.example.profile.mapper.AddressMapper;
import com.example.profile.repository.AddressRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class AddressService {
    AddressRepository addressRepository;
    AddressMapper addressMapper;

    public AddressResponse createAddress(AddressRequest request) {
        Address address = addressMapper.toAddress(request);

        // If this is the first address for the user, set it as default
        boolean isFirstAddress = !addressRepository.existsByUserId(request.getUserId());
        if (isFirstAddress) {
            address.setIsDefault(true);
            log.info("First address for user: {}, setting as default", request.getUserId());
        } else {
            // If this is set as default, ensure no other address is default for this user
            if (Boolean.TRUE.equals(request.getIsDefault())) {
                setDefaultAddressForUser(request.getUserId());
            } else {
                // If not explicitly set, default to false
                address.setIsDefault(false);
            }
        }

        address = addressRepository.save(address);
        log.info("Created address with ID: {} for user: {}", address.getId(), address.getUserId());

        return addressMapper.toAddressResponse(address);
    }

    public AddressResponse updateAddress(Integer addressId, AddressRequest request) {
        Address address =
                addressRepository.findById(addressId).orElseThrow(() -> new AppException(ErrorCode.ADDRESS_NOT_FOUND));

        // Verify that the address belongs to the user
        if (!address.getUserId().equals(request.getUserId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        boolean wasDefault = Boolean.TRUE.equals(address.getIsDefault());
        boolean willBeDefault = Boolean.TRUE.equals(request.getIsDefault());

        // Update address fields
        address.setReceiverName(request.getReceiverName());
        address.setPhone(request.getPhone());
        address.setAddressLine(request.getAddressLine());
        address.setProvince(request.getProvince());
        address.setDistrict(request.getDistrict());
        address.setWard(request.getWard());
        address.setIsDefault(request.getIsDefault());

        // If this is set as default, ensure no other address is default for this user
        if (willBeDefault) {
            setDefaultAddressForUser(request.getUserId());
        } else if (wasDefault) {
            // If removing default from this address, ensure at least one other address is
            // default
            List<Address> otherAddresses = addressRepository.findAllByUserId(request.getUserId()).stream()
                    .filter(addr -> !addr.getId().equals(addressId))
                    .toList();

            if (otherAddresses.isEmpty()) {
                // This is the only address, keep it as default
                address.setIsDefault(true);
                log.warn("Cannot remove default from the only address. Keeping as default.");
            } else {
                // Check if there's already another default address
                boolean hasOtherDefault =
                        otherAddresses.stream().anyMatch(addr -> Boolean.TRUE.equals(addr.getIsDefault()));

                if (!hasOtherDefault) {
                    // Set the first other address as default
                    Address newDefault = otherAddresses.get(0);
                    newDefault.setIsDefault(true);
                    addressRepository.save(newDefault);
                    log.info(
                            "Set address with ID: {} as new default for user: {}",
                            newDefault.getId(),
                            request.getUserId());
                }
            }
        }

        address = addressRepository.save(address);
        log.info("Updated address with ID: {} for user: {}", address.getId(), address.getUserId());

        return addressMapper.toAddressResponse(address);
    }

    public AddressResponse getAddressById(Integer addressId, String userId) {
        Address address =
                addressRepository.findById(addressId).orElseThrow(() -> new AppException(ErrorCode.ADDRESS_NOT_FOUND));

        // Verify that the address belongs to the user
        if (!address.getUserId().equals(userId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        return addressMapper.toAddressResponse(address);
    }

    public AddressResponse getAddressByUserId(String userId) {
        // Lấy địa chỉ mặc định; nếu chưa có thì lấy địa chỉ đầu tiên
        Address address = addressRepository.findByUserIdAndIsDefaultTrue(userId).orElseGet(() -> {
            List<Address> addresses = addressRepository.findAllByUserId(userId);
            if (addresses.isEmpty()) {
                throw new AppException(ErrorCode.ADDRESS_NOT_FOUND);
            }
            return addresses.get(0);
        });

        return addressMapper.toAddressResponse(address);
    }

    public AddressResponse getDefaultAddressByUserId(String userId) {
        Address address = addressRepository
                .findByUserIdAndIsDefaultTrue(userId)
                .orElseThrow(() -> new AppException(ErrorCode.ADDRESS_NOT_FOUND));

        return addressMapper.toAddressResponse(address);
    }

    public List<AddressResponse> getAllAddressesByUserId(String userId) {
        List<Address> addresses = addressRepository.findAllByUserId(userId);
        return addresses.stream().map(addressMapper::toAddressResponse).toList();
    }

    public void deleteAddress(Integer addressId, String userId) {
        Address address =
                addressRepository.findById(addressId).orElseThrow(() -> new AppException(ErrorCode.ADDRESS_NOT_FOUND));

        // Đảm bảo địa chỉ thuộc về user
        if (!address.getUserId().equals(userId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        boolean wasDefault = Boolean.TRUE.equals(address.getIsDefault());

        addressRepository.delete(address);
        log.info("Deleted address with ID: {} for user: {}", addressId, userId);

        // Nếu xóa địa chỉ mặc định, đặt địa chỉ đầu tiên còn lại làm mặc định
        if (wasDefault) {
            List<Address> remainingAddresses = addressRepository.findAllByUserId(userId);
            if (!remainingAddresses.isEmpty()) {
                Address newDefault = remainingAddresses.get(0);
                newDefault.setIsDefault(true);
                addressRepository.save(newDefault);
                log.info("Set address with ID: {} as new default for user: {}", newDefault.getId(), userId);
            }
        }
    }

    public void deleteAddressByUserId(String userId) {
        addressRepository.deleteByUserId(userId);
        log.info("Deleted all addresses for user: {}", userId);
    }

    public AddressResponse setDefaultAddress(Integer addressId, String userId) {
        Address address =
                addressRepository.findById(addressId).orElseThrow(() -> new AppException(ErrorCode.ADDRESS_NOT_FOUND));

        // Đảm bảo địa chỉ thuộc về user
        if (!address.getUserId().equals(userId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        // Đặt các địa chỉ khác của user về không mặc định
        setDefaultAddressForUser(userId);

        // Đánh dấu địa chỉ này là mặc định
        address.setIsDefault(true);
        address = addressRepository.save(address);
        log.info("Set address with ID: {} as default for user: {}", addressId, userId);

        return addressMapper.toAddressResponse(address);
    }

    private void setDefaultAddressForUser(String userId) {
        // Đặt tất cả địa chỉ của user về không mặc định trước
        List<Address> addresses = addressRepository.findAllByUserId(userId);
        addresses.forEach(addr -> {
            if (Boolean.TRUE.equals(addr.getIsDefault())) {
                addr.setIsDefault(false);
            }
        });
        addressRepository.saveAll(addresses);
    }
}
