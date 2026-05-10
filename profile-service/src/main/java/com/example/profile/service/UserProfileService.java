package com.example.profile.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import com.example.profile.dto.request.ProfileCreationRequest;
import com.example.profile.dto.response.UserProfileResponse;
import com.example.profile.entity.UserProfile;
import com.example.profile.exception.AppException;
import com.example.profile.exception.ErrorCode;
import com.example.profile.mapper.UserProfileMapper;
import com.example.profile.repository.UserProfileRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class UserProfileService {
    UserProfileRepository userProfileRepository;
    UserProfileMapper userProfileMapper;

    public UserProfileResponse createProfile(ProfileCreationRequest request) {
        UserProfile userProfile = userProfileMapper.toUserProfile(request);

        if (userProfileRepository.existsUserProfileByEmail(userProfile.getEmail())) {
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }

        if (userProfileRepository.existsUserProfileByPhone(userProfile.getPhone())) {
            throw new AppException(ErrorCode.PHONE_EXISTED);
        }

        userProfile = userProfileRepository.save(userProfile);

        return userProfileMapper.toUserProfileReponse(userProfile);
    }

    public UserProfileResponse updateProfile(ProfileCreationRequest request) {
        UserProfile userProfile = userProfileRepository.findByUserId(request.getUserId());
        userProfile.setFirstName(request.getFirstName());
        userProfile.setLastName(request.getLastName());
        userProfile.setEmail(request.getEmail());
        userProfile.setPhone(request.getPhone());
        userProfile.setAvatar(request.getAvatar());
        userProfile.setDob(request.getDob());

        UserProfile userByEmail = userProfileRepository.findByEmail(userProfile.getEmail());
        if (userByEmail != null && !userByEmail.getUserId().equals(request.getUserId())) {
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }

        UserProfile userByPhone = userProfileRepository.findByPhone(userProfile.getPhone());
        if (userByPhone != null && !userByPhone.getUserId().equals(request.getUserId())) {
            throw new AppException(ErrorCode.PHONE_EXISTED);
        }

        userProfile = userProfileRepository.save(userProfile);

        return userProfileMapper.toUserProfileReponse(userProfile);
    }

    public UserProfileResponse getProfile(String id) {
        log.info(id);
        UserProfile userProfile =
                userProfileRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.PROFILE_NOT_FOUND));

        return userProfileMapper.toUserProfileReponse(userProfile);
    }

    public UserProfileResponse getProfileByUserId(String userId) {
        UserProfile userProfile = userProfileRepository.findByUserId(userId);

        return userProfileMapper.toUserProfileReponse(userProfile);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public List<UserProfileResponse> getAllProfiles() {
        var profiles = userProfileRepository.findAll();

        return profiles.stream().map(userProfileMapper::toUserProfileReponse).toList();
    }

    @PreAuthorize("hasRole('ADMIN')")
    public Page<UserProfileResponse> getAllProfiles(Pageable pageable) {
        return userProfileRepository.findAll(pageable).map(userProfileMapper::toUserProfileReponse);
    }
}
