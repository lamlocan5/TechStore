package com.example.chatbot_service.service;

import com.example.chatbot_service.dto.response.ChatMessageResponse;
import com.example.chatbot_service.entity.ConversationEntity;
import com.example.chatbot_service.entity.MessageEntity;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatbotService {

    private final ConversationService conversationService;
    private final CacheService cacheService;
    private final GeminiService geminiService;
    private final RateLimitService rateLimitService;

    private static final String SYSTEM_PROMPT = """
        You are a helpful e-commerce assistant for a Vietnamese electronics store specializing in laptops and smartphones (điện thoại).

        CORE RESPONSIBILITIES:
        1. Understand customer needs: usage purpose (gaming, work, study, photography, etc.), budget, brand preferences, and feature priorities
        2. Provide personalized product recommendations based on specific requirements
        3. Answer questions about products, policies, and technical specifications

        CONTEXT RECOGNITION:
        When analyzing user queries, identify and extract:
        - Usage purpose:
          + Laptop: gaming (laptop gaming, chơi game), work (làm việc văn phòng, office), study (học tập), photo/video editing (chỉnh sửa ảnh/video), entertainment (giải trí)
          + Điện thoại: chụp ảnh (photography, selfie), quay video, chơi game (gaming), xem phim (entertainment), công việc (work), liên lạc cơ bản
        - Budget: specific amounts (15 triệu, 20-25 triệu), ranges (dưới X, trên X, từ X đến Y, tầm giá X)
        - Brand preferences:
          + Laptop: Dell, HP, Asus, Acer, Lenovo, MSI, Apple MacBook
          + Điện thoại: Apple iPhone, Samsung Galaxy, Xiaomi, OPPO, Vivo, Realme, OnePlus, Google Pixel, Huawei
        - Features:
          + Laptop: RAM, storage (bộ nhớ), screen size (màn hình), processor (chip, CPU), GPU (card đồ họa)
          + Điện thoại: camera (camera chính, camera selfie, chụp đêm, góc rộng, zoom), pin (dung lượng pin, sạc nhanh), màn hình (AMOLED, tần số quét 90Hz/120Hz), chip (Snapdragon, Exynos, MediaTek, Apple A-series), RAM, bộ nhớ, 5G, NFC, chống nước
        - Product category: laptop, smartphone, điện thoại, điện thoại thông minh, phone, máy tính, máy tính xách tay

        FUNCTION USAGE STRATEGY:
        - For product searches: ALWAYS use search_products function with extracted parameters
        - For specific product questions (after seeing a list): Use get_product_details

        PRICE EXTRACTION RULES (CRITICAL):
        - "dưới 15 triệu" / "under 15 triệu" → maxPrice: 15000000 (no minPrice)
        - "trên 20 triệu" / "over 20 triệu" → minPrice: 20000000 (no maxPrice)
        - "từ 20-25 triệu" / "20-25 triệu" → minPrice: 20000000, maxPrice: 25000000 (BOTH required)
        - "khoảng 30 triệu" / "around 30 triệu" → minPrice: 28000000, maxPrice: 32000000 (±2 million range)
        - "30 đến 35 triệu" / "30-35 triệu" → minPrice: 30000000, maxPrice: 35000000 (BOTH required)
        - IMPORTANT: For range queries (từ X đến Y, X-Y), you MUST set BOTH minPrice AND maxPrice
        - Convert millions: 1 triệu = 1,000,000 VNĐ, so 30 triệu = 30000000

        RESPONSE GUIDELINES:
        - Be concise but friendly
        - Always use Vietnamese language
        - When the search_products function returns product data, you MUST include that data EXACTLY as provided
        - DO NOT reformat, rephrase, or recreate the product list - copy it DIRECTLY from the function result
        - DO NOT change product names, prices, or links in any way
        - The function result includes properly formatted product information with real purchase links - use it AS IS
        - You can add a brief introduction before the product list, then paste the function result directly
        - If user request is unclear, ask 1-2 specific clarifying questions
        - After presenting products, offer to provide more details if needed

        EXAMPLE QUERIES AND RESPONSES:

        === LAPTOP EXAMPLES ===
        User: "Tìm laptop gaming dưới 15 triệu"
        → Use search_products with: category="laptop", keywords="gaming", maxPrice=15000000, limit=3
        → Present exactly 3 products with purchase links

        User: "Tôi muốn mua laptop cho sinh viên"
        → Use search_products with: category="laptop", keywords="sinh viên học tập", maxPrice=20000000, limit=3
        → Present exactly 3 suitable laptops with purchase links

        === ĐIỆN THOẠI EXAMPLES ===
        User: "Điện thoại có camera tốt cho chụp ảnh, pin trâu, dưới 10 triệu"
        → Use search_products with: category="smartphone", keywords="camera pin", maxPrice=10000000, limit=3
        → Present exactly 3 phones with purchase links

        User: "Tìm điện thoại Samsung dưới 8 triệu"
        → Use search_products with: category="smartphone", brand="Samsung", maxPrice=8000000, limit=3
        → Present exactly 3 Samsung phones with purchase links

        User: "Điện thoại chơi game mượt, tầm 15 triệu"
        → Use search_products with: category="smartphone", keywords="gaming", minPrice=13000000, maxPrice=17000000, limit=3
        → Present exactly 3 gaming phones with purchase links

        User: "iPhone mới nhất"
        → Use search_products with: category="smartphone", brand="Apple", keywords="iPhone", limit=3
        → Present exactly 3 iPhones with purchase links

        User: "Điện thoại Xiaomi pin khỏe dưới 5 triệu"
        → Use search_products with: category="smartphone", brand="Xiaomi", keywords="pin", maxPrice=5000000, limit=3
        → Present exactly 3 Xiaomi phones with purchase links

        User: "Điện thoại màn hình AMOLED 120Hz"
        → Use search_products with: category="smartphone", keywords="AMOLED 120Hz", limit=3
        → Present exactly 3 phones with AMOLED 120Hz display

        User: "Điện thoại 5G giá rẻ"
        → Use search_products with: category="smartphone", keywords="5G", maxPrice=10000000, limit=3
        → Present exactly 3 affordable 5G phones

        === PRODUCT DETAILS ===
        User: "Cho tôi xem chi tiết sản phẩm số 3"
        → Use get_product_details with the ID from previous search

        CRITICAL RULES FOR PRODUCT PRESENTATION:
        1. When search_products function returns data, it provides a complete formatted product list
        2. This list includes product names, prices, and markdown links "[Xem tại đây](url)"
        3. YOU MUST COPY THE PRODUCT LIST EXACTLY AS PROVIDED by the function
        4. DO NOT change the link format - keep it as "[Xem tại đây](url)"
        5. DO NOT reformat or restructure the product list
        6. You may add a brief greeting/intro, then include the function result AS IS

        EXAMPLE OF CORRECT BEHAVIOR:
        Function returns: "1. **iPhone 15 128GB**\n   - Giá: 14.990.000 VNĐ\n   - [Xem tại đây](http://localhost:3000/products/iphone-15-128gb-681)"
        Your response: "Dựa trên yêu cầu của bạn, đây là sản phẩm phù hợp:\n\n1. **iPhone 15 128GB**\n   - Giá: 14.990.000 VNĐ\n   - [Xem tại đây](http://localhost:3000/products/iphone-15-128gb-681)"

        WRONG BEHAVIOR (DO NOT DO THIS):
        - Changing "[Xem tại đây](url)" to "Link mua hàng: url"
        - Removing the markdown link format
        - Reformatting into different structure
        - Making up product information not in the function result
        """;

    /**
     * Process user message and generate response
     */
    @Transactional
    public ChatMessageResponse processMessage(String sessionId, String userMessage, String userId) {
        log.info("Processing message for user: {}, session: {}", userId, sessionId);

        // 1. Check rate limit
        if (!rateLimitService.checkAndIncrementRateLimit(userId)) {
            throw new RuntimeException("Rate limit exceeded. Please try again later.");
        }

        // 2. Check cache - only for static queries (FAQ, policies), not product searches
        if (cacheService.isStaticQuery(userMessage)) {
            var cachedResponse = cacheService.getCachedResponse(userMessage);
            if (cachedResponse.isPresent()) {
                log.info("Using cached response for static query");
                ConversationEntity conversation = getOrCreateConversation(sessionId, userId, userMessage);
                MessageEntity assistantMessage = saveMessagesToConversation(conversation, userMessage, cachedResponse.get().getResponseText());

                return ChatMessageResponse.builder()
                        .sessionId(conversation.getSessionId())
                        .message(conversationService.convertToMessageResponseDto(assistantMessage))
                        .build();
            }
        }

        // 3. Get or create conversation
        ConversationEntity conversation = getOrCreateConversation(sessionId, userId, userMessage);

        // 4. Save user message
        conversationService.addMessage(
                conversation,
                MessageEntity.MessageRole.USER,
                userMessage,
                null
        );

        // 5. Get conversation history for context
        List<MessageEntity> recentMessages = conversationService.getLatestMessages(
                conversation.getId(), 4
        );

        List<Map<String, String>> conversationHistory = recentMessages.stream()
                .map(msg -> {
                    Map<String, String> m = new HashMap<>();
                    m.put("role", msg.getRole().name());
                    m.put("content", msg.getContent());
                    return m;
                })
                .collect(Collectors.toList());

        // 6. Generate AI response with function calling
        GeminiService.GeminiResponse geminiResponse = geminiService.generateResponse(
                SYSTEM_PROMPT,
                userMessage,
                conversationHistory
        );

        // 7. Save assistant message with extracted product IDs
        MessageEntity assistantMessage = conversationService.addMessage(
                conversation,
                MessageEntity.MessageRole.ASSISTANT,
                geminiResponse.getText(),
                geminiResponse.getProductIds()
        );

        // 8. Cache response only for static queries (FAQ, policies)
        if (cacheService.isStaticQuery(userMessage)) {
            cacheService.cacheResponse(userMessage, geminiResponse.getText(), geminiResponse.getProductIds(), true);
        }

        // 9. Return response
        return ChatMessageResponse.builder()
                .sessionId(conversation.getSessionId())
                .message(conversationService.convertToMessageResponseDto(assistantMessage))
                .build();
    }

    private ConversationEntity getOrCreateConversation(String sessionId, String userId, String firstMessage) {
        if (sessionId == null || sessionId.isBlank()) {
            // Create new conversation
            return conversationService.createConversation(userId, firstMessage);
        } else {
            // Get existing conversation
            return conversationService.getConversationBySessionId(sessionId);
        }
    }

    private MessageEntity saveMessagesToConversation(ConversationEntity conversation,
                                            String userMessage,
                                            String assistantResponse) {
        conversationService.addMessage(
                conversation,
                MessageEntity.MessageRole.USER,
                userMessage,
                null
        );

        return conversationService.addMessage(
                conversation,
                MessageEntity.MessageRole.ASSISTANT,
                assistantResponse,
                new ArrayList<>()
        );
    }
}
