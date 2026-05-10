package com.example.profile.service.address;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import com.example.profile.dto.request.AddressRequest;
import com.example.profile.dto.response.AddressResponse;
import com.example.profile.entity.Address;
import com.example.profile.exception.AppException;
import com.example.profile.exception.ErrorCode;
import com.example.profile.repository.AddressRepository;
import com.example.profile.service.AddressService;

@SpringBootTest
@Transactional
public class AddressServiceUpdateAddressTest {

    @Autowired
    private AddressService addressService;

    @Autowired
    private AddressRepository addressRepository;

    /**
     * Helper: Tạo và lưu Address vào DB
     */
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
     * TEST CASE ID: PRF_28
     */
    @Test
    @DisplayName("PRF_28: Cập nhật địa chỉ thành công với thông tin hợp lệ")
    void PRF_28_updateAddress_validData_success() {
        // 1. INPUT
        Address saved = createAndSaveAddress("user-u01", "Dia chi cu", true);

        AddressRequest request = AddressRequest.builder()
                .userId("user-u01")
                .receiverName("Tran Thi B Updated")
                .phone("0912345678")
                .addressLine("456 Le Loi Moi")
                .province("Ha Noi")
                .district("Hoan Kiem")
                .ward("Phuong Hang Bac")
                .isDefault(true)
                .build();

        // 2. GỌI HÀM
        AddressResponse response = addressService.updateAddress(saved.getId(), request);

        // 3. EXPECTED OUTPUT
        assertNotNull(response);
        assertEquals("Tran Thi B Updated", response.getReceiverName());
        assertEquals("456 Le Loi Moi", response.getAddressLine());
        assertEquals("0912345678", response.getPhone());

        // Kiểm tra trong DB
        Address updated = addressRepository.findById(saved.getId()).orElse(null);
        assertNotNull(updated);
        assertEquals("Tran Thi B Updated", updated.getReceiverName());
    }

    /**
     * TEST CASE ID: PRF_29
     */
    @Test
    @DisplayName("PRF_29: Cập nhật thất bại do ID địa chỉ không tồn tại")
    void PRF_29_updateAddress_notFound_fail() {
        // 1. INPUT
        Integer invalidId = 999999;
        AddressRequest request = AddressRequest.builder()
                .userId("user-u02")
                .receiverName("Test User")
                .phone("0900000002")
                .addressLine("Some Address")
                .isDefault(false)
                .build();

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            addressService.updateAddress(invalidId, request);
        });
        assertEquals(ErrorCode.ADDRESS_NOT_FOUND, exception.getErrorCode());
    }

    /**
     * TEST CASE ID: PRF_30
     */
    @Test
    @DisplayName("PRF_30: Cập nhật thất bại do địa chỉ thuộc về user khác")
    void PRF_30_updateAddress_wrongOwner_fail() {
        // 1. INPUT - Tạo địa chỉ thuộc user-u03a
        Address saved = createAndSaveAddress("user-u03a", "Dia chi cua A", true);

        // Thử cập nhật với userId của user-u03b (user khác)
        AddressRequest request = AddressRequest.builder()
                .userId("user-u03b") // Khác với owner
                .receiverName("Hacker")
                .phone("0900000003")
                .addressLine("Dia chi bi chiếm")
                .isDefault(false)
                .build();

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            addressService.updateAddress(saved.getId(), request);
        });
        assertEquals(ErrorCode.UNAUTHORIZED, exception.getErrorCode());
    }

    /**
     * TEST CASE ID: PRF_31
     */
    @Test
    @DisplayName("PRF_31: Cập nhật đặt địa chỉ thành default, các địa chỉ khác của user mất default")
    void PRF_31_updateAddress_setDefault_removesOtherDefaults_success() {
        // 1. INPUT - Tạo 2 địa chỉ, địa chỉ 1 là default
        Address addr1 = createAndSaveAddress("user-u04", "Dia chi 1", true);
        Address addr2 = createAndSaveAddress("user-u04", "Dia chi 2", false);

        // Cập nhật addr2 thành default
        AddressRequest request = AddressRequest.builder()
                .userId("user-u04")
                .receiverName("Nguyen Van A")
                .phone("0900000004")
                .addressLine("Dia chi 2 updated")
                .isDefault(true) // Đặt addr2 thành default
                .build();

        // 2. GỌI HÀM
        AddressResponse response = addressService.updateAddress(addr2.getId(), request);

        // 3. EXPECTED OUTPUT
        assertNotNull(response);
        assertTrue(response.getIsDefault(), "Địa chỉ 2 phải được đặt thành default!");

        // Địa chỉ 1 phải mất default
        Address addr1InDB = addressRepository.findById(addr1.getId()).orElse(null);
        assertNotNull(addr1InDB);
        assertFalse(
                addr1InDB.getIsDefault(),
                "LỖI HỆ THỐNG: Địa chỉ 1 vẫn còn là default sau khi địa chỉ 2 được đặt làm default!");
    }

    /**
     * TEST CASE ID: PRF_32
     */
    @Test
    @DisplayName("PRF_32: Bỏ default khi chỉ có 1 địa chỉ duy nhất, địa chỉ vẫn giữ nguyên là default")
    void PRF_32_updateAddress_removeDefaultFromOnlyAddress_keepDefault_success() {
        // 1. INPUT - Chỉ có 1 địa chỉ duy nhất và đang là default
        Address addr = createAndSaveAddress("user-u05", "Dia chi duy nhat", true);

        AddressRequest request = AddressRequest.builder()
                .userId("user-u05")
                .receiverName("Nguyen Van A")
                .phone("0900000005")
                .addressLine("Dia chi duy nhat")
                .isDefault(false) // Cố tình bỏ default
                .build();

        // 2. GỌI HÀM
        AddressResponse response = addressService.updateAddress(addr.getId(), request);

        // 3. EXPECTED OUTPUT - Hệ thống phải giữ nguyên default vì không còn địa chỉ nào khác
        assertNotNull(response);
        assertTrue(response.getIsDefault(), "LỖI HỆ THỐNG: Địa chỉ duy nhất không được phép bị bỏ default!");
    }

    /**
     * TEST CASE ID: PRF_33
     */
    @Test
    @DisplayName("PRF_33: Bỏ default khi có nhiều địa chỉ, không có địa chỉ nào được tự động chuyển thành default")
    void PRF_33_updateAddress_removeDefault_noOtherAddressBecomesDefault_fail() {
        // 1. INPUT - Tạo 2 địa chỉ, địa chỉ 1 là default
        Address addr1 = createAndSaveAddress("user-u06", "Dia chi 1", true);
        Address addr2 = createAndSaveAddress("user-u06", "Dia chi 2", false);

        // Bỏ default của addr1
        AddressRequest request = AddressRequest.builder()
                .userId("user-u06")
                .receiverName("Nguyen Van A")
                .phone("0900000006")
                .addressLine("Dia chi 1")
                .isDefault(false) // Bỏ default
                .build();

        // 2. GỌI HÀM
        addressService.updateAddress(addr1.getId(), request);

        // 3. EXPECTED OUTPUT - Địa chỉ 2 KHÔNG được tự động trở thành default
        Address addr2InDB = addressRepository.findById(addr2.getId()).orElse(null);
        assertNotNull(addr2InDB);
        assertFalse(
                addr2InDB.getIsDefault(),
                "LỖI HỆ THỐNG: Hệ thống tự động chuyển default sang địa chỉ khác khi bỏ default, lẽ ra không được tự động chuyển!");
    }
}
