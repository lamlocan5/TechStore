package com.example.order_service.service.uservoucher;

import static org.junit.jupiter.api.Assertions.*;

import java.time.LocalDateTime;
import java.util.List;

import com.example.order_service.client.IdentityServiceClient;
import com.example.order_service.entity.UserVoucherEntity;
import com.example.order_service.entity.VoucherEntity;
import com.example.order_service.enums.DiscountType;
import com.example.order_service.enums.MembershipRank;
import com.example.order_service.exception.AppException;
import com.example.order_service.exception.ErrorCode;
import com.example.order_service.repository.UserVoucherRepository;
import com.example.order_service.repository.VoucherRepository;
import com.example.order_service.service.UserVoucherService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
public class UserVoucherServiceMarkVoucherUsedTest {

    @Autowired
    private UserVoucherService userVoucherService;

    @Autowired
    private UserVoucherRepository userVoucherRepository;

    @Autowired
    private VoucherRepository voucherRepository;

    @MockBean
    private IdentityServiceClient identityServiceClient;

    private VoucherEntity createAndSaveVoucher(String code) {
        VoucherEntity voucher = VoucherEntity.builder()
                .code(code)
                .name("Voucher " + code)
                .discountType(DiscountType.AMOUNT)
                .discountValue(20000L)
                .minOrderTotal(100000L)
                .startAt(LocalDateTime.now().minusDays(1))
                .endAt(LocalDateTime.now().plusDays(30))
                .maxUsage(100)
                .maxPerUser(5)
                .status(1)
                .minRankRequired(MembershipRank.BRONZE)
                .build();
        return voucherRepository.saveAndFlush(voucher);
    }

    private UserVoucherEntity createAndSaveUserVoucher(String userId, Long voucherId, boolean isUsed) {
        UserVoucherEntity uv = UserVoucherEntity.builder()
                .userId(userId)
                .voucherId(voucherId)
                .isUsed(isUsed)
                .claimedAt(LocalDateTime.now())
                .build();
        return userVoucherRepository.saveAndFlush(uv);
    }

    /**
     * TEST CASE ID: ORD_28
     */
    @Test
    @DisplayName("ORD_28: Đánh dấu voucher đã dùng thành công, isUsed=true và biến mất khỏi danh sách chưa dùng")
    void ORD_28_markVoucherUsed_success_voucherBecomesUsed() {
        // 1. INPUT - Tạo voucher chưa dùng trong ví user
        VoucherEntity voucher = createAndSaveVoucher("MARK001");
        UserVoucherEntity uv = createAndSaveUserVoucher("user-mk01", voucher.getId(), false);

        // Đảm bảo ban đầu isUsed = false
        assertFalse(uv.getIsUsed());

        // 2. GỌI HÀM
        userVoucherService.markVoucherUsed("user-mk01", voucher.getId());

        // 3. EXPECTED OUTPUT - isUsed = true trong DB
        UserVoucherEntity inDB = userVoucherRepository.findById(uv.getId()).orElse(null);
        assertNotNull(inDB);
        assertTrue(inDB.getIsUsed(),
                "LỖI HỆ THỐNG: Voucher vẫn có isUsed=false sau khi markVoucherUsed!");
        assertNotNull(inDB.getUsedAt(),
                "LỖI HỆ THỐNG: usedAt phải được ghi nhận sau khi đánh dấu đã dùng!");

        // Không còn trong danh sách chưa dùng
        List<UserVoucherEntity> activeVouchers = userVoucherService.getActiveUserVouchers("user-mk01");
        assertFalse(activeVouchers.stream().anyMatch(v -> v.getId().equals(uv.getId())),
                "LỖI HỆ THỐNG: Voucher đã dùng vẫn còn trong danh sách chưa dùng!");
    }

    /**
     * TEST CASE ID: ORD_29
     */
    @Test
    @DisplayName("ORD_29: Đánh dấu đã dùng thất bại do voucher không có trong ví user (chưa claim)")
    void ORD_29_markVoucherUsed_notInWallet_fail() {
        // 1. INPUT - Tạo voucher nhưng KHÔNG claim vào ví user
        VoucherEntity voucher = createAndSaveVoucher("MARK002");
        // user-mk02 chưa claim voucher này

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            userVoucherService.markVoucherUsed("user-mk02", voucher.getId());
        });
        assertEquals(ErrorCode.VOUCHER_NOT_IN_WALLET, exception.getErrorCode());
    }
}
