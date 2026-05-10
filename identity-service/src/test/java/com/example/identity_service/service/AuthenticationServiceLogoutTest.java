package com.example.identity_service.service;

import com.example.identity_service.dto.request.AuthenticationRequest;
import com.example.identity_service.dto.request.LogoutRequest;
import com.example.identity_service.dto.response.AuthenticationResponse;
import com.example.identity_service.entity.User;
import com.example.identity_service.repository.InvalidatedTokenRepository;
import com.example.identity_service.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.text.ParseException;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class AuthenticationServiceLogoutTest {

    @Autowired
    private AuthenticationService authenticationService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private InvalidatedTokenRepository invalidatedTokenRepository;

    private PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);

    /**
     * TEST CASE ID: IDN_17
     */
    @Test
    @DisplayName("IDN_17: Đăng xuất thành công")
    void IDN_17_logout_validToken_success() throws Exception {
        // 1. INPUT (Dữ liệu đầu vào)
        User user = new User();
        user.setUsername("test_user_01");
        user.setPassword(passwordEncoder.encode("password123"));
        userRepository.save(user);

        AuthenticationRequest authRequest = AuthenticationRequest.builder()
                .username("test_user_01")
                .password("password123")
                .build();
        AuthenticationResponse authResponse = authenticationService.authenticate(authRequest);
        
        LogoutRequest request = LogoutRequest.builder()
                .token(authResponse.getToken())
                .build();

        // 2. GỌI HÀM
        authenticationService.logout(request);

        // 3. EXPECTED OUTPUT (Kiểm tra phản ứng)
        // Token sẽ bị lưu vào bảng invalidated_token
        assertEquals(1, invalidatedTokenRepository.count());
    }

    /**
     * TEST CASE ID: IDN_18
     */
    @Test
    @DisplayName("IDN_18: Đăng xuất với token sai định dạng")
    void IDN_18_logout_invalidToken_fail() {
        // 1. INPUT
        LogoutRequest request = LogoutRequest.builder()
                .token("invalid.token.string")
                .build();

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        assertThrows(ParseException.class, () -> {
            authenticationService.logout(request);
        });
    }
}
