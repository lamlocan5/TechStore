package com.example.order_service.service.voucher;

import static org.junit.jupiter.api.Assertions.*;

import java.time.LocalDateTime;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.transaction.annotation.Transactional;

import com.example.order_service.client.IdentityServiceClient;
import com.example.order_service.dto.request.VoucherRequest;
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
public class VoucherServiceUpdateVoucherTest {

    @Autowired
    private VoucherService voucherService;

    @Autowired
    private VoucherRepository voucherRepository;

    @MockBean
    private IdentityServiceClient identityServiceClient;

    private VoucherEntity createAndSaveVoucher(String code, DiscountType type, Long value) {
        VoucherEntity entity = VoucherEntity.builder()
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
        return voucherRepository.saveAndFlush(entity);
    }

    private VoucherRequest buildUpdateRequest(String code, DiscountType type, Long value) {
        return VoucherRequest.builder()
                .code(code)
                .name("Updated Voucher " + code)
                .discountType(type)
                .discountValue(value)
                .minOrderTotal(200000L)
                .startAt(LocalDateTime.now().minusDays(1))
                .endAt(LocalDateTime.now().plusDays(60))
                .maxUsage(200)
                .maxPerUser(2)
                .status(1)
                .minRankRequired(MembershipRank.SILVER)
                .build();
    }

    /**
     * TEST CASE ID: ORD_08
     */
    @Test
    @DisplayName("ORD_08: Cập nhật voucher thành công với dữ liệu hợp lệ")
    void ORD_08_updateVoucher_validData_success() {
        // 1. INPUT
        VoucherEntity saved = createAndSaveVoucher("UPD001", DiscountType.AMOUNT, 30000L);
        VoucherRequest request = buildUpdateRequest("UPD001", DiscountType.AMOUNT, 50000L);

        // 2. GỌI HÀM
        VoucherResponse response = voucherService.updateVoucher(saved.getId(), request);

        // 3. EXPECTED OUTPUT
        assertNotNull(response);
        assertEquals(saved.getId(), response.getId());
        assertEquals("Updated Voucher UPD001", response.getName());
        assertEquals(50000L, response.getDiscountValue());
        assertEquals(200000L, response.getMinOrderTotal());

        // Kiểm tra trong DB
        VoucherEntity inDB = voucherRepository.findById(saved.getId()).orElse(null);
        assertNotNull(inDB);
        assertEquals(50000L, inDB.getDiscountValue());
    }

    /**
     * TEST CASE ID: ORD_09
     */
    @Test
    @DisplayName("ORD_09: Cập nhật thất bại do ID voucher không tồn tại")
    void ORD_09_updateVoucher_notFound_fail() {
        // 1. INPUT
        Long invalidId = 999999L;
        VoucherRequest request = buildUpdateRequest("NOTEXIST", DiscountType.AMOUNT, 10000L);

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            voucherService.updateVoucher(invalidId, request);
        });
        assertEquals(ErrorCode.VOUCHER_NOT_FOUND, exception.getErrorCode());
    }

    /**
     * TEST CASE ID: ORD_10
     */
    @Test
    @DisplayName("ORD_10: Cập nhật đổi loại giảm giá từ AMOUNT sang PERCENT thành công")
    void ORD_10_updateVoucher_changeDiscountType_success() {
        // 1. INPUT
        VoucherEntity saved = createAndSaveVoucher("CHTYPE01", DiscountType.AMOUNT, 50000L);
        VoucherRequest request = buildUpdateRequest("CHTYPE01", DiscountType.PERCENT, 15L);
        // Đổi từ AMOUNT sang PERCENT

        // 2. GỌI HÀM
        VoucherResponse response = voucherService.updateVoucher(saved.getId(), request);

        // 3. EXPECTED OUTPUT
        assertNotNull(response);
        assertEquals(DiscountType.PERCENT, response.getDiscountType());
        assertEquals(15L, response.getDiscountValue());
    }

    /**
     * TEST CASE ID: ORD_11
     */
    @Test
    @DisplayName("ORD_11: Cập nhật thất bại do code mới đã tồn tại ở voucher khác (UNIQUE constraint)")
    void ORD_11_updateVoucher_duplicateCode_fail() {
        // 1. INPUT - Tạo 2 voucher
        createAndSaveVoucher("EXIST_CODE", DiscountType.AMOUNT, 10000L);
        VoucherEntity toUpdate = createAndSaveVoucher("UPDATE_ME", DiscountType.AMOUNT, 20000L);

        // Cập nhật toUpdate với code của voucher khác
        VoucherRequest request = buildUpdateRequest("EXIST_CODE", DiscountType.AMOUNT, 20000L);

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        assertThrows(Exception.class, () -> {
            voucherService.updateVoucher(toUpdate.getId(), request);
            voucherRepository.flush();
        }, "LỖI HỆ THỐNG: Hệ thống cho phép cập nhật voucher với code đã tồn tại ở voucher khác!");
    }

    /**
     * TEST CASE ID: ORD_12
     */
    @Test
    @DisplayName("ORD_12: Cập nhật thất bại khi không điền minRankRequired")
    void ORD_12_updateVoucher_nullMinRank_fail() {
        // 1. INPUT
        VoucherEntity saved = createAndSaveVoucher("NORANK02", DiscountType.AMOUNT, 10000L);
        VoucherRequest request = buildUpdateRequest("NORANK02", DiscountType.AMOUNT, 10000L);
        request.setMinRankRequired(null); // Không điền rank

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        assertThrows(Exception.class, () -> {
            voucherService.updateVoucher(saved.getId(), request);
            voucherRepository.flush();
        }, "LỖI HỆ THỐNG: Hệ thống cho phép cập nhật voucher khi không điền minRankRequired!");
    }

    /**
     * TEST CASE ID: ORD_13
     */
    @Test
    @DisplayName("ORD_13: Cập nhật thất bại do ngày bắt đầu lớn hơn ngày kết thúc")
    void ORD_13_updateVoucher_startAtAfterEndAt_fail() {
        // 1. INPUT
        VoucherEntity saved = createAndSaveVoucher("BADDATE2", DiscountType.AMOUNT, 10000L);
        VoucherRequest request = buildUpdateRequest("BADDATE2", DiscountType.AMOUNT, 10000L);
        request.setStartAt(LocalDateTime.now().plusDays(10)); // Bắt đầu sau kết thúc
        request.setEndAt(LocalDateTime.now().plusDays(1));    // Kết thúc trước bắt đầu

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        assertThrows(Exception.class, () -> {
            voucherService.updateVoucher(saved.getId(), request);
            voucherRepository.flush();
        }, "LỖI HỆ THỐNG: Hệ thống cho phép cập nhật voucher khi ngày bắt đầu lớn hơn ngày kết thúc!");
    }

    /**
     * TEST CASE ID: ORD_14
     */
    @Test
    @DisplayName("ORD_14: Cập nhật thất bại do discountValue <= 0")
    void ORD_14_updateVoucher_discountValueZeroOrNegative_fail() {
        // 1. INPUT
        VoucherEntity saved = createAndSaveVoucher("BADVAL02", DiscountType.AMOUNT, 10000L);
        VoucherRequest request = buildUpdateRequest("BADVAL02", DiscountType.AMOUNT, 0L);
        // discountValue = 0

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        assertThrows(Exception.class, () -> {
            voucherService.updateVoucher(saved.getId(), request);
            voucherRepository.flush();
        }, "LỖI HỆ THỐNG: Hệ thống cho phép cập nhật voucher với discountValue bằng 0 hoặc âm!");
    }
}
