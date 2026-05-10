package com.example.chatbot_service.dto.response;

import com.example.chatbot_service.entity.ConversationEntity.ConversationStatus;
import com.example.chatbot_service.entity.MessageEntity.MessageRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConversationResponse {

    private Long id;
    private String sessionId;
    private String userId;
    private String title;
    private ConversationStatus status;
    private List<MessageDto> messages;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MessageDto {
        private Long id;
        private MessageRole role;
        private String content;
        private List<Long> productIds;
        private Map<String, Object> metadata;
        private LocalDateTime createdAt;
    }
}
