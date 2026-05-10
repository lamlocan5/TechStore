package com.example.identity_service.controller;

import feign.RequestInterceptor;
import feign.RequestTemplate;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Slf4j
public class AuthenticationRequestInterceptor implements RequestInterceptor {
    @Override
    public void apply(RequestTemplate requestTemplate) {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.currentRequestAttributes();
        String headerAuthorization = attributes.getRequest().getHeader("Authorization");
        log.info("headerAuthorization: {}", headerAuthorization);

        if(headerAuthorization != null && headerAuthorization.startsWith("Bearer ")) {
            requestTemplate.header("Authorization", headerAuthorization);
        }
    }
}
