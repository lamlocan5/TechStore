package com.example.profile.service.profile;

import static org.junit.jupiter.api.Assertions.*;

import java.time.LocalDate;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import com.example.profile.dto.request.ProfileCreationRequest;
import com.example.profile.dto.response.UserProfileResponse;
import com.example.profile.entity.UserProfile;
import com.example.profile.exception.AppException;
import com.example.profile.exception.ErrorCode;
import com.example.profile.repository.UserProfileRepository;
import com.example.profile.service.UserProfileService;

@SpringBootTest
@Transactional
public class UserProfileServiceUpdateProfileTest {

    @Autowired
    private UserProfileService userProfileService;

    @Autowired
    private UserProfileRepository userProfileRepository;

    /**
     * Helper: Tạo và lưu một UserProfile vào DB
     */
    private UserProfile createAndSaveProfile(String userId, String email, String phone) {
        UserProfile profile = new UserProfile();
        profile.setUserId(userId);
        profile.setFirstName("Nguyen");
        profile.setLastName("Van A");
        profile.setEmail(email);
        profile.setPhone(phone);
        profile.setStatus(1);
        return userProfileRepository.saveAndFlush(profile);
    }

    /**
     * TEST CASE ID: PRF_10
     */
    @Test
    @DisplayName("PRF_10: Cập nhật profile thành công với thông tin hợp lệ")
    void PRF_10_updateProfile_validData_success() {
        // 1. INPUT
        createAndSaveProfile("user-006", "user006@example.com", "0930000006");

        ProfileCreationRequest request = ProfileCreationRequest.builder()
                .userId("user-006")
                .firstName("Tran")
                .lastName("Thi B Updated")
                .email("user006updated@example.com")
                .phone("0930000066")
                .dob(LocalDate.of(1992, 3, 15))
                .avatar("new_avatar.png")
                .status(1)
                .build();

        // 2. GỌI HÀM
        UserProfileResponse response = userProfileService.updateProfile(request);

        // 3. EXPECTED OUTPUT
        assertNotNull(response);
        assertEquals("user-006", response.getUserId());
        assertEquals("Tran", response.getFirstName());
        assertEquals("Thi B Updated", response.getLastName());
        assertEquals("user006updated@example.com", response.getEmail());
        assertEquals("0930000066", response.getPhone());

        // Kiểm tra trong DB
        UserProfile updated = userProfileRepository.findByUserId("user-006");
        assertNotNull(updated);
        assertEquals("Tran", updated.getFirstName());
        assertEquals("user006updated@example.com", updated.getEmail());
    }

