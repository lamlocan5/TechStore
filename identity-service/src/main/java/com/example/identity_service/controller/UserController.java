package com.example.identity_service.controller;

import com.example.identity_service.dto.request.ApiResponse;
import com.example.identity_service.dto.request.PasswordChangeRequest;
import com.example.identity_service.dto.request.UserCreationRequest;
import com.example.identity_service.dto.request.UserUpdateRequest;
import com.example.identity_service.dto.request.AddSpentRequest;
import com.example.identity_service.dto.response.PaginatedResponse;
import com.example.identity_service.dto.response.UserResponse;
import com.example.identity_service.service.UserService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class UserController {
    UserService userService;

    @PostMapping("/createUser")
    ApiResponse<UserResponse> createUser(@RequestBody @Valid UserCreationRequest request) {
        return ApiResponse.<UserResponse>builder()
                .result(userService.createUser(request))
                .build();
    }

    @GetMapping
    ApiResponse<PaginatedResponse<UserResponse>> getUsers(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit) {
        
        // Phân trang mặc định: page=1, limit=12 nếu không truyền
        int pageNumber = (page != null && page > 0) ? page : 1;
        int pageSize = (limit != null && limit > 0) ? limit : 12;
        
        Pageable pageable = PageRequest.of(pageNumber - 1, pageSize);
        Page<UserResponse> userPage = userService.getUsers(pageable);
        
        PaginatedResponse<UserResponse> paginatedResponse = PaginatedResponse.<UserResponse>builder()
                .result(userPage.getContent())
                .total(userPage.getTotalElements())
                .page(pageNumber)
                .size(pageSize)
                .totalPages(userPage.getTotalPages())
                .build();
        
        return ApiResponse.<PaginatedResponse<UserResponse>>builder()
                .result(paginatedResponse)
                .build();
    }

    @GetMapping("/{userId}")
    ApiResponse<UserResponse> getUser(@PathVariable("userId") String userId) {
        return ApiResponse.<UserResponse>builder()
                .result(userService.getUser(userId))
                .build();
    }

    @GetMapping("/my-info")
    ApiResponse<UserResponse> getMyInfo() {
        return ApiResponse.<UserResponse>builder()
                .result(userService.getMyInfo())
                .build();
    }

    @DeleteMapping("/{userId}")
    ApiResponse<String> deleteUser(@PathVariable String userId) {
        userService.deleteUser(userId);
        return ApiResponse.<String>builder().result("User has been deleted").build();
    }

    @PutMapping("/{userId}")
    ApiResponse<UserResponse> updateUser(@PathVariable String userId, @RequestBody UserUpdateRequest request) {
        return ApiResponse.<UserResponse>builder()
                .result(userService.updateUser(userId, request))
                .build();
    }

    @PutMapping("/{userId}/change-password")
    ApiResponse<UserResponse> changePassword(@PathVariable String userId, @RequestBody PasswordChangeRequest passwordChangeRequest) {
        return ApiResponse.<UserResponse>builder()
                .result(userService.changePassword(userId, passwordChangeRequest))
                .build();
    }

    /**
     * Internal endpoint: cộng total_spent khi đơn hàng hoàn thành.
     * Dùng cho service-to-service call, không expose cho FE.
     * @param userId có thể là userId (UUID) hoặc username
     */
    @PostMapping("/internal/{userId}/add-spent")
    ApiResponse<UserResponse> addSpent(
            @PathVariable String userId,
            @RequestBody AddSpentRequest request
    ) {
        // Kiểm tra xem userId có phải UUID không
        // Nếu không phải UUID, có thể là username, cần tìm userId trước
        String actualUserId = userId;
        
        // Định dạng UUID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
        if (!userId.matches("^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$")) {
            // Không phải UUID, thử tìm user theo username
            try {
                UserResponse user = userService.getUserByUsername(userId);
                if (user != null) {
                    actualUserId = user.getId();
                    log.info("Found userId {} for username {}", actualUserId, userId);
                } else {
                    log.error("Cannot find user with username: {}", userId);
                    throw new RuntimeException("User not found: " + userId);
                }
            } catch (Exception e) {
                log.error("Error getting userId from username {}: {}", userId, e.getMessage());
                throw new RuntimeException("Cannot find userId for username: " + userId, e);
            }
        }
        
        return ApiResponse.<UserResponse>builder()
                .result(userService.addTotalSpent(actualUserId, request.getAmount()))
                .build();
    }
    
    /**
     * Internal endpoint: lấy userId từ username
     * Dùng cho service-to-service call
     */
    @GetMapping("/internal/by-username/{username}")
    ApiResponse<String> getUserIdByUsername(@PathVariable String username) {
        try {
            UserResponse user = userService.getUserByUsername(username);
            if (user != null) {
                return ApiResponse.<String>builder()
                        .result(user.getId())
                        .build();
            } else {
                return ApiResponse.<String>builder()
                        .result(null)
                        .build();
            }
        } catch (Exception e) {
            log.error("Error getting userId from username {}: {}", username, e.getMessage());
            return ApiResponse.<String>builder()
                    .result(null)
                    .build();
        }
    }
}
