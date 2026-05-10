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
public class UserProfileServiceCreateProfileTest {

    @Autowired
    private UserProfileService userProfileService;

    @Autowired
    private UserProfileRepository userProfileRepository;

    /**
     * TEST CASE ID: PRF_01
     */
    @Test
    @DisplayName("PRF_01: Tạo profile thành công với đầy đủ thông tin hợp lệ")
    void PRF_01_createProfile_validData_success() {
        // 1. INPUT
        ProfileCreationRequest request = ProfileCreationRequest.builder()
                .userId("user-001")
                .firstName("Nguyen")
                .lastName("Van A")
                .email("nguyenvana@example.com")
                .phone("0901234561")
                .dob(LocalDate.of(1995, 5, 20))
                .avatar("avatar1.png")
                .status(1)
                .build();

        // 2. GỌI HÀM
        UserProfileResponse response = userProfileService.createProfile(request);

        // 3. EXPECTED OUTPUT
        assertNotNull(response);
        assertNotNull(response.getId());
        assertEquals("user-001", response.getUserId());
        assertEquals("Nguyen", response.getFirstName());
        assertEquals("Van A", response.getLastName());
        assertEquals("nguyenvana@example.com", response.getEmail());
        assertEquals("0901234561", response.getPhone());

        // Kiểm tra trong DB
        UserProfile saved = userProfileRepository.findByUserId("user-001");
        assertNotNull(saved);
        assertEquals("nguyenvana@example.com", saved.getEmail());
    }

