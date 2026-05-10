package com.example.identity_service.service;

import com.example.identity_service.dto.response.UserResponse;
import com.example.identity_service.entity.User;
import com.example.identity_service.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class UserServiceGetUsersTest {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    /**
     * TEST CASE ID: IDN_11
     */
    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("IDN_11: Lấy danh sách user")
    void IDN_11_getUsers_success() {
        // 1. INPUT (Dữ liệu đầu vào)
        User user1 = new User();
        user1.setUsername("user1");
        userRepository.save(user1);

        User user2 = new User();
        user2.setUsername("user2");
        userRepository.save(user2);

        // 2. GỌI HÀM
        List<UserResponse> users = userService.getUsers();

        // 3. EXPECTED OUTPUT (Kiểm tra phản ứng)
        assertNotNull(users);
        assertTrue(users.size() >= 2);
    }
}
