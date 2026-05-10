package com.example.identity_service.service;

import com.example.identity_service.constant.PredefinedRole;
import com.example.identity_service.dto.request.UserCreationRequest;
import com.example.identity_service.dto.response.UserProfileResponse;
import com.example.identity_service.dto.response.UserResponse;
import com.example.identity_service.entity.Role;
import com.example.identity_service.entity.User;
import com.example.identity_service.exception.AppException;
import com.example.identity_service.exception.ErrorCode;
import com.example.identity_service.http_client_openfeign.ProfileClient;
import com.example.identity_service.repository.RoleRepository;
import com.example.identity_service.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;

@SpringBootTest
@Transactional
public class UserServiceCreateUserTest {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @MockBean
    private ProfileClient profileClient;

    @MockBean
    private KafkaTemplate<String, Object> kafkaTemplate;

    @BeforeEach
    void setUp() {
        // Giả lập API trả về thành công cho mọi test case
        UserProfileResponse mockProfileResponse = new UserProfileResponse();
        Mockito.when(profileClient.createProfile(any())).thenReturn(mockProfileResponse);
        Mockito.when(kafkaTemplate.send(any(String.class), any())).thenReturn(null);

        // Tạo quyền mặc định
        if (!roleRepository.existsById(PredefinedRole.USER_ROLE)) {
            Role userRole = new Role();
            userRole.setName(PredefinedRole.USER_ROLE);
            roleRepository.save(userRole);
        }
    }

    /**
     * TEST CASE ID: IDN_1
     */
    @Test
    @DisplayName("IDN_1: Người dùng đủ thông tin hợp lệ")
    void IDN_1_createUser_validRequest_success() {
        // 1. INPUT (Dữ liệu đầu vào)
        UserCreationRequest request = UserCreationRequest.builder()
                .username("test_user_01")
                .password("password123")
                .firstName("Nguyen")
                .build();

        // 2. GỌI HÀM
        UserResponse response = userService.createUser(request);

        // 3. EXPECTED OUTPUT (Kiểm tra phản ứng)
        assertNotNull(response);
        assertEquals("test_user_01", response.getUsername());

        // CheckDB
        Optional<User> savedUser = userRepository.findByUsername("test_user_01");
        assertTrue(savedUser.isPresent());
    }

    /**
     * TEST CASE ID: IDN_2
     */
    @Test
    @DisplayName("IDN_2: Người dùng có tên đăng nhập đã tồn tại")
    void IDN_2_createUser_userExisted_fail() {
        // 1. INPUT
        User existingUser = new User();
        existingUser.setUsername("test_user_01");
        existingUser.setPassword("123456");
        userRepository.saveAndFlush(existingUser);

        UserCreationRequest request = UserCreationRequest.builder()
                .username("test_user_01")
                .password("password123")
                .build();

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            userService.createUser(request);
            userRepository.flush();
        });


        assertEquals(ErrorCode.USER_EXISTED, exception.getErrorCode());

    }

    /**
     * TEST CASE ID: IDN_3
     */
    @Test
    @DisplayName("IDN_3: Người dùng có trường dữ liệu không hợp lệ")
    void IDN_3_createUser_invalidData_fail() {
        // 1. INPUT (Mật khẩu quá ngắn)
        UserCreationRequest request = UserCreationRequest.builder()
                .username("test_user_03")
                .password("123")
                .build();

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        // KỲ VỌNG: Hàm phải báo lỗi vì mật khẩu quá ngắn.
        // Nếu hàm không báo lỗi mà cứ thế chạy qua, hàm assertThrows sẽ đánh FAILED
        // (Màu đỏ) test case này.
        assertThrows(Exception.class, () -> {
            userService.createUser(request);
        }, "LỖI HỆ THỐNG: Hàm createUser đã xử lý thành công thay vì báo lỗi mật khẩu ngắn!");

        // CheckDB: Đảm bảo không có user nào với username "test_user_03" được lưu vào database
        Optional<User> savedUser = userRepository.findByUsername("test_user_03");
        assertFalse(savedUser.isPresent());
    }

    /**
     * TEST CASE ID: IDN_4
     */
    @Test
    @DisplayName("IDN_4: Người dùng trường dữ liệu bị thiếu (là null)")
    void IDN_4_createUser_missingData_fail() {
        // 1. INPUT (Thiếu Username)
        UserCreationRequest request = UserCreationRequest.builder()
                .username(null)
                .password("password123")
                .build();

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        // KỲ VỌNG: Hàm phải báo lỗi vì thiếu dữ liệu bắt buộc (Username).
        // Nếu hàm cứ thế lưu thẳng chữ null xuống Database thành công, test case này sẽ
        // FAILED (Màu đỏ).
        assertThrows(Exception.class, () -> {
            userService.createUser(request);
        }, "LỖI HỆ THỐNG: Hàm createUser đã lưu thành công một user bị thủng dữ liệu (username = null)!");

        // CheckDB: Đảm bảo không có user nào bị lưu vào database với username là null
        Optional<User> savedUser = userRepository.findByUsername(null);
        assertFalse(savedUser.isPresent());
    }
}
