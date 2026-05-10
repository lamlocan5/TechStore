package com.example.identity_service.service;

import com.example.identity_service.dto.request.UserUpdateRequest;
import com.example.identity_service.dto.response.UserProfileResponse;
import com.example.identity_service.dto.response.UserResponse;
import com.example.identity_service.entity.User;
import com.example.identity_service.exception.AppException;
import com.example.identity_service.exception.ErrorCode;
import com.example.identity_service.http_client_openfeign.ProfileClient;
import com.example.identity_service.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;

@SpringBootTest
@Transactional
public class UserServiceUpdateUserTest {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @MockBean
    private ProfileClient profileClient;

    @BeforeEach
    void setUp() {
        UserProfileResponse mockProfileResponse = new UserProfileResponse();
        Mockito.when(profileClient.updateProfile(any())).thenReturn(mockProfileResponse);
    }

    /**
     * TEST CASE ID: IDN_8
     */
    @Test
    @WithMockUser(username = "test_user_01")
    @DisplayName("IDN_8: Cập nhật thành công")
    void IDN_8_updateUser_validRequest_success() {
        // 1. INPUT (Dữ liệu đầu vào)
        User user = new User();
        user.setUsername("test_user_01");
        user.setFirstName("OldName");
        User savedUser = userRepository.save(user);

        UserUpdateRequest request = UserUpdateRequest.builder()
                .firstName("NewName")
                .lastName("Nguyen")
                .build();

        // 2. GỌI HÀM
        UserResponse response = userService.updateUser(savedUser.getId(), request);

        // 3. EXPECTED OUTPUT (Kiểm tra phản ứng)
        assertNotNull(response);
        assertEquals("NewName", response.getFirstName());
    }

    /**
     * TEST CASE ID: IDN_9
     */
    @Test
    @DisplayName("IDN_9: Người dùng không tồn tại")
    void IDN_9_updateUser_userNotExist_fail() {
        // 1. INPUT
        UserUpdateRequest request = UserUpdateRequest.builder()
                .firstName("NewName")
                .build();

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            userService.updateUser("non_existent_id", request);
        });
        assertEquals(ErrorCode.USER_NOT_EXISTED, exception.getErrorCode());
    }

    /**
     * TEST CASE ID: IDN_10
     */
    @Test
    @WithMockUser(username = "test_user_03")
    @DisplayName("IDN_10: Dữ liệu không hợp lệ")
    void IDN_10_updateUser_invalidData_fail() {
        // 1. INPUT (Dữ liệu rỗng)
        User user = new User();
        user.setUsername("test_user_03");
        user.setFirstName("OldName");
        User savedUser = userRepository.save(user);

        // Cố tình gửi request có firstName rỗng/không hợp lệ
        UserUpdateRequest request = UserUpdateRequest.builder()
                .firstName("")
                .lastName("")
                .build();

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        // KỲ VỌNG: Hàm phải báo lỗi vì thông tin bắt buộc bị rỗng.
        // Nếu hàm không báo lỗi mà cứ thế lưu thẳng dữ liệu rỗng xuống Database thành công, 
        // hàm assertThrows sẽ đánh FAILED (Màu đỏ) test case này.
        assertThrows(Exception.class, () -> {
            userService.updateUser(savedUser.getId(), request);
        }, "LỖI HỆ THỐNG: Hàm updateUser đã xử lý thành công thay vì chặn lỗi thông tin rỗng!");
    }
}
