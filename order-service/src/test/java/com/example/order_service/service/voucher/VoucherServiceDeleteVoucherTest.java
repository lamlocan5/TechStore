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
import com.example.order_service.entity.VoucherEntity;
import com.example.order_service.enums.DiscountType;
import com.example.order_service.enums.MembershipRank;
import com.example.order_service.exception.AppException;
import com.example.order_service.exception.ErrorCode;
import com.example.order_service.repository.VoucherRepository;
import com.example.order_service.service.VoucherService;

@SpringBootTest
@Transactional
public class VoucherServiceDeleteVoucherTest {

    @Autowired
    private VoucherService voucherService;

    @Autowired
    private VoucherRepository voucherRepository;

    @MockBean
    private IdentityServiceClient identityServiceClient;

    private VoucherEntity createAndSaveVoucher(String code) {
        VoucherEntity entity = VoucherEntity.builder()
                .code(code)
                .name("Voucher " + code)
                .discountType(DiscountType.AMOUNT)
                .discountValue(15000L)
                .minOrderTotal(100000L)
                .startAt(LocalDateTime.now().minusDays(1))
                .endAt(LocalDateTime.now().plusDays(30))
                .maxUsage(50)
                .maxPerUser(1)
                .status(1)
                .minRankRequired(MembershipRank.BRONZE)
                .build();
        return voucherRepository.saveAndFlush(entity);
    }

    /**
     * TEST CASE ID: ORD_22
     */
    @Test
    @DisplayName("ORD_22: Xóa voucher thành công theo ID hợp lệ")
    void ORD_22_deleteVoucher_validId_success() {
        // 1. INPUT
        VoucherEntity saved = createAndSaveVoucher("DEL001");
        Long id = saved.getId();

        // Đảm bảo tồn tại trước khi xóa
        assertTrue(voucherRepository.existsById(id));

        // 2. GỌI HÀM
        voucherService.deleteVoucher(id);

        // 3. EXPECTED OUTPUT - Kiểm tra đã xóa khỏi DB
        assertFalse(voucherRepository.existsById(id),
                "LỖI HỆ THỐNG: Voucher vẫn còn tồn tại trong DB sau khi xóa!");
    }

    /**
     * TEST CASE ID: ORD_23
     */
    @Test
    @DisplayName("ORD_23: Xóa thất bại do ID voucher không tồn tại")
    void ORD_23_deleteVoucher_notFound_fail() {
        // 1. INPUT
        Long invalidId = 999999L;

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            voucherService.deleteVoucher(invalidId);
        });
        assertEquals(ErrorCode.VOUCHER_NOT_FOUND, exception.getErrorCode());
    }
}
