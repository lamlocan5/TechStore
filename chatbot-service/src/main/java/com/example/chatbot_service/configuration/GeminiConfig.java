package com.example.chatbot_service.configuration;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "gemini")
@Data
public class GeminiConfig {

    private String apiKey;
    private String model;
    private Double temperature;
    private Integer maxTokens;
    private String apiUrl;

    public String getGenerateContentUrl() {
        return apiUrl + "/" + model + ":generateContent?key=" + apiKey;
    }
}
