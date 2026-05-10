package com.example.order_service.service.voucher;

import static org.junit.jupiter.api.Assertions.*;

import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;

import com.example.order_service.client.IdentityServiceClient;
import com.example.order_service.dto.response.VoucherResponse;
import com.example.order_service.entity.VoucherEntity;
import com.example.order_service.enums.DiscountType;
import com.example.order_service.enums.MembershipRank;
import com.example.order_service.exception.AppException;
import com.example.order_service.exception.ErrorCode;
import com.example.order_service.repository.VoucherRepository;
import com.example.order_service.service.VoucherService;

@SpringBootTest
@Transactional
public class VoucherServiceGetVoucherTest {

    @Autowired
    private VoucherService voucherService;

    @Autowired
    private VoucherRepository voucherRepository;

    @MockBean
    private IdentityServiceClient identityServiceClient;

    private VoucherEntity createAndSaveVoucher(String code, boolean active) {
        LocalDateTime start = active ? LocalDateTime.now().minusDays(1) : LocalDateTime.now().plusDays(5);
        LocalDateTime end   = active ? LocalDateTime.now().plusDays(30) : LocalDateTime.now().plusDays(35);
        int status = active ? 1 : 0;

        VoucherEntity entity = VoucherEntity.builder()
                .code(code)
                .name("Voucher " + code)
                .discountType(DiscountType.AMOUNT)
                .discountValue(20000L)
                .minOrderTotal(100000L)
                .startAt(start)
                .endAt(end)
                .maxUsage(50)
                .maxPerUser(1)
                .status(status)
                .minRankRequired(MembershipRank.BRONZE)
                .build();
        return voucherRepository.saveAndFlush(entity);
    }

    /**
     * TEST CASE ID: ORD_15
     */
    @Test
    @DisplayName("ORD_15: Lấy chi tiết voucher thành công theo ID hợp lệ")
    void ORD_15_getVoucherById_validId_success() {
        // 1. INPUT
        VoucherEntity saved = createAndSaveVoucher("GETID001", true);

        // 2. GỌI HÀM
        VoucherResponse response = voucherService.getVoucherById(saved.getId());

        // 3. EXPECTED OUTPUT
        assertNotNull(response);
        assertEquals(saved.getId(), response.getId());
        assertEquals("GETID001", response.getCode());
    }

    /**
     * TEST CASE ID: ORD_16
     */
    @Test
    @DisplayName("ORD_16: Lấy voucher thất bại do ID không tồn tại")
    void ORD_16_getVoucherById_notFound_fail() {
        // 1. INPUT
        Long invalidId = 999999L;

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            voucherService.getVoucherById(invalidId);
        });
        assertEquals(ErrorCode.VOUCHER_NOT_FOUND, exception.getErrorCode());
    }

    /**
     * TEST CASE ID: ORD_17
     */
    @Test
    @DisplayName("ORD_17: Lấy chi tiết voucher thành công theo code hợp lệ")
    void ORD_17_getVoucherByCode_validCode_success() {
        // 1. INPUT
        createAndSaveVoucher("GETCODE1", true);

        // 2. GỌI HÀM
        VoucherResponse response = voucherService.getVoucherByCode("GETCODE1");

        // 3. EXPECTED OUTPUT
        assertNotNull(response);
        assertEquals("GETCODE1", response.getCode());
        assertEquals(DiscountType.AMOUNT, response.getDiscountType());
    }

    /**
     * TEST CASE ID: ORD_18
     */
    @Test
    @DisplayName("ORD_18: Lấy voucher theo code thất bại do code không tồn tại")
    void ORD_18_getVoucherByCode_notFound_fail() {
        // 1. INPUT
        String invalidCode = "CODE_NOT_EXIST_99999";

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            voucherService.getVoucherByCode(invalidCode);
        });
        assertEquals(ErrorCode.VOUCHER_NOT_FOUND, exception.getErrorCode());
    }

    /**
     * TEST CASE ID: ORD_19
     */
    @Test
    @DisplayName("ORD_19: Lấy toàn bộ danh sách voucher thành công")
    void ORD_19_getAllVouchers_success() {
        // 1. INPUT - Tạo 3 voucher (cả active và inactive)
        createAndSaveVoucher("ALL001", true);
        createAndSaveVoucher("ALL002", false);
        createAndSaveVoucher("ALL003", true);

        // 2. GỌI HÀM
        List<VoucherResponse> results = voucherService.getAllVouchers();

        // 3. EXPECTED OUTPUT
        assertNotNull(results);
        assertTrue(results.size() >= 3, "Phải trả về ít nhất 3 voucher!");
    }

    /**
     * TEST CASE ID: ORD_20
     */
    @Test
    @DisplayName("ORD_20: Lấy danh sách voucher phân trang thành công")
    void ORD_20_getAllVouchers_pageable_success() {
        // 1. INPUT - Tạo 5 voucher
        for (int i = 1; i <= 5; i++) {
            createAndSaveVoucher("PAGE00" + i, true);
        }
        PageRequest pageRequest = PageRequest.of(0, 2);

        // 2. GỌI HÀM
        Page<VoucherResponse> results = voucherService.getAllVouchers(pageRequest);

        // 3. EXPECTED OUTPUT
        assertNotNull(results);
        assertEquals(2, results.getSize());
        assertTrue(results.getTotalElements() >= 5);
        assertFalse(results.getContent().isEmpty());
    }

    /**
     * TEST CASE ID: ORD_21
     */
    @Test
    @DisplayName("ORD_21: Lấy danh sách voucher đang active, chỉ trả về voucher status=1 và trong thời hạn")
    void ORD_21_getActiveVouchers_returnsOnlyActive() {
        // 1. INPUT - Tạo 2 active + 1 inactive
        createAndSaveVoucher("ACTIVE01", true);
        createAndSaveVoucher("ACTIVE02", true);
        createAndSaveVoucher("INACTIVE1", false); // status=0, chưa bắt đầu

        // 2. GỌI HÀM
        List<VoucherResponse> results = voucherService.getActiveVouchers();

        // 3. EXPECTED OUTPUT - Chỉ có voucher active (status=1, trong thời hạn)
        assertNotNull(results);
        assertTrue(results.size() >= 2);
        assertTrue(results.stream().allMatch(v -> v.getStatus() == 1),
                "LỖI HỆ THỐNG: Danh sách active chứa voucher không active (status != 1)!");
        assertFalse(results.stream().anyMatch(v -> "INACTIVE1".equals(v.getCode())),
                "LỖI HỆ THỐNG: Voucher inactive lọt vào danh sách active!");
    }
}
