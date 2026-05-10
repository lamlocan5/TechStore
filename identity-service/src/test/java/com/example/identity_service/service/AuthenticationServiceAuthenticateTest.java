package com.example.identity_service.service;

import com.example.identity_service.dto.request.AuthenticationRequest;
import com.example.identity_service.dto.response.AuthenticationResponse;
import com.example.identity_service.entity.User;
import com.example.identity_service.exception.AppException;
import com.example.identity_service.exception.ErrorCode;
import com.example.identity_service.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class AuthenticationServiceAuthenticateTest {

    @Autowired
    private AuthenticationService authenticationService;

    @Autowired
    private UserRepository userRepository;

    private PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);

    /**
     * TEST CASE ID: IDN_14
     */
    @Test
    @DisplayName("IDN_14: Đăng nhập thành công")
    void IDN_14_authenticate_validRequest_success() {
        // 1. INPUT (Dữ liệu đầu vào)
        User user = new User();
        user.setUsername("test_user_01");
        user.setPassword(passwordEncoder.encode("password123"));
        userRepository.save(user);

        AuthenticationRequest request = AuthenticationRequest.builder()
                .username("test_user_01")
                .password("password123")
                .build();

        // 2. GỌI HÀM
        AuthenticationResponse response = authenticationService.authenticate(request);

        // 3. EXPECTED OUTPUT (Kiểm tra phản ứng)
        assertNotNull(response);
        assertTrue(response.isAuthenticated());
        assertNotNull(response.getToken());
        assertEquals("test_user_01", response.getUsername());
    }

    /**
     * TEST CASE ID: IDN_15
     */
    @Test
    @DisplayName("IDN_15: Đăng nhập thất bại do User không tồn tại")
    void IDN_15_authenticate_userNotExist_fail() {
        // 1. INPUT
        AuthenticationRequest request = AuthenticationRequest.builder()
                .username("non_existent_user")
                .password("password123")
                .build();

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            authenticationService.authenticate(request);
        });
        assertEquals(ErrorCode.USER_NOT_EXISTED, exception.getErrorCode());
    }

    /**
     * TEST CASE ID: IDN_16
     */
    @Test
    @DisplayName("IDN_16: Đăng nhập thất bại do sai mật khẩu")
    void IDN_16_authenticate_wrongPassword_fail() {
        // 1. INPUT
        User user = new User();
        user.setUsername("test_user_02");
        user.setPassword(passwordEncoder.encode("password123"));
        userRepository.save(user);

        AuthenticationRequest request = AuthenticationRequest.builder()
                .username("test_user_02")
                .password("wrongpassword")
                .build();

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            authenticationService.authenticate(request);
        });
        assertEquals(ErrorCode.INCORRECT_PASSWORD, exception.getErrorCode());
    }
}
