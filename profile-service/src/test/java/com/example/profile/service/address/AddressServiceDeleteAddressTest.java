package com.example.profile.service.address;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import com.example.profile.entity.Address;
import com.example.profile.exception.AppException;
import com.example.profile.exception.ErrorCode;
import com.example.profile.repository.AddressRepository;
import com.example.profile.service.AddressService;

@SpringBootTest
@Transactional
public class AddressServiceDeleteAddressTest {

    @Autowired
    private AddressService addressService;

    @Autowired
    private AddressRepository addressRepository;

    private Address createAndSaveAddress(String userId, String addressLine, Boolean isDefault) {
        Address address = new Address();
        address.setUserId(userId);
        address.setReceiverName("Nguyen Van A");
        address.setPhone("0900000000");
        address.setAddressLine(addressLine);
        address.setIsDefault(isDefault);
        return addressRepository.saveAndFlush(address);
    }

    /**
     * TEST CASE ID: PRF_41
     */
    @Test
    @DisplayName("PRF_41: Xóa địa chỉ thành công theo ID hợp lệ")
    void PRF_41_deleteAddress_validId_success() {
        // 1. INPUT
        Address saved = createAndSaveAddress("user-d01", "123 Nguyen Trai", true);
        Integer addressId = saved.getId();

        // Đảm bảo tồn tại trước khi xóa
        assertTrue(addressRepository.existsById(addressId));

        // 2. GỌI HÀM
        addressService.deleteAddress(addressId, "user-d01");

        // 3. EXPECTED OUTPUT - Kiểm tra đã xóa khỏi DB
        assertFalse(
                addressRepository.existsById(addressId), "LỖI HỆ THỐNG: Địa chỉ vẫn còn tồn tại trong DB sau khi xóa!");
    }

    /**
     * TEST CASE ID: PRF_42
     */
    @Test
    @DisplayName("PRF_42: Xóa thất bại do ID địa chỉ không tồn tại")
    void PRF_42_deleteAddress_notFound_fail() {
        // 1. INPUT
        Integer invalidId = 999999;

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            addressService.deleteAddress(invalidId, "user-d02");
        });
        assertEquals(ErrorCode.ADDRESS_NOT_FOUND, exception.getErrorCode());
    }

    /**
     * TEST CASE ID: PRF_43
     */
    @Test
    @DisplayName("PRF_43: Xóa thất bại do địa chỉ thuộc về user khác")
    void PRF_43_deleteAddress_wrongOwner_fail() {
        // 1. INPUT - Địa chỉ thuộc user-d03a
        Address saved = createAndSaveAddress("user-d03a", "456 Le Loi", true);

        // 2 & 3. GỌI HÀM với userId của user khác & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            addressService.deleteAddress(saved.getId(), "user-d03b"); // User khác
        });
        assertEquals(ErrorCode.UNAUTHORIZED, exception.getErrorCode());

        // Kiểm tra địa chỉ vẫn còn trong DB (không bị xóa)
        assertTrue(addressRepository.existsById(saved.getId()), "Địa chỉ không được xóa khi user không có quyền!");
    }
}
