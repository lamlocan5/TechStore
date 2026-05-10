package com.example.identity_service.service;

import com.example.event.dto.NotificationEvent;
import com.example.identity_service.constant.PredefinedRole;
import com.example.identity_service.dto.request.PasswordChangeRequest;
import com.example.identity_service.dto.request.UserCreationRequest;
import com.example.identity_service.dto.request.UserUpdateRequest;
import com.example.identity_service.dto.response.UserResponse;
import com.example.identity_service.entity.Role;
import com.example.identity_service.entity.User;
import com.example.identity_service.entity.Rank;
import com.example.identity_service.exception.AppException;
import com.example.identity_service.exception.ErrorCode;
import com.example.identity_service.http_client_openfeign.ProfileClient;
import com.example.identity_service.mapper.ProfileMapper;
import com.example.identity_service.mapper.UserMapper;
import com.example.identity_service.repository.RoleRepository;
import com.example.identity_service.repository.UserRepository;
import feign.FeignException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.access.prepost.PostAuthorize;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class UserService {
    UserRepository userRepository;
    RoleRepository roleRepository;
    UserMapper userMapper;
    PasswordEncoder passwordEncoder;
    ProfileClient profileClient;
    ProfileMapper profileMapper;
    KafkaTemplate<String, Object> kafkaTemplate;

    public UserResponse createUser(UserCreationRequest request) {
        User user = userMapper.toUser(request);
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        HashSet<Role> roles = new HashSet<>();
        if (request.getRoles() != null && !request.getRoles().isEmpty()) {
            var foundRoles = roleRepository.findAllById(request.getRoles());
            roles.addAll(foundRoles);
        } else {
            roleRepository.findById(PredefinedRole.USER_ROLE).ifPresent(roles::add);
        }

        user.setRoles(roles);

        try {
            user = userRepository.save(user);
            var profileRequest = profileMapper.toProfileCreationRequest(request);
            profileRequest.setUserId(user.getId());

            // Gọi Profile Service qua Feign và bắt lỗi
            try {
                var profileResponse = profileClient.createProfile(profileRequest);
                log.info("Profile created successfully: {}", profileResponse);
            } catch (FeignException e) {
                // Rollback tạo user nếu gọi profile thất bại
                userRepository.delete(user);

                // Phân tích lỗi trả về từ Profile Service
                String errorMessage = e.contentUTF8();
                log.error("Profile service error: {}", errorMessage);

                // Ánh xạ mã lỗi cụ thể
                if (errorMessage.contains("1003") || errorMessage.contains("Email")) {
                    throw new AppException(ErrorCode.EMAIL_EXISTED);
                } else if (errorMessage.contains("1004") || errorMessage.contains("Phone")) {
                    throw new AppException(ErrorCode.PHONE_EXISTED);
                }

                throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
            }

            NotificationEvent notificationEvent = NotificationEvent.builder()
                    .chanel("EMAIL")
                    .recipient(request.getEmail())
                    .subject("Chào mừng bạn " + user.getUsername() + " – Cảm ơn đã đăng ký")
                    .body("""
                        Xin chào %s,
                        
                        Cảm ơn bạn đã đăng ký tài khoản tại hệ thống của chúng tôi.
                        Chúng tôi rất vui khi được đồng hành cùng bạn và hy vọng mang đến
                        những trải nghiệm tốt nhất trong quá trình sử dụng dịch vụ.
                        
                        Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với đội ngũ hỗ trợ
                        để được trợ giúp kịp thời.
                        
                        Trân trọng,
                        Đội ngũ hỗ trợ
                        """.formatted(user.getUsername()))
                    .build();
            kafkaTemplate.send("onboard-successful", notificationEvent);


        } catch (DataIntegrityViolationException exception) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }

        UserResponse response = userMapper.toUserResponse(user);
        response.setDob(request.getDob());
        return response;
    }

    @PostAuthorize("returnObject.username == authentication.name")
    public UserResponse updateUser(String userId, UserUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());

        User userResponse = userRepository.save(user);

        var profileRequest = profileMapper.toProfileUpdateRequest(request);
        profileRequest.setUserId(user.getId());

        // Gọi Profile Service qua Feign và bắt lỗi
        try {
            var profileResponse = profileClient.updateProfile(profileRequest);
            log.info("Profile updated successfully: {}", profileResponse);
        } catch (FeignException e) {
            String errorMessage = e.contentUTF8();
            log.error("Profile service error: {}", errorMessage);

            if (errorMessage.contains("1003") || errorMessage.contains("Email")) {
                throw new AppException(ErrorCode.EMAIL_EXISTED);
            } else if (errorMessage.contains("1004") || errorMessage.contains("Phone")) {
                throw new AppException(ErrorCode.PHONE_EXISTED);
            }

            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }

        return userMapper.toUserResponse(userResponse);
    }

    @PostAuthorize("returnObject.username == authentication.name")
    public UserResponse changePassword(String userId, PasswordChangeRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new AppException(ErrorCode.INCORRECT_PASSWORD);
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        User userResponse = userRepository.save(user);

        return userMapper.toUserResponse(userResponse);
    }

    public UserResponse getMyInfo() {
        var context = SecurityContextHolder.getContext();
        String name = context.getAuthentication().getName();

        User user = userRepository.findByUsername(name).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        return userMapper.toUserResponse(user);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public void deleteUser(String userId) {
        userRepository.deleteById(userId);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public List<UserResponse> getUsers() {
        log.info("In method get Users");
        return userRepository.findAll().stream().map(userMapper::toUserResponse).toList();
    }

    @PreAuthorize("hasRole('ADMIN')")
    public Page<UserResponse> getUsers(Pageable pageable) {
        log.info("In method get Users with pagination");
        return userRepository.findAll(pageable).map(userMapper::toUserResponse);
    }

    public UserResponse getUser(String id) {
        return userMapper.toUserResponse(
                userRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED)));
    }

    /**
     * Internal: Lấy user theo username (không yêu cầu ADMIN role)
     * Dùng cho service-to-service calls
     */
    public UserResponse getUserByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        return userMapper.toUserResponse(user);
    }

    private Rank calculateRank(Long totalSpent) {
        if (totalSpent == null) totalSpent = 0L;

        if (totalSpent > 100_000_000L) {
            return Rank.DIAMOND;
        } else if (totalSpent > 40_000_000L) {
            return Rank.GOLD;
        } else if (totalSpent > 10_000_000L) {
            return Rank.SILVER;
        } else {
            return Rank.BRONZE;
        }
    }

    /**
     * Internal: cộng dồn totalSpent khi đơn hàng hoàn thành và cập nhật rank nếu cần
     */
    public UserResponse addTotalSpent(String userId, Long amount) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        if (amount == null || amount <= 0) {
            return userMapper.toUserResponse(user);
        }

        long oldTotal = user.getTotalSpent() == null ? 0L : user.getTotalSpent();
        Rank oldRank = user.getRank() == null ? Rank.BRONZE : user.getRank();

        long newTotal = oldTotal + amount;
        user.setTotalSpent(newTotal);

        Rank newRank = calculateRank(newTotal);
        user.setRank(newRank);

        user = userRepository.save(user);

        return userMapper.toUserResponse(user);
    }
}
