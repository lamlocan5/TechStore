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
import com.example.profile.repository.AddressRepository;
import com.example.profile.service.AddressService;

@SpringBootTest
@Transactional
public class AddressServiceCreateAddressTest {

    @Autowired
    private AddressService addressService;

    @Autowired
    private AddressRepository addressRepository;

    /**
     * TEST CASE ID: PRF_23
     */
    @Test
    @DisplayName("PRF_23: Tạo địa chỉ đầu tiên thành công và tự động được đặt là mặc định")
    void PRF_23_createAddress_firstAddress_autoDefault_success() {
        // 1. INPUT
        AddressRequest request = AddressRequest.builder()
                .userId("user-c01")
                .receiverName("Nguyen Van A")
                .phone("0901234501")
                .addressLine("123 Nguyen Trai")
                .province("TP.HCM")
                .district("Quan 1")
                .ward("Phuong Ben Nghe")
                .isDefault(false) // Không đánh dấu default, nhưng vì là đầu tiên → tự động default
                .build();

        // 2. GỌI HÀM
        AddressResponse response = addressService.createAddress(request);

        // 3. EXPECTED OUTPUT
        assertNotNull(response);
        assertNotNull(response.getId());
        assertEquals("user-c01", response.getUserId());
        assertEquals("Nguyen Van A", response.getReceiverName());
        assertTrue(response.getIsDefault(), "Địa chỉ đầu tiên phải được tự động đặt là mặc định!");

        // Kiểm tra trong DB
        Address saved = addressRepository.findById(response.getId()).orElse(null);
        assertNotNull(saved);
        assertTrue(saved.getIsDefault());
    }

    /**
     * TEST CASE ID: PRF_24
     */
    @Test
    @DisplayName("PRF_24: Tạo địa chỉ thứ 2 không đánh dấu default thành công, isDefault = false")
    void PRF_24_createAddress_secondAddressNotDefault_success() {
        // 1. INPUT - Tạo địa chỉ đầu tiên trước
        Address first = new Address();
        first.setUserId("user-c02");
        first.setAddressLine("Dia chi 1");
        first.setIsDefault(true);
        addressRepository.saveAndFlush(first);

        AddressRequest request = AddressRequest.builder()
                .userId("user-c02")
                .receiverName("Tran Thi B")
                .phone("0901234502")
                .addressLine("456 Le Loi")
                .province("Ha Noi")
                .district("Hoan Kiem")
                .ward("Phuong Hang Bong")
                .isDefault(false) // Không đặt default
                .build();

        // 2. GỌI HÀM
        AddressResponse response = addressService.createAddress(request);

        // 3. EXPECTED OUTPUT
        assertNotNull(response);
        assertFalse(response.getIsDefault(), "Địa chỉ thứ 2 không đánh dấu default phải có isDefault = false!");

        // Địa chỉ đầu tiên vẫn là default
        Address firstInDB = addressRepository.findById(first.getId()).orElse(null);
        assertNotNull(firstInDB);
        assertTrue(firstInDB.getIsDefault(), "Địa chỉ đầu tiên vẫn phải là default!");
    }

    /**
     * TEST CASE ID: PRF_25
     */
    @Test
    @DisplayName("PRF_25: Tạo địa chỉ thứ 2 với isDefault=true, địa chỉ cũ mất default")
    void PRF_25_createAddress_secondAddressIsDefault_oldLosesDefault_success() {
        // 1. INPUT - Tạo địa chỉ đầu tiên
        Address first = new Address();
        first.setUserId("user-c03");
        first.setAddressLine("Dia chi 1");
        first.setIsDefault(true);
        first = addressRepository.saveAndFlush(first);
        Integer firstId = first.getId();

        AddressRequest request = AddressRequest.builder()
                .userId("user-c03")
                .receiverName("Le Van C")
                .phone("0901234503")
                .addressLine("789 Tran Hung Dao")
                .province("Da Nang")
                .district("Hai Chau")
                .ward("Phuong Hai Chau 1")
                .isDefault(true) // Đặt địa chỉ mới làm default
                .build();

        // 2. GỌI HÀM
        AddressResponse response = addressService.createAddress(request);

        // 3. EXPECTED OUTPUT
        assertNotNull(response);
        assertTrue(response.getIsDefault(), "Địa chỉ mới phải là default!");

        // Địa chỉ cũ phải mất default
        Address firstInDB = addressRepository.findById(firstId).orElse(null);
        assertNotNull(firstInDB);
        assertFalse(
                firstInDB.getIsDefault(),
                "LỖI HỆ THỐNG: Địa chỉ cũ vẫn còn là default sau khi tạo địa chỉ mới với isDefault=true!");
    }

    /**
     * TEST CASE ID: PRF_26
     */
    @Test
    @DisplayName("PRF_26: Tạo địa chỉ thất bại do userId null (vi phạm NOT NULL constraint)")
    void PRF_26_createAddress_nullUserId_fail() {
        // 1. INPUT
        AddressRequest request = AddressRequest.builder()
                .userId(null) // userId NULL - vi phạm DB constraint
                .receiverName("Test User")
                .phone("0901234504")
                .addressLine("999 Test Street")
                .province("TP.HCM")
                .isDefault(false)
                .build();

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        assertThrows(
                Exception.class,
                () -> {
                    addressService.createAddress(request);
                    addressRepository.flush();
                },
                "LỖI HỆ THỐNG: Hệ thống cho phép tạo địa chỉ với userId null!");
    }

    /**
     * TEST CASE ID: PRF_27
     */
    @Test
    @DisplayName("PRF_27: Tạo địa chỉ thất bại do addressLine để rỗng")
    void PRF_27_createAddress_emptyAddressLine_fail() {
        // 1. INPUT
        AddressRequest request = AddressRequest.builder()
                .userId("user-c05")
                .receiverName("Test User")
                .phone("0901234505")
                .addressLine("") // addressLine rỗng
                .province("TP.HCM")
                .isDefault(false)
                .build();

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        assertThrows(
                Exception.class,
                () -> {
                    addressService.createAddress(request);
                    addressRepository.flush();
                },
                "LỖI HỆ THỐNG: Hệ thống cho phép tạo địa chỉ với addressLine rỗng!");
    }
}
