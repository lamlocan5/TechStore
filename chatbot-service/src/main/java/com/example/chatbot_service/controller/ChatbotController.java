package com.example.chatbot_service.controller;

import com.example.chatbot_service.dto.request.ChatMessageRequest;
import com.example.chatbot_service.dto.response.ApiResponse;
import com.example.chatbot_service.dto.response.ChatMessageResponse;
import com.example.chatbot_service.dto.response.ConversationResponse;
import com.example.chatbot_service.dto.response.PaginatedResponse;
import com.example.chatbot_service.service.CacheService;
import com.example.chatbot_service.service.ChatbotService;
import com.example.chatbot_service.service.ConversationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/chat")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class ChatbotController {

    private final ChatbotService chatbotService;
    private final ConversationService conversationService;
    private final CacheService cacheService;

    /**
     * Send a message and get AI response
     * POST /chatbot/chat/message
     */
    @PostMapping("/message")
    public ApiResponse<ChatMessageResponse> sendMessage(
            @Valid @RequestBody ChatMessageRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        String userId = jwt.getSubject();
        log.info("Received message from user: {}, session: {}, content length: {}",
                userId, request.getSessionId(), request.getContent().length());

        try {
            ChatMessageResponse response = chatbotService.processMessage(
                    request.getSessionId(),
                    request.getContent(),
                    userId
            );

            log.info("Successfully processed message, returning session: {}", response.getSessionId());
            return ApiResponse.success(response);
        } catch (RuntimeException e) {
            log.error("Error processing message: {}", e.getMessage(), e);
            return ApiResponse.error(400, e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error processing message", e);
            return ApiResponse.error(500, "Internal server error: " + e.getMessage());
        }
    }

    /**
     * Get user's conversation history (paginated)
     * GET /chatbot/chat/conversations?page=1&limit=20
     */
    @GetMapping("/conversations")
    public ApiResponse<PaginatedResponse<ConversationResponse>> getConversations(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @AuthenticationPrincipal Jwt jwt
    ) {
        String userId = jwt.getSubject();
        log.info("Fetching conversations for user: {}, page: {}, limit: {}", userId, page, limit);

        PaginatedResponse<ConversationResponse> conversations =
                conversationService.getUserConversations(userId, page, limit);

        return ApiResponse.success(conversations);
    }

    /**
     * Get specific conversation with all messages
     * GET /chatbot/chat/conversations/{sessionId}
     */
    @GetMapping("/conversations/{sessionId}")
    public ApiResponse<ConversationResponse> getConversation(
            @PathVariable String sessionId,
            @AuthenticationPrincipal Jwt jwt
    ) {
        String userId = jwt.getSubject();
        log.info("Fetching conversation: {} for user: {}", sessionId, userId);

        try {
            ConversationResponse conversation =
                    conversationService.getConversationWithMessages(sessionId, userId);

            return ApiResponse.success(conversation);
        } catch (RuntimeException e) {
            log.error("Error fetching conversation", e);
            return ApiResponse.error(404, e.getMessage());
        }
    }

    /**
     * Delete a conversation
     * DELETE /chatbot/chat/conversations/{sessionId}
     */
    @DeleteMapping("/conversations/{sessionId}")
    public ApiResponse<Void> deleteConversation(
            @PathVariable String sessionId,
            @AuthenticationPrincipal Jwt jwt
    ) {
        String userId = jwt.getSubject();
        log.info("Deleting conversation: {} for user: {}", sessionId, userId);

        try {
            conversationService.deleteConversation(sessionId, userId);
            return ApiResponse.success(null);
        } catch (RuntimeException e) {
            log.error("Error deleting conversation", e);
            return ApiResponse.error(404, e.getMessage());
        }
    }

    /**
     * Archive a conversation
     * POST /chatbot/chat/conversations/{sessionId}/archive
     */
    @PostMapping("/conversations/{sessionId}/archive")
    public ApiResponse<Void> archiveConversation(
            @PathVariable String sessionId,
            @AuthenticationPrincipal Jwt jwt
    ) {
        String userId = jwt.getSubject();
        log.info("Archiving conversation: {} for user: {}", sessionId, userId);

        try {
            conversationService.archiveConversation(sessionId, userId);
            return ApiResponse.success(null);
        } catch (RuntimeException e) {
            log.error("Error archiving conversation", e);
            return ApiResponse.error(404, e.getMessage());
        }
    }

    /**
     * Clear all response cache (admin operation)
     * DELETE /chatbot/chat/cache
     */
    @DeleteMapping("/cache")
    public ApiResponse<Void> clearCache() {
        log.info("Clearing all response cache");
        cacheService.clearAllCache();
        return ApiResponse.success(null);
    }
}
