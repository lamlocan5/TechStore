package com.example.identity_service.service;

import com.example.identity_service.dto.request.PasswordChangeRequest;
import com.example.identity_service.dto.response.UserResponse;
import com.example.identity_service.entity.User;
import com.example.identity_service.exception.AppException;
import com.example.identity_service.exception.ErrorCode;
import com.example.identity_service.http_client_openfeign.ProfileClient;
import com.example.identity_service.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class UserServiceChangePasswordTest {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockBean
    private ProfileClient profileClient;

    @MockBean
    private KafkaTemplate<String, Object> kafkaTemplate;

    /**
     * TEST CASE ID: IDN_5
     */
    @Test
    @WithMockUser(username = "test_user_01")
    @DisplayName("IDN_5: Đổi mật khẩu thành công")
    void IDN_5_changePassword_validRequest_success() {
        // 1. INPUT (Dữ liệu đầu vào)
        User user = new User();
        user.setUsername("test_user_01");
        user.setPassword(passwordEncoder.encode("oldPassword"));
        User savedUser = userRepository.save(user);

        PasswordChangeRequest request = PasswordChangeRequest.builder()
                .oldPassword("oldPassword")
                .newPassword("newPassword")
                .build();

        // 2. GỌI HÀM
        UserResponse response = userService.changePassword(savedUser.getId(), request);

        // 3. EXPECTED OUTPUT (Kiểm tra phản ứng)
        assertNotNull(response);
        User finalUser = userRepository.findById(savedUser.getId()).get();
        assertTrue(passwordEncoder.matches("newPassword", finalUser.getPassword()));
    }

    /**
     * TEST CASE ID: IDN_6
     */
    @Test
    @DisplayName("IDN_6: Người dùng không tồn tại")
    void IDN_6_changePassword_userNotExist_fail() {
        // 1. INPUT
        PasswordChangeRequest request = PasswordChangeRequest.builder()
                .oldPassword("oldPassword")
                .newPassword("newPassword")
                .build();

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            userService.changePassword("non_existent_id", request);
        });
        assertEquals(ErrorCode.USER_NOT_EXISTED, exception.getErrorCode());
    }

    /**
     * TEST CASE ID: IDN_7
     */
    @Test
    @WithMockUser(username = "test_user_02")
    @DisplayName("IDN_7: Sai mật khẩu cũ")
    void IDN_7_changePassword_wrongOldPassword_fail() {
        // 1. INPUT
        User user = new User();
        user.setUsername("test_user_02");
        user.setPassword(passwordEncoder.encode("oldPassword"));
        User savedUser = userRepository.save(user);

        PasswordChangeRequest request = PasswordChangeRequest.builder()
                .oldPassword("wrongPassword") // Cố tình sai pass
                .newPassword("newPassword")
                .build();

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            userService.changePassword(savedUser.getId(), request);
        });
        assertEquals(ErrorCode.INCORRECT_PASSWORD, exception.getErrorCode());
    }
}
