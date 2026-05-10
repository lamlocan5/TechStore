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
public class UserVoucherServiceGetAllVoucherTest {

    @Autowired
    private UserVoucherService userVoucherService;

    @Autowired
    private UserVoucherRepository userVoucherRepository;

    @Autowired
    private VoucherRepository voucherRepository;

    @MockBean
    private IdentityServiceClient identityServiceClient;

    /**
     * Helper: Tạo VoucherEntity và lưu vào DB
     */
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

    /**
     * Helper: Tạo UserVoucherEntity và lưu vào DB
     */
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
     * TEST CASE ID: ORD_24
     */
    @Test
    @DisplayName("ORD_24: Lấy toàn bộ voucher của user thành công, bao gồm cả đã dùng và chưa dùng")
    void ORD_24_getUserVouchers_hasVouchers_returnAll() {
        // 1. INPUT - Tạo 1 voucher chưa dùng và 1 voucher đã dùng
        VoucherEntity v1 = createAndSaveVoucher("GETALL01");
        VoucherEntity v2 = createAndSaveVoucher("GETALL02");

        createAndSaveUserVoucher("user-ga01", v1.getId(), false); // chưa dùng
        createAndSaveUserVoucher("user-ga01", v2.getId(), true);  // đã dùng

        // 2. GỌI HÀM
        List<UserVoucherEntity> results = userVoucherService.getUserVouchers("user-ga01");

        // 3. EXPECTED OUTPUT - Trả về cả 2 voucher
        assertNotNull(results);
        assertEquals(2, results.size());
        assertTrue(results.stream().anyMatch(uv -> uv.getVoucherId().equals(v1.getId())));
        assertTrue(results.stream().anyMatch(uv -> uv.getVoucherId().equals(v2.getId())));
    }

    /**
     * TEST CASE ID: ORD_25
     */
    @Test
    @DisplayName("ORD_25: Lấy toàn bộ voucher khi user không có voucher nào trả về danh sách rỗng")
    void ORD_25_getUserVouchers_noVouchers_returnEmptyList() {
        // 1. INPUT - User không có voucher nào
        String userId = "user-ga02-no-voucher";

        // 2. GỌI HÀM
        List<UserVoucherEntity> results = userVoucherService.getUserVouchers(userId);

        // 3. EXPECTED OUTPUT
        assertNotNull(results);
        assertTrue(results.isEmpty(), "User không có voucher phải trả về danh sách rỗng!");
    }
}
