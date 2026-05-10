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
public class UserVoucherServiceClaimVoucherTest {

    @Autowired
    private UserVoucherService userVoucherService;

    @Autowired
    private UserVoucherRepository userVoucherRepository;

    @Autowired
    private VoucherRepository voucherRepository;

    @MockBean
    private IdentityServiceClient identityServiceClient;

    /**
     * Helper: Tạo VoucherEntity với tùy chọn linh hoạt
     */
    private VoucherEntity createVoucher(String code, int status, Integer maxUsage,
                                        Integer maxPerUser, MembershipRank minRank,
                                        LocalDateTime startAt, LocalDateTime endAt) {
        VoucherEntity voucher = VoucherEntity.builder()
                .code(code)
                .name("Voucher " + code)
                .discountType(DiscountType.AMOUNT)
                .discountValue(20000L)
                .minOrderTotal(100000L)
                .startAt(startAt)
                .endAt(endAt)
                .maxUsage(maxUsage)
                .maxPerUser(maxPerUser)
                .status(status)
                .minRankRequired(minRank)
                .build();
        return voucherRepository.saveAndFlush(voucher);
    }

    private UserVoucherEntity createAndSaveUserVoucher(String userId, Long voucherId) {
        UserVoucherEntity uv = UserVoucherEntity.builder()
                .userId(userId)
                .voucherId(voucherId)
                .isUsed(false)
                .claimedAt(LocalDateTime.now())
                .build();
        return userVoucherRepository.saveAndFlush(uv);
    }

    /**
     * TEST CASE ID: ORD_30
     */
    @Test
    @DisplayName("ORD_30: Claim voucher thành công, xuất hiện trong danh sách ví và có isUsed=false")
    void ORD_30_claimVoucher_validData_success_andIsUsedFalse() {
        // 1. INPUT
        VoucherEntity voucher = createVoucher(
                "CLAIM001", 1, 100, 5, MembershipRank.BRONZE,
                LocalDateTime.now().minusDays(1), LocalDateTime.now().plusDays(30));

        // 2. GỌI HÀM
        userVoucherService.claimVoucher("user-cl01", voucher.getId(), MembershipRank.BRONZE);

        // 3. EXPECTED OUTPUT
        // Xuất hiện trong ví user
        List<UserVoucherEntity> wallet = userVoucherService.getUserVouchers("user-cl01");
        assertFalse(wallet.isEmpty(), "Voucher phải xuất hiện trong ví sau khi claim!");
        assertEquals(1, wallet.size());
        assertEquals(voucher.getId(), wallet.get(0).getVoucherId());

        // isUsed phải là false (chưa dùng)
        assertFalse(wallet.get(0).getIsUsed(),
                "LỖI HỆ THỐNG: Voucher vừa claim phải có isUsed=false!");

        // Cũng xuất hiện trong danh sách chưa dùng
        List<UserVoucherEntity> activeList = userVoucherService.getActiveUserVouchers("user-cl01");
        assertFalse(activeList.isEmpty(),
                "Voucher vừa claim phải có mặt trong danh sách chưa dùng!");
    }

    /**
     * TEST CASE ID: ORD_31
     */
    @Test
    @DisplayName("ORD_31: Claim thất bại do voucherId không tồn tại")
    void ORD_31_claimVoucher_voucherNotFound_fail() {
        // 1. INPUT
        Long invalidVoucherId = 999999L;

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            userVoucherService.claimVoucher("user-cl02", invalidVoucherId, MembershipRank.BRONZE);
        });
        assertEquals(ErrorCode.VOUCHER_NOT_FOUND, exception.getErrorCode());
    }

    /**
     * TEST CASE ID: ORD_32
     */
    @Test
    @DisplayName("ORD_32: Claim thất bại do voucher không active (status=0)")
    void ORD_32_claimVoucher_voucherNotActive_fail() {
        // 1. INPUT - Voucher có status = 0 (vô hiệu hóa)
        VoucherEntity voucher = createVoucher(
                "INACTIVE2", 0, 100, 5, MembershipRank.BRONZE,
                LocalDateTime.now().minusDays(1), LocalDateTime.now().plusDays(30));

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            userVoucherService.claimVoucher("user-cl03", voucher.getId(), MembershipRank.BRONZE);
        });
        assertEquals(ErrorCode.VOUCHER_NOT_ACTIVE, exception.getErrorCode());
    }

    /**
     * TEST CASE ID: ORD_33
     */
    @Test
    @DisplayName("ORD_33: Claim thất bại do rank user thấp hơn minRankRequired của voucher")
    void ORD_33_claimVoucher_rankNotEnough_fail() {
        // 1. INPUT - Voucher yêu cầu rank GOLD, user chỉ có BRONZE
        VoucherEntity voucher = createVoucher(
                "GOLDONLY1", 1, 100, 5, MembershipRank.GOLD,
                LocalDateTime.now().minusDays(1), LocalDateTime.now().plusDays(30));

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            userVoucherService.claimVoucher("user-cl04", voucher.getId(), MembershipRank.BRONZE);
        });
        assertEquals(ErrorCode.VOUCHER_RANK_NOT_ENOUGH, exception.getErrorCode());
    }

    /**
     * TEST CASE ID: ORD_34
     */
    @Test
    @DisplayName("ORD_34: Claim thất bại do user đã claim đủ số lần maxPerUser")
    void ORD_34_claimVoucher_exceedMaxPerUser_fail() {
        // 1. INPUT - maxPerUser=1, maxUsage=null (bỏ qua maxUsage check)
        VoucherEntity voucher = createVoucher(
                "PERUSER01", 1, null, 1, MembershipRank.BRONZE,
                LocalDateTime.now().minusDays(1), LocalDateTime.now().plusDays(30));

        // Claim lần 1 (hợp lệ)
        createAndSaveUserVoucher("user-cl05", voucher.getId());

        // 2 & 3. Claim lần 2 → vượt maxPerUser → VOUCHER_USER_USAGE_LIMIT_REACHED
        AppException exception = assertThrows(AppException.class, () -> {
            userVoucherService.claimVoucher("user-cl05", voucher.getId(), MembershipRank.BRONZE);
        });
        assertEquals(ErrorCode.VOUCHER_USER_USAGE_LIMIT_REACHED, exception.getErrorCode());
    }

    /**
     * TEST CASE ID: ORD_35
     */
    @Test
    @DisplayName("ORD_35: Claim thất bại do voucher đã đạt giới hạn tổng maxUsage")
    void ORD_35_claimVoucher_exceedMaxUsage_fail() {
        // 1. INPUT - maxUsage=1 (giới hạn tổng), maxPerUser=null (bỏ qua per-user check)
        VoucherEntity voucher = createVoucher(
                "MAXUSE01", 1, 1, null, MembershipRank.BRONZE,
                LocalDateTime.now().minusDays(1), LocalDateTime.now().plusDays(30));

        // Đã có 1 lần claim từ user khác → đạt maxUsage
        createAndSaveUserVoucher("user-other", voucher.getId());

        // 2 & 3. User mới claim → vượt maxUsage tổng → VOUCHER_USAGE_LIMIT_REACHED
        AppException exception = assertThrows(AppException.class, () -> {
            userVoucherService.claimVoucher("user-cl06", voucher.getId(), MembershipRank.BRONZE);
        });
        assertEquals(ErrorCode.VOUCHER_USAGE_LIMIT_REACHED, exception.getErrorCode());
    }
}