    /**
     * TEST CASE ID: PRF_02
     */
    @Test
    @DisplayName("PRF_02: Tạo profile thất bại do email đã tồn tại")
    void PRF_02_createProfile_emailExisted_fail() {
        // 1. INPUT - Tạo profile đầu tiên
        UserProfile existing = new UserProfile();
        existing.setUserId("user-existing");
        existing.setEmail("duplicate@example.com");
        existing.setPhone("0900000001");
        userProfileRepository.saveAndFlush(existing);

        // Tạo request với email trùng
        ProfileCreationRequest request = ProfileCreationRequest.builder()
                .userId("user-002")
                .firstName("Tran")
                .lastName("Thi B")
                .email("duplicate@example.com") // Email trùng
                .phone("0900000002")
                .status(1)
                .build();

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            userProfileService.createProfile(request);
        });
        assertEquals(ErrorCode.EMAIL_EXISTED, exception.getErrorCode());
    }

    /**
     * TEST CASE ID: PRF_03
     */
    @Test
    @DisplayName("PRF_03: Tạo profile thất bại do số điện thoại đã tồn tại")
    void PRF_03_createProfile_phoneExisted_fail() {
        // 1. INPUT - Tạo profile đầu tiên
        UserProfile existing = new UserProfile();
        existing.setUserId("user-existing");
        existing.setEmail("existing@example.com");
        existing.setPhone("0911111111"); // SĐT trùng
        userProfileRepository.saveAndFlush(existing);

        // Tạo request với SĐT trùng
        ProfileCreationRequest request = ProfileCreationRequest.builder()
                .userId("user-003")
                .firstName("Le")
                .lastName("Van C")
                .email("levanc@example.com")
                .phone("0911111111") // SĐT trùng
                .status(1)
                .build();

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            userProfileService.createProfile(request);
        });
        assertEquals(ErrorCode.PHONE_EXISTED, exception.getErrorCode());
    }

    /**
     * TEST CASE ID: PRF_04
     */
    @Test
    @DisplayName("PRF_04: Tạo profile thất bại khi email và phone đều để rỗng")
    void PRF_04_createProfile_emptyEmailAndPhone_fail() {
        // 1. INPUT
        ProfileCreationRequest request = ProfileCreationRequest.builder()
                .userId("user-004")
                .firstName("Pham")
                .lastName("Thi D")
                .email("") // Email rỗng
                .phone("") // SĐT rỗng
                .status(1)
                .build();

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        assertThrows(
                Exception.class,
                () -> {
                    userProfileService.createProfile(request);
                    userProfileRepository.flush();
                },
                "LỖI HỆ THỐNG: Hệ thống cho phép tạo profile khi email và phone đều để rỗng!");
    }

    /**
     * TEST CASE ID: PRF_05
     */
    @Test
    @DisplayName("PRF_05: Tạo profile thất bại do userId null")
    void PRF_05_createProfile_nullUserId_fail() {
        // 1. INPUT
        ProfileCreationRequest request = ProfileCreationRequest.builder()
                .userId(null) // userId NULL - vi phạm DB constraint
                .firstName("Test")
                .lastName("User")
                .email("testuser@example.com")
                .phone("0922222222")
                .status(1)
                .build();

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        assertThrows(
                Exception.class,
                () -> {
                    userProfileService.createProfile(request);
                    userProfileRepository.flush();
                },
                "LỖI HỆ THỐNG: Hệ thống cho phép tạo profile với userId null!");
    }

    /**
     * TEST CASE ID: PRF_06
     */
    @Test
    @DisplayName("PRF_06: Tạo profile thất bại do email không có đuôi @gmail.com")
    void PRF_06_createProfile_invalidEmailFormat_fail() {
        // 1. INPUT
        ProfileCreationRequest request = ProfileCreationRequest.builder()
                .userId("user-006")
                .firstName("Nguyen")
                .lastName("Van F")
                .email("nguyenvanf_invalid") // Không có đuôi @gmail.com
                .phone("0901234506")
                .status(1)
                .build();

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        assertThrows(
                Exception.class,
                () -> {
                    userProfileService.createProfile(request);
                    userProfileRepository.flush();
                },
                "LỖI HỆ THỐNG: Hệ thống cho phép tạo profile với email không có đuôi @gmail.com!");
    }

    /**
     * TEST CASE ID: PRF_07
     */
    @Test
    @DisplayName("PRF_07: Tạo profile thất bại do số điện thoại không đủ 10 số")
    void PRF_07_createProfile_phoneTooShort_fail() {
        // 1. INPUT
        ProfileCreationRequest request = ProfileCreationRequest.builder()
                .userId("user-007")
                .firstName("Nguyen")
                .lastName("Van G")
                .email("nguyenvang@gmail.com")
                .phone("090123") // Chỉ 6 số - không đủ 10 số
                .status(1)
                .build();

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        assertThrows(
                Exception.class,
                () -> {
                    userProfileService.createProfile(request);
                    userProfileRepository.flush();
                },
                "LỖI HỆ THỐNG: Hệ thống cho phép tạo profile với SĐT không đủ 10 số!");
    }

    /**
     * TEST CASE ID: PRF_08
     */
    @Test
    @DisplayName("PRF_08: Tạo profile thất bại do số điện thoại không bắt đầu bằng số 0")
    void PRF_08_createProfile_phoneNotStartWithZero_fail() {
        // 1. INPUT
        ProfileCreationRequest request = ProfileCreationRequest.builder()
                .userId("user-008")
                .firstName("Nguyen")
                .lastName("Van H")
                .email("nguyenvanh@gmail.com")
                .phone("1901234508") // 10 số nhưng bắt đầu bằng 1 thay vì 0
                .status(1)
                .build();

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        assertThrows(
                Exception.class,
                () -> {
                    userProfileService.createProfile(request);
                    userProfileRepository.flush();
                },
                "LỖI HỆ THỐNG: Hệ thống cho phép tạo profile với SĐT không bắt đầu bằng số 0!");
    }

    /**
     * TEST CASE ID: PRF_09
     */
    @Test
    @DisplayName("PRF_09: Tạo profile thất bại do ngày sinh lớn hơn ngày hiện tại")
    void PRF_09_createProfile_dobInFuture_fail() {
        // 1. INPUT
        ProfileCreationRequest request = ProfileCreationRequest.builder()
                .userId("user-009")
                .firstName("Nguyen")
                .lastName("Van I")
                .email("nguyenvani@gmail.com")
                .phone("0901234509")
                .dob(LocalDate.now().plusDays(1)) // Ngày sinh là ngày mai - lớn hơn hôm nay
                .status(1)
                .build();

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        assertThrows(
                Exception.class,
                () -> {
                    userProfileService.createProfile(request);
                    userProfileRepository.flush();
                },
                "LỖI HỆ THỐNG: Hệ thống cho phép tạo profile với ngày sinh trong tương lai!");
    }
}
