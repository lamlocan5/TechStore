package com.example.identity_service.service;

import com.example.identity_service.dto.request.ForgotPasswordRequest;
import com.example.identity_service.dto.response.ForgotPasswordResponse;
import com.example.identity_service.dto.response.UserProfileResponse;
import com.example.identity_service.entity.User;
import com.example.identity_service.exception.AppException;
import com.example.identity_service.exception.ErrorCode;
import com.example.identity_service.http_client_openfeign.ProfileClient;
import com.example.identity_service.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;

@SpringBootTest
@Transactional
public class AuthenticationServiceForgotPasswordTest {

    @Autowired
    private AuthenticationService authenticationService;

    @Autowired
    private UserRepository userRepository;

    @MockBean
    private ProfileClient profileClient;

    @MockBean
    private KafkaTemplate<String, Object> kafkaTemplate;

    private PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);

    /**
     * TEST CASE ID: IDN_19
     */
    @Test
    @DisplayName("IDN_19: Quên mật khẩu thành công")
    void IDN_19_forgotPassword_validRequest_success() {
        // 1. INPUT (Dữ liệu đầu vào)
        User user = new User();
        user.setUsername("test_user_01");
        user.setPassword(passwordEncoder.encode("oldpassword"));
        User savedUser = userRepository.save(user);

        ForgotPasswordRequest request = ForgotPasswordRequest.builder()
                .username("test_user_01")
                .build();

        UserProfileResponse mockProfile = new UserProfileResponse();
        mockProfile.setEmail("test@gmail.com");
        Mockito.when(profileClient.getUserProfileByUserId(savedUser.getId())).thenReturn(mockProfile);
        Mockito.when(kafkaTemplate.send(any(String.class), any())).thenReturn(null);

        // 2. GỌI HÀM
        ForgotPasswordResponse response = authenticationService.forgotPassword(request);

        // 3. EXPECTED OUTPUT (Kiểm tra phản ứng)
        assertNotNull(response);
        assertEquals("test@gmail.com", response.getEmail());

        User updatedUser = userRepository.findById(savedUser.getId()).get();
        assertFalse(passwordEncoder.matches("oldpassword", updatedUser.getPassword())); // Mật khẩu cũ không còn đúng
    }

    /**
     * TEST CASE ID: IDN_20
     */
    @Test
    @DisplayName("IDN_20: User không tồn tại")
    void IDN_20_forgotPassword_userNotExist_fail() {
        // 1. INPUT
        ForgotPasswordRequest request = ForgotPasswordRequest.builder()
                .username("non_existent_user")
                .build();

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            authenticationService.forgotPassword(request);
        });
        assertEquals(ErrorCode.USER_NOT_EXISTED, exception.getErrorCode());
    }

    /**
     * TEST CASE ID: IDN_21
     */
    @Test
    @DisplayName("IDN_21: User không có Email")
    void IDN_21_forgotPassword_emailNotFound_fail() {
        // 1. INPUT
        User user = new User();
        user.setUsername("test_user_02");
        user.setPassword(passwordEncoder.encode("oldpassword"));
        User savedUser = userRepository.save(user);

        ForgotPasswordRequest request = ForgotPasswordRequest.builder()
                .username("test_user_02")
                .build();

        // Giả lập trả về Profile không có email
        UserProfileResponse mockProfile = new UserProfileResponse();
        mockProfile.setEmail(null);
        Mockito.when(profileClient.getUserProfileByUserId(savedUser.getId())).thenReturn(mockProfile);

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            authenticationService.forgotPassword(request);
        });
        assertEquals(ErrorCode.EMAIL_NOT_FOUND, exception.getErrorCode());
    }
}
