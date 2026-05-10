package com.example.order_service.service.voucher;

import static org.junit.jupiter.api.Assertions.*;

import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.transaction.annotation.Transactional;

import com.example.order_service.client.IdentityServiceClient;
import com.example.order_service.dto.request.VoucherRequest;
import com.example.order_service.dto.response.VoucherResponse;
import com.example.order_service.enums.DiscountType;
import com.example.order_service.enums.MembershipRank;
import com.example.order_service.repository.VoucherRepository;
import com.example.order_service.service.VoucherService;

@SpringBootTest
@Transactional
public class VoucherServiceCreateVoucherTest {

    @Autowired
    private VoucherService voucherService;

    @Autowired
    private VoucherRepository voucherRepository;

    @MockBean
    private IdentityServiceClient identityServiceClient;

    private VoucherRequest buildValidRequest(String code, DiscountType type, Long value) {
        return VoucherRequest.builder()
                .code(code)
                .name("Voucher " + code)
                .discountType(type)
                .discountValue(value)
                .minOrderTotal(100000L)
                .startAt(LocalDateTime.now().minusDays(1))
                .endAt(LocalDateTime.now().plusDays(30))
                .maxUsage(100)
                .maxPerUser(1)
                .status(1)
                .minRankRequired(MembershipRank.BRONZE)
                .build();
    }

    /**
     * TEST CASE ID: ORD_01
     */
    @Test
    @DisplayName("ORD_01: Tạo voucher giảm theo % thành công")
    void ORD_01_createVoucher_percentDiscount_success() {
        // 1. INPUT
        VoucherRequest request = buildValidRequest("SUMMER10", DiscountType.PERCENT, 10L);
        request.setDiscountMaxValue(50000L);

        // 2. GỌI HÀM
        VoucherResponse response = voucherService.createVoucher(request);

        // 3. EXPECTED OUTPUT
        assertNotNull(response);
        assertNotNull(response.getId());
        assertEquals("SUMMER10", response.getCode());
        assertEquals(DiscountType.PERCENT, response.getDiscountType());
        assertEquals(10L, response.getDiscountValue());

        // Kiểm tra trong DB
        assertTrue(voucherRepository.existsById(response.getId()));
    }

    /**
     * TEST CASE ID: ORD_02
     */
    @Test
    @DisplayName("ORD_02: Tạo voucher giảm tiền mặt (AMOUNT) thành công")
    void ORD_02_createVoucher_amountDiscount_success() {
        // 1. INPUT
        VoucherRequest request = buildValidRequest("FLAT50K", DiscountType.AMOUNT, 50000L);

        // 2. GỌI HÀM
        VoucherResponse response = voucherService.createVoucher(request);

        // 3. EXPECTED OUTPUT
        assertNotNull(response);
        assertEquals("FLAT50K", response.getCode());
        assertEquals(DiscountType.AMOUNT, response.getDiscountType());
        assertEquals(50000L, response.getDiscountValue());
        assertEquals(1, response.getStatus());
        // Kiểm tra trong DB
        assertTrue(voucherRepository.existsById(response.getId()));
    }

    /**
     * TEST CASE ID: ORD_03
     */
    @Test
    @DisplayName("ORD_03: Tạo voucher thất bại khi không điền minRankRequired")
    void ORD_03_createVoucher_nullMinRank_fail() {
        // 1. INPUT
        VoucherRequest request = buildValidRequest("NORANK01", DiscountType.AMOUNT, 20000L);
        request.setMinRankRequired(null); // Không điền rank

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        assertThrows(Exception.class, () -> {
            voucherService.createVoucher(request);
            voucherRepository.flush();
        }, "LỖI HỆ THỐNG: Hệ thống cho phép tạo voucher khi không điền minRankRequired!");
    }

    /**
     * TEST CASE ID: ORD_04
     */
    @Test
    @DisplayName("ORD_04: Tạo voucher thất bại do code đã tồn tại (UNIQUE constraint)")
    void ORD_04_createVoucher_duplicateCode_fail() {
        // 1. INPUT - Tạo voucher đầu tiên
        voucherService.createVoucher(buildValidRequest("DUPCODE", DiscountType.AMOUNT, 10000L));

        // Tạo voucher thứ 2 với code trùng
        VoucherRequest request = buildValidRequest("DUPCODE", DiscountType.PERCENT, 5L);

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        assertThrows(Exception.class, () -> {
            voucherService.createVoucher(request);
            voucherRepository.flush();
        }, "LỖI HỆ THỐNG: Hệ thống cho phép tạo voucher với code trùng!");
    }

    /**
     * TEST CASE ID: ORD_05
     */
    @Test
    @DisplayName("ORD_05: Tạo voucher thất bại do code null")
    void ORD_05_createVoucher_nullCode_fail() {
        // 1. INPUT
        VoucherRequest request = buildValidRequest(null, DiscountType.AMOUNT, 10000L);
        request.setCode(null); // Code null

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        assertThrows(Exception.class, () -> {
            voucherService.createVoucher(request);
            voucherRepository.flush();
        }, "LỖI HỆ THỐNG: Hệ thống cho phép tạo voucher với code null!");
    }

    /**
     * TEST CASE ID: ORD_06
     */
    @Test
    @DisplayName("ORD_06: Tạo voucher thất bại do ngày bắt đầu lớn hơn ngày kết thúc")
    void ORD_06_createVoucher_startAtAfterEndAt_fail() {
        // 1. INPUT
        VoucherRequest request = buildValidRequest("BADDATE1", DiscountType.AMOUNT, 10000L);
        request.setStartAt(LocalDateTime.now().plusDays(10));  // Bắt đầu sau kết thúc
        request.setEndAt(LocalDateTime.now().plusDays(1));     // Kết thúc trước bắt đầu

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        assertThrows(Exception.class, () -> {
            voucherService.createVoucher(request);
            voucherRepository.flush();
        }, "LỖI HỆ THỐNG: Hệ thống cho phép tạo voucher khi ngày bắt đầu lớn hơn ngày kết thúc!");
    }

    /**
     * TEST CASE ID: ORD_07
     */
    @Test
    @DisplayName("ORD_07: Tạo voucher thất bại do discountValue <= 0")
    void ORD_07_createVoucher_discountValueZeroOrNegative_fail() {
        // 1. INPUT
        VoucherRequest request = buildValidRequest("BADVAL01", DiscountType.AMOUNT, -5000L);
        // discountValue = -5000 (âm)

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        assertThrows(Exception.class, () -> {
            voucherService.createVoucher(request);
            voucherRepository.flush();
        }, "LỖI HỆ THỐNG: Hệ thống cho phép tạo voucher với discountValue âm hoặc bằng 0!");
    }
}
