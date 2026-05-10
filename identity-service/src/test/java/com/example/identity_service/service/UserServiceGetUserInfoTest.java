package com.example.identity_service.service;

import com.example.identity_service.dto.response.UserResponse;
import com.example.identity_service.entity.User;
import com.example.identity_service.exception.AppException;
import com.example.identity_service.exception.ErrorCode;
import com.example.identity_service.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class UserServiceGetUserInfoTest {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    /**
     * TEST CASE ID: IDN_12
     */
    @Test
    @WithMockUser(username = "test_user_01")
    @DisplayName("IDN_12: Lấy thông tin bản thân")
    void IDN_12_getMyInfo_success() {
        // 1. INPUT (Dữ liệu đầu vào)
        User user = new User();
        user.setUsername("test_user_01");
        user.setFirstName("MyName");
        userRepository.save(user);

        // 2. GỌI HÀM
        UserResponse response = userService.getMyInfo();

        // 3. EXPECTED OUTPUT (Kiểm tra phản ứng)
        assertNotNull(response);
        assertEquals("test_user_01", response.getUsername());
        assertEquals("MyName", response.getFirstName());
    }

    /**
     * TEST CASE ID: IDN_13
     */
    @Test
    @DisplayName("IDN_13: User không tồn tại")
    void IDN_13_getUser_notExist_fail() {
        // 1. INPUT (Không có user nào trong DB)
        
        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            userService.getUser("invalid_id");
        });
        assertEquals(ErrorCode.USER_NOT_EXISTED, exception.getErrorCode());
    }
}