    /**
     * TEST CASE ID: PRF_11
     */
    @Test
    @DisplayName("PRF_11: Cập nhật thất bại do email mới đã được dùng bởi user khác")
    void PRF_11_updateProfile_emailExistedByOther_fail() {
        // 1. INPUT - Tạo 2 profile
        createAndSaveProfile("user-007a", "user007a@example.com", "0930000071");
        createAndSaveProfile("user-007b", "user007b@example.com", "0930000072");

        // Cập nhật user-007b với email của user-007a
        ProfileCreationRequest request = ProfileCreationRequest.builder()
                .userId("user-007b")
                .firstName("User")
                .lastName("007B")
                .email("user007a@example.com") // Email của user khác
                .phone("0930000072")
                .status(1)
                .build();

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            userProfileService.updateProfile(request);
        });
        assertEquals(ErrorCode.EMAIL_EXISTED, exception.getErrorCode());
    }

    /**
     * TEST CASE ID: PRF_12
     */
    @Test
    @DisplayName("PRF_12: Cập nhật thất bại do số điện thoại mới đã được dùng bởi user khác")
    void PRF_12_updateProfile_phoneExistedByOther_fail() {
        // 1. INPUT - Tạo 2 profile
        createAndSaveProfile("user-008a", "user008a@example.com", "0930000081");
        createAndSaveProfile("user-008b", "user008b@example.com", "0930000082");

        // Cập nhật user-008b với SĐT của user-008a
        ProfileCreationRequest request = ProfileCreationRequest.builder()
                .userId("user-008b")
                .firstName("User")
                .lastName("008B")
                .email("user008b@example.com")
                .phone("0930000081") // SĐT của user khác
                .status(1)
                .build();

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            userProfileService.updateProfile(request);
        });
        assertEquals(ErrorCode.PHONE_EXISTED, exception.getErrorCode());
    }

    /**
     * TEST CASE ID: PRF_13
     */
    @Test
    @DisplayName("PRF_13: Cập nhật thất bại do email không có đuôi @gmail.com")
    void PRF_13_updateProfile_invalidEmailFormat_fail() {
        // 1. INPUT
        createAndSaveProfile("user-009", "user009@gmail.com", "0930000090");

        ProfileCreationRequest request = ProfileCreationRequest.builder()
                .userId("user-009")
                .firstName("Nguyen")
                .lastName("Van A")
                .email("user009_invalid_email") // Không có đuôi @gmail.com
                .phone("0930000090")
                .status(1)
                .build();

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        assertThrows(
                Exception.class,
                () -> {
                    userProfileService.updateProfile(request);
                    userProfileRepository.flush();
                },
                "LỖI HỆ THỐNG: Hệ thống cho phép cập nhật profile với email không có đuôi @gmail.com!");
    }

    /**
     * TEST CASE ID: PRF_14
     */
    @Test
    @DisplayName("PRF_14: Cập nhật thất bại do số điện thoại không đủ 10 số")
    void PRF_14_updateProfile_phoneTooShort_fail() {
        // 1. INPUT
        createAndSaveProfile("user-010", "user010@gmail.com", "0930000100");

        ProfileCreationRequest request = ProfileCreationRequest.builder()
                .userId("user-010")
                .firstName("Nguyen")
                .lastName("Van A")
                .email("user010@gmail.com")
                .phone("09300") // Chỉ 5 số - không đủ 10 số
                .status(1)
                .build();

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        assertThrows(
                Exception.class,
                () -> {
                    userProfileService.updateProfile(request);
                    userProfileRepository.flush();
                },
                "LỖI HỆ THỐNG: Hệ thống cho phép cập nhật profile với SĐT không đủ 10 số!");
    }

    /**
     * TEST CASE ID: PRF_15
     */
    @Test
    @DisplayName("PRF_15: Cập nhật thất bại do số điện thoại không bắt đầu bằng số 0")
    void PRF_15_updateProfile_phoneNotStartWithZero_fail() {
        // 1. INPUT
        createAndSaveProfile("user-011", "user011@gmail.com", "0930000110");

        ProfileCreationRequest request = ProfileCreationRequest.builder()
                .userId("user-011")
                .firstName("Nguyen")
                .lastName("Van A")
                .email("user011@gmail.com")
                .phone("1930000110") // 10 số nhưng bắt đầu bằng 1 thay vì 0
                .status(1)
                .build();

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        assertThrows(
                Exception.class,
                () -> {
                    userProfileService.updateProfile(request);
                    userProfileRepository.flush();
                },
                "LỖI HỆ THỐNG: Hệ thống cho phép cập nhật profile với SĐT không bắt đầu bằng số 0!");
    }

    /**
     * TEST CASE ID: PRF_16
     */
    @Test
    @DisplayName("PRF_16: Cập nhật thất bại do ngày sinh lớn hơn ngày hiện tại")
    void PRF_16_updateProfile_dobInFuture_fail() {
        // 1. INPUT
        createAndSaveProfile("user-012", "user012@gmail.com", "0930000120");

        ProfileCreationRequest request = ProfileCreationRequest.builder()
                .userId("user-012")
                .firstName("Nguyen")
                .lastName("Van A")
                .email("user012@gmail.com")
                .phone("0930000120")
                .dob(LocalDate.now().plusDays(1)) // Ngày sinh là ngày mai - lớn hơn hôm nay
                .status(1)
                .build();

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        assertThrows(
                Exception.class,
                () -> {
                    userProfileService.updateProfile(request);
                    userProfileRepository.flush();
                },
                "LỖI HỆ THỐNG: Hệ thống cho phép cập nhật profile với ngày sinh trong tương lai!");
    }
}
