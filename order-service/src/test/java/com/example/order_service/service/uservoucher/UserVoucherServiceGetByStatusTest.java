package com.example.order_service.service.uservoucher;

import static org.junit.jupiter.api.Assertions.*;

import java.time.LocalDateTime;
import java.util.List;

import com.example.order_service.client.IdentityServiceClient;
import com.example.order_service.entity.UserVoucherEntity;
import com.example.order_service.entity.VoucherEntity;
import com.example.order_service.enums.DiscountType;
import com.example.order_service.enums.MembershipRank;
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
public class UserVoucherServiceGetByStatusTest {

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
     * TEST CASE ID: ORD_26
     */
    @Test
    @DisplayName("ORD_26: Lấy voucher chưa dùng thành công, chỉ trả về voucher có isUsed=false")
    void ORD_26_getActiveUserVouchers_hasUnused_returnOnlyUnused() {
        // 1. INPUT - Tạo 2 voucher chưa dùng + 1 voucher đã dùng
        VoucherEntity v1 = createAndSaveVoucher("STATUS01");
        VoucherEntity v2 = createAndSaveVoucher("STATUS02");
        VoucherEntity v3 = createAndSaveVoucher("STATUS03");

        createAndSaveUserVoucher("user-st01", v1.getId(), false); // chưa dùng
        createAndSaveUserVoucher("user-st01", v2.getId(), false); // chưa dùng
        createAndSaveUserVoucher("user-st01", v3.getId(), true);  // đã dùng

        // 2. GỌI HÀM
        List<UserVoucherEntity> results = userVoucherService.getActiveUserVouchers("user-st01");

        // 3. EXPECTED OUTPUT - Chỉ trả về 2 voucher chưa dùng
        assertNotNull(results);
        assertEquals(2, results.size());
        assertTrue(results.stream().allMatch(uv -> !uv.getIsUsed()),
                "LỖI HỆ THỐNG: Danh sách chưa dùng chứa voucher đã dùng (isUsed=true)!");
        assertFalse(results.stream().anyMatch(uv -> uv.getVoucherId().equals(v3.getId())),
                "LỖI HỆ THỐNG: Voucher đã dùng lọt vào danh sách chưa dùng!");
    }

    /**
     * TEST CASE ID: ORD_27
     */
    @Test
    @DisplayName("ORD_27: Lấy voucher chưa dùng khi tất cả voucher của user đã được dùng trả về rỗng")
    void ORD_27_getActiveUserVouchers_allUsed_returnEmpty() {
        // 1. INPUT - Tạo 2 voucher đã dùng hết
        VoucherEntity v1 = createAndSaveVoucher("ALLUSED1");
        VoucherEntity v2 = createAndSaveVoucher("ALLUSED2");

        createAndSaveUserVoucher("user-st02", v1.getId(), true); // đã dùng
        createAndSaveUserVoucher("user-st02", v2.getId(), true); // đã dùng

        // 2. GỌI HÀM
        List<UserVoucherEntity> results = userVoucherService.getActiveUserVouchers("user-st02");

        // 3. EXPECTED OUTPUT - Không còn voucher chưa dùng
        assertNotNull(results);
        assertTrue(results.isEmpty(),
                "LỖI HỆ THỐNG: Trả về voucher khi tất cả đã được dùng, lẽ ra phải rỗng!");
    }
}
