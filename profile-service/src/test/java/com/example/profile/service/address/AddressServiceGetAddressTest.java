package com.example.profile.service.address;

import static org.junit.jupiter.api.Assertions.*;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import com.example.profile.dto.response.AddressResponse;
import com.example.profile.entity.Address;
import com.example.profile.exception.AppException;
import com.example.profile.exception.ErrorCode;
import com.example.profile.repository.AddressRepository;
import com.example.profile.service.AddressService;

@SpringBootTest
@Transactional
public class AddressServiceGetAddressTest {

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
     * TEST CASE ID: PRF_34
     */
    @Test
    @DisplayName("PRF_34: Xem chi tiết địa chỉ thành công theo ID và userId hợp lệ")
    void PRF_34_getAddressById_validId_success() {
        // 1. INPUT
        Address saved = createAndSaveAddress("user-g01", "123 Nguyen Trai", true);

        // 2. GỌI HÀM
        AddressResponse response = addressService.getAddressById(saved.getId(), "user-g01");

        // 3. EXPECTED OUTPUT
        assertNotNull(response);
        assertEquals(saved.getId(), response.getId());
        assertEquals("user-g01", response.getUserId());
        assertEquals("123 Nguyen Trai", response.getAddressLine());
    }

    /**
     * TEST CASE ID: PRF_35
     */
    @Test
    @DisplayName("PRF_35: Xem địa chỉ thất bại do ID không tồn tại")
    void PRF_35_getAddressById_notFound_fail() {
        // 1. INPUT
        Integer invalidId = 999999;

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            addressService.getAddressById(invalidId, "user-g02");
        });
        assertEquals(ErrorCode.ADDRESS_NOT_FOUND, exception.getErrorCode());
    }

    /**
     * TEST CASE ID: PRF_36
     */
    @Test
    @DisplayName("PRF_36: Xem địa chỉ thất bại do địa chỉ thuộc về user khác")
    void PRF_36_getAddressById_wrongOwner_fail() {
        // 1. INPUT
        Address saved = createAndSaveAddress("user-g03a", "456 Le Loi", true);

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            addressService.getAddressById(saved.getId(), "user-g03b");
        });
        assertEquals(ErrorCode.UNAUTHORIZED, exception.getErrorCode());
    }

    /**
     * TEST CASE ID: PRF_37
     */
    @Test
    @DisplayName("PRF_37: Lấy địa chỉ theo userId thành công khi có địa chỉ default")
    void PRF_37_getAddressByUserId_hasDefault_returnDefault_success() {
        // 1. INPUT
        Address addr1 = createAndSaveAddress("user-g04", "Dia chi 1", false);
        Address addr2 = createAndSaveAddress("user-g04", "Dia chi default", true);

        // 2. GỌI HÀM
        AddressResponse response = addressService.getAddressByUserId("user-g04");

        // 3. EXPECTED OUTPUT
        assertNotNull(response);
        assertEquals(addr2.getId(), response.getId());
        assertTrue(response.getIsDefault());
    }

    /**
     * TEST CASE ID: PRF_38
     */
    @Test
    @DisplayName("PRF_38: Lấy địa chỉ theo userId khi không có địa chỉ default phải trả về rỗng")
    void PRF_38_getAddressByUserId_noDefault_returnEmpty_fail() {
        // 1. INPUT - Tạo trực tiếp qua repository với isDefault = false
        Address addr = new Address();
        addr.setUserId("user-g05");
        addr.setAddressLine("Dia chi khong default");
        addr.setIsDefault(false);
        addressRepository.saveAndFlush(addr);

        // 2. GỌI HÀM
        AddressResponse response = addressService.getAddressByUserId("user-g05");

        // 3. EXPECTED OUTPUT
        assertNull(response, "LỖI HỆ THỐNG: Hệ thống trả về địa chỉ khi không có default, lẽ ra phải trả về rỗng!");
    }

    /**
     * TEST CASE ID: PRF_39
     */
    @Test
    @DisplayName("PRF_39: Lấy toàn bộ danh sách địa chỉ của user thành công")
    void PRF_39_getAllAddressesByUserId_success() {
        // 1. INPUT
        createAndSaveAddress("user-g06", "Dia chi 1", true);
        createAndSaveAddress("user-g06", "Dia chi 2", false);
        createAndSaveAddress("user-g06", "Dia chi 3", false);

        // 2. GỌI HÀM
        List<AddressResponse> results = addressService.getAllAddressesByUserId("user-g06");

        // 3. EXPECTED OUTPUT
        assertNotNull(results);
        assertEquals(3, results.size());
    }

    /**
     * TEST CASE ID: PRF_40
     */
    @Test
    @DisplayName("PRF_40: Lấy toàn bộ địa chỉ khi user không có địa chỉ nào trả về danh sách rỗng")
    void PRF_40_getAllAddressesByUserId_noAddress_returnEmptyList() {
        // 1. INPUT
        String userId = "user-g07-no-address";

        // 2. GỌI HÀM
        List<AddressResponse> results = addressService.getAllAddressesByUserId(userId);

        // 3. EXPECTED OUTPUT
        assertNotNull(results);
        assertTrue(results.isEmpty());
    }
}
