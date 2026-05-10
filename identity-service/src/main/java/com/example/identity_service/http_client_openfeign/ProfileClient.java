package com.example.identity_service.http_client_openfeign;

import com.example.identity_service.controller.AuthenticationRequestInterceptor;
import com.example.identity_service.dto.request.ProfileCreationRequest;
import com.example.identity_service.dto.response.UserProfileResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;


@FeignClient(name="profile-service", url = "${app.service.profile}", configuration = AuthenticationRequestInterceptor.class)
public interface ProfileClient {
    @PostMapping(value = "/internal/users", produces = MediaType.APPLICATION_JSON_VALUE)
    Object createProfile(@RequestBody ProfileCreationRequest profile);

    @PutMapping(value = "/internal/users", produces = MediaType.APPLICATION_JSON_VALUE)
    Object updateProfile(@RequestBody ProfileCreationRequest profile);

    @GetMapping(value = "/internal/users/{userId}", produces = MediaType.APPLICATION_JSON_VALUE)
    UserProfileResponse getUserProfileByUserId(@PathVariable String userId);
}
