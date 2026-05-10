package com.example.profile.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.profile.entity.UserProfile;

@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile, String> {
    UserProfile findByUserId(String userId);

    boolean existsUserProfileByEmail(String email);

    UserProfile findByEmail(String email);

    UserProfile findByPhone(String phone);

    boolean existsUserProfileByPhone(String phone);
}
