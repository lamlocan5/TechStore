package com.example.identity_service.mapper;

import com.example.identity_service.dto.request.UserCreationRequest;
import com.example.identity_service.dto.request.UserUpdateRequest;
import com.example.identity_service.dto.response.UserResponse;
import com.example.identity_service.entity.Role;
import com.example.identity_service.entity.User;
import com.example.identity_service.entity.Rank;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface UserMapper {
    User toUser(UserCreationRequest request);

    @Mapping(target = "totalSpent", expression = "java(defaultTotalSpent(user.getTotalSpent()))")
    @Mapping(target = "rank", expression = "java(defaultRank(user.getRank()))")
    UserResponse toUserResponse(User user);

    @Mapping(target = "roles", ignore = true)
    void updateUser(@MappingTarget User user, UserUpdateRequest request);

    default Long defaultTotalSpent(Long totalSpent) {
        return totalSpent != null ? totalSpent : 0L;
    }

    default String defaultRank(Rank rank) {
        return rank != null ? rank.name() : Rank.BRONZE.name();
    }

    default Role map(String roleName) {
        return Role.builder()
                .name(roleName)
                .build();
    }

}
