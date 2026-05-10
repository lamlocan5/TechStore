package com.example.profile.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.profile.dto.ApiResponse;
import com.example.profile.dto.PaginatedResponse;
import com.example.profile.dto.response.UserProfileResponse;
import com.example.profile.service.UserProfileService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class UserProfileController {
    UserProfileService userProfileService;

    @GetMapping("/users")
    ApiResponse<PaginatedResponse<UserProfileResponse>> getAllProfiles(
            @RequestParam(required = false) Integer page, @RequestParam(required = false) Integer limit) {

        // Default pagination: page=1, limit=12 if not provided
        int pageNumber = (page != null && page > 0) ? page : 1;
        int pageSize = (limit != null && limit > 0) ? limit : 12;

        Pageable pageable = PageRequest.of(pageNumber - 1, pageSize);
        Page<UserProfileResponse> profilePage = userProfileService.getAllProfiles(pageable);

        PaginatedResponse<UserProfileResponse> paginatedResponse = PaginatedResponse.<UserProfileResponse>builder()
                .result(profilePage.getContent())
                .total(profilePage.getTotalElements())
                .page(pageNumber)
                .size(pageSize)
                .totalPages(profilePage.getTotalPages())
                .build();

        return ApiResponse.<PaginatedResponse<UserProfileResponse>>builder()
                .result(paginatedResponse)
                .build();
    }

    @GetMapping("/users/{userId}")
    UserProfileResponse getProfileByUserId(@PathVariable String userId) {
        return userProfileService.getProfileByUserId(userId);
    }

    @GetMapping("/{profileId}")
    UserProfileResponse getProfile(@PathVariable String profileId) {
        log.info(profileId);
        return userProfileService.getProfile(profileId);
    }
}
