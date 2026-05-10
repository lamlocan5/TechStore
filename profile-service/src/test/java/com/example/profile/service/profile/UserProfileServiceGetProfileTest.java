package com.example.profile.service.profile;

import static org.junit.jupiter.api.Assertions.*;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.transaction.annotation.Transactional;

import com.example.profile.dto.response.UserProfileResponse;
import com.example.profile.entity.UserProfile;
import com.example.profile.exception.AppException;
import com.example.profile.exception.ErrorCode;
import com.example.profile.repository.UserProfileRepository;
import com.example.profile.service.UserProfileService;

@SpringBootTest
@Transactional
public class UserProfileServiceGetProfileTest {

    @Autowired
    private UserProfileService userProfileService;

    @Autowired
    private UserProfileRepository userProfileRepository;

    /**
     * Helper: Tạo và lưu một UserProfile vào DB
     */
    private UserProfile createAndSaveProfile(String userId, String email, String phone) {
        UserProfile profile = new UserProfile();
        profile.setUserId(userId);
        profile.setFirstName("Nguyen");
        profile.setLastName("Van A");
        profile.setEmail(email);
        profile.setPhone(phone);
        profile.setStatus(1);
        return userProfileRepository.saveAndFlush(profile);
    }

    /**
     * TEST CASE ID: PRF_17
     */
    @Test
    @DisplayName("PRF_17: Xem chi tiết profile thành công theo ID hồ sơ")
    void PRF_17_getProfile_validId_success() {
        // 1. INPUT
        UserProfile saved = createAndSaveProfile("user-011", "user011@example.com", "0940000011");

        // 2. GỌI HÀM
        UserProfileResponse response = userProfileService.getProfile(saved.getId());

        // 3. EXPECTED OUTPUT
        assertNotNull(response);
        assertEquals(saved.getId(), response.getId());
        assertEquals("user-011", response.getUserId());
        assertEquals("user011@example.com", response.getEmail());
    }

    /**
     * TEST CASE ID: PRF_18
     */
    @Test
    @DisplayName("PRF_18: Xem profile thất bại do ID hồ sơ không tồn tại")
    void PRF_18_getProfile_notFound_fail() {
        // 1. INPUT
        String invalidId = "non-existent-id-99999";

        // 2 & 3. GỌI HÀM & EXPECTED OUTPUT
        AppException exception = assertThrows(AppException.class, () -> {
            userProfileService.getProfile(invalidId);
        });
        assertEquals(ErrorCode.PROFILE_NOT_FOUND, exception.getErrorCode());
    }

    /**
     * TEST CASE ID: PRF_19
     */
    @Test
    @DisplayName("PRF_19: Lấy profile thành công theo userId")
    void PRF_19_getProfileByUserId_validUserId_success() {
        // 1. INPUT
        createAndSaveProfile("user-013", "user013@example.com", "0940000013");

        // 2. GỌI HÀM
        UserProfileResponse response = userProfileService.getProfileByUserId("user-013");

        // 3. EXPECTED OUTPUT
        assertNotNull(response);
        assertEquals("user-013", response.getUserId());
        assertEquals("user013@example.com", response.getEmail());
    }

    /**
     * TEST CASE ID: PRF_20
     */
    @Test
    @DisplayName("PRF_20: Lấy profile theo userId không tồn tại trả về null (không ném exception)")
    void PRF_20_getProfileByUserId_notFound_returnsNull() {
        // 1. INPUT
        String nonExistentUserId = "user-not-exist-99999";

        // 2. GỌI HÀM
        UserProfileResponse response = userProfileService.getProfileByUserId(nonExistentUserId);

        // 3. EXPECTED OUTPUT - Hàm findByUserId trả về null nên response sẽ là null
        assertNull(response);
    }

    /**
     * TEST CASE ID: PRF_21
     */
    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("PRF_21: Lấy toàn bộ danh sách profile thành công (ADMIN)")
    void PRF_21_getAllProfiles_asAdmin_success() {
        // 1. INPUT - Tạo nhiều profiles
        createAndSaveProfile("user-015a", "user015a@example.com", "0940000151");
        createAndSaveProfile("user-015b", "user015b@example.com", "0940000152");
        createAndSaveProfile("user-015c", "user015c@example.com", "0940000153");

        // 2. GỌI HÀM
        List<UserProfileResponse> results = userProfileService.getAllProfiles();

        // 3. EXPECTED OUTPUT
        assertNotNull(results);
        assertTrue(results.size() >= 3);
    }

    /**
     * TEST CASE ID: PRF_22
     */
    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("PRF_22: Lấy danh sách profile phân trang thành công (ADMIN)")
    void PRF_22_getAllProfiles_pageable_success() {
        // 1. INPUT - Tạo nhiều profiles
        for (int i = 1; i <= 5; i++) {
            createAndSaveProfile("user-016-" + i, "user016" + i + "@example.com", "094000016" + i);
        }

        PageRequest pageRequest = PageRequest.of(0, 2);

        // 2. GỌI HÀM
        Page<UserProfileResponse> results = userProfileService.getAllProfiles(pageRequest);

        // 3. EXPECTED OUTPUT
        assertNotNull(results);
        assertEquals(2, results.getSize());
        assertTrue(results.getTotalElements() >= 5);
        assertNotNull(results.getContent());
        assertFalse(results.getContent().isEmpty());
    }
}
