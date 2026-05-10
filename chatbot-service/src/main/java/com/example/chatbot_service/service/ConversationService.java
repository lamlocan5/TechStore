package com.example.chatbot_service.service;

import com.example.chatbot_service.dto.response.ChatMessageResponse;
import com.example.chatbot_service.dto.response.ConversationResponse;
import com.example.chatbot_service.dto.response.PaginatedResponse;
import com.example.chatbot_service.entity.ConversationEntity;
import com.example.chatbot_service.entity.MessageEntity;
import com.example.chatbot_service.repository.ConversationRepository;
import com.example.chatbot_service.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;

    /**
     * Create a new conversation for a user
     */
    @Transactional
    public ConversationEntity createConversation(String userId, String firstMessage) {
        String sessionId = UUID.randomUUID().toString();

        ConversationEntity conversation = ConversationEntity.builder()
                .userId(userId)
                .sessionId(sessionId)
                .title(generateTitle(firstMessage))
                .status(ConversationEntity.ConversationStatus.ACTIVE)
                .build();

        return conversationRepository.save(conversation);
    }

    /**
     * Get conversation by session ID
     */
    public ConversationEntity getConversationBySessionId(String sessionId) {
        return conversationRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));
    }

    /**
     * Get user's conversations with pagination
     */
    public PaginatedResponse<ConversationResponse> getUserConversations(
            String userId, int page, int limit) {
        Pageable pageable = PageRequest.of(page - 1, limit,
                Sort.by(Sort.Direction.DESC, "updatedAt"));

        Page<ConversationEntity> conversationPage =
                conversationRepository.findByUserId(userId, pageable);

        List<ConversationResponse> data = conversationPage.getContent().stream()
                .map(this::convertToConversationResponse)
                .collect(Collectors.toList());

        return PaginatedResponse.of(data, page, limit, conversationPage.getTotalElements());
    }

    /**
     * Get conversation with all messages
     */
    public ConversationResponse getConversationWithMessages(String sessionId, String userId) {
        ConversationEntity conversation = getConversationBySessionId(sessionId);

        // Verify user owns this conversation
        if (!conversation.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized access to conversation");
        }

        return convertToConversationResponse(conversation);
    }

    /**
     * Add message to conversation
     */
    @Transactional
    public MessageEntity addMessage(ConversationEntity conversation,
                                     MessageEntity.MessageRole role,
                                     String content,
                                     List<Long> productIds) {
        MessageEntity message = MessageEntity.builder()
                .conversation(conversation)
                .role(role)
                .content(content)
                .productIds(productIds)
                .build();

        return messageRepository.save(message);
    }

    /**
     * Delete conversation
     */
    @Transactional
    public void deleteConversation(String sessionId, String userId) {
        ConversationEntity conversation = getConversationBySessionId(sessionId);

        // Verify user owns this conversation
        if (!conversation.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized access to conversation");
        }

        conversationRepository.delete(conversation);
    }

    /**
     * Archive conversation
     */
    @Transactional
    public void archiveConversation(String sessionId, String userId) {
        ConversationEntity conversation = getConversationBySessionId(sessionId);

        // Verify user owns this conversation
        if (!conversation.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized access to conversation");
        }

        conversation.setStatus(ConversationEntity.ConversationStatus.ARCHIVED);
        conversationRepository.save(conversation);
    }

    /**
     * Get latest N messages from a conversation
     */
    public List<MessageEntity> getLatestMessages(Long conversationId, int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        List<MessageEntity> messages = messageRepository
                .findLatestMessagesByConversationId(conversationId, pageable);

        // Reverse to get chronological order
        return messages.stream()
                .sorted((a, b) -> a.getCreatedAt().compareTo(b.getCreatedAt()))
                .collect(Collectors.toList());
    }

    /**
     * Get message count for a conversation
     */
    public long getMessageCount(Long conversationId) {
        return messageRepository.countByConversationId(conversationId);
    }

    // Helper methods

    private String generateTitle(String firstMessage) {
        if (firstMessage == null || firstMessage.isBlank()) {
            return "New Conversation";
        }

        // Take first 50 characters as title
        return firstMessage.length() > 50
                ? firstMessage.substring(0, 50) + "..."
                : firstMessage;
    }

    private ConversationResponse convertToConversationResponse(ConversationEntity conversation) {
        List<ConversationResponse.MessageDto> messageDtos = conversation.getMessages().stream()
                .map(this::convertToMessageDto)
                .collect(Collectors.toList());

        return ConversationResponse.builder()
                .id(conversation.getId())
                .sessionId(conversation.getSessionId())
                .userId(conversation.getUserId())
                .title(conversation.getTitle())
                .status(conversation.getStatus())
                .messages(messageDtos)
                .createdAt(conversation.getCreatedAt())
                .updatedAt(conversation.getUpdatedAt())
                .build();
    }

    private ConversationResponse.MessageDto convertToMessageDto(MessageEntity message) {
        return ConversationResponse.MessageDto.builder()
                .id(message.getId())
                .role(message.getRole())
                .content(message.getContent())
                .productIds(message.getProductIds())
                .metadata(message.getMetadata())
                .createdAt(message.getCreatedAt())
                .build();
    }

    public ChatMessageResponse.MessageDto convertToMessageResponseDto(MessageEntity message) {
        return ChatMessageResponse.MessageDto.builder()
                .id(message.getId())
                .role(message.getRole())
                .content(message.getContent())
                .productIds(message.getProductIds())
                .metadata(message.getMetadata())
                .createdAt(message.getCreatedAt())
                .build();
    }
}
