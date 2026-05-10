package com.example.chatbot_service.service;

import com.example.chatbot_service.configuration.GeminiConfig;
import com.example.chatbot_service.util.FunctionDefinitions;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class GeminiService {

    private final GeminiConfig geminiConfig;
    private final ProductSearchService productSearchService;
    private final Gson gson = new Gson();
    private final WebClient webClient = WebClient.builder().build();

    private static final int MAX_RETRIES = 3;
    private static final int RETRY_DELAY_MS = 1000;
    private static final int MAX_FUNCTION_CALL_ITERATIONS = 5; // Prevent infinite loops

    /**
     * Generate response from Gemini API with function calling support
     *
     * @param systemPrompt        System instructions
     * @param userMessage         Current user message
     * @param conversationHistory Previous messages for context
     * @return AI response text with product IDs
     */
    public GeminiResponse generateResponse(
            String systemPrompt,
            String userMessage,
            List<Map<String, String>> conversationHistory
    ) {
        try {
            log.info("Calling Gemini API for message: {}", truncate(userMessage, 100));

            // Build conversation contents
            JsonArray contents = buildConversationContents(systemPrompt, userMessage, conversationHistory);

            // Execute function call loop (max 5 iterations to prevent infinite loops)
            int iteration = 0;
            String finalResponse = null;
            List<Long> productIds = new ArrayList<>();

            while (iteration < MAX_FUNCTION_CALL_ITERATIONS) {
                iteration++;
                log.info("Gemini API iteration: {}", iteration);

                // Build request payload
                JsonObject requestBody = buildRequestPayload(contents);

                // Call Gemini API
                String responseJson = callGeminiApi(requestBody);

                // Parse response
                ParsedResponse parsed = parseGeminiResponse(responseJson);

                // If we have a text response, we're done
                if (parsed.hasText() && !parsed.hasFunctionCalls()) {
                    finalResponse = parsed.getText();
                    break;
                }

                // If we have function calls, execute them
                if (parsed.hasFunctionCalls()) {
                    log.info("Executing {} function call(s)", parsed.getFunctionCalls().size());

                    // Add model's function call request to contents
                    contents.add(createModelMessage(parsed.getParts()));

                    // Execute all function calls and add results to contents
                    for (FunctionCallRequest fcr : parsed.getFunctionCalls()) {
                        String functionResult = executeFunctionCall(fcr);

                        // Track product IDs from function calls
                        if ("get_product_details".equals(fcr.getName()) && fcr.getArgs().containsKey("productId")) {
                            try {
                                Long productId = ((Number) fcr.getArgs().get("productId")).longValue();
                                if (!productIds.contains(productId)) {
                                    productIds.add(productId);
                                }
                            } catch (Exception e) {
                                log.warn("Failed to extract product ID", e);
                            }
                        }

                        // Add function response to contents
                        contents.add(createFunctionResponseMessage(fcr.getName(), functionResult));
                    }

                    // Continue loop to get final response from Gemini
                    continue;
                }

                // If neither text nor function calls, something went wrong
                if (!parsed.hasText()) {
                    finalResponse = "Xin lỗi, tôi không thể tạo phản hồi. Vui lòng thử lại.";
                    break;
                }
            }

            if (finalResponse == null) {
                finalResponse = "Xin lỗi, đã có lỗi xảy ra khi xử lý yêu cầu. Vui lòng thử lại.";
            }

            log.info("Gemini API completed after {} iteration(s), response length: {}", iteration, finalResponse.length());

            return new GeminiResponse(finalResponse, productIds);

        } catch (WebClientResponseException e) {
            log.error("Gemini API error: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            return new GeminiResponse(handleApiError(e), new ArrayList<>());
        } catch (Exception e) {
            log.error("Error calling Gemini API", e);
            return new GeminiResponse("Xin lỗi, đã có lỗi xảy ra khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.", new ArrayList<>());
        }
    }

    /**
     * Build conversation contents array
     */
    private JsonArray buildConversationContents(
            String systemPrompt,
            String userMessage,
            List<Map<String, String>> conversationHistory
    ) {
        JsonArray contents = new JsonArray();

        // Add system instruction as first user message
        JsonObject systemMessage = new JsonObject();
        systemMessage.addProperty("role", "user");
        JsonArray systemParts = new JsonArray();
        JsonObject systemPart = new JsonObject();
        systemPart.addProperty("text", systemPrompt);
        systemParts.add(systemPart);
        systemMessage.add("parts", systemParts);
        contents.add(systemMessage);

        // Add conversation history (last 4 messages for context)
        if (conversationHistory != null && !conversationHistory.isEmpty()) {
            int startIndex = Math.max(0, conversationHistory.size() - 4);
            for (int i = startIndex; i < conversationHistory.size(); i++) {
                Map<String, String> msg = conversationHistory.get(i);
                JsonObject historyMsg = new JsonObject();

                // Map roles: USER -> user, ASSISTANT -> model
                String role = msg.get("role");
                historyMsg.addProperty("role",
                        "USER".equals(role) ? "user" : "model");

                JsonArray parts = new JsonArray();
                JsonObject part = new JsonObject();
                part.addProperty("text", msg.get("content"));
                parts.add(part);
                historyMsg.add("parts", parts);

                contents.add(historyMsg);
            }
        }

        // Add current user message
        JsonObject currentMessage = new JsonObject();
        currentMessage.addProperty("role", "user");
        JsonArray currentParts = new JsonArray();
        JsonObject currentPart = new JsonObject();
        currentPart.addProperty("text", userMessage);
        currentParts.add(currentPart);
        currentMessage.add("parts", currentParts);
        contents.add(currentMessage);

        return contents;
    }

    /**
     * Build Gemini API request payload from contents
     */
    private JsonObject buildRequestPayload(JsonArray contents) {
        JsonObject payload = new JsonObject();

        payload.add("contents", contents);

        // Add function declarations (tools)
        JsonArray tools = new JsonArray();
        JsonObject toolsObject = new JsonObject();
        JsonArray functionDeclarations = FunctionDefinitions.getAllFunctions();
        toolsObject.add("function_declarations", functionDeclarations);
        tools.add(toolsObject);
        payload.add("tools", tools);

        // Generation config
        JsonObject generationConfig = new JsonObject();
        generationConfig.addProperty("temperature", geminiConfig.getTemperature());
        generationConfig.addProperty("maxOutputTokens", geminiConfig.getMaxTokens());
        generationConfig.addProperty("topP", 0.95);
        generationConfig.addProperty("topK", 40);
        payload.add("generationConfig", generationConfig);

        // Safety settings (permissive for e-commerce)
        JsonArray safetySettings = new JsonArray();
        addSafetySetting(safetySettings, "HARM_CATEGORY_HARASSMENT", "BLOCK_NONE");
        addSafetySetting(safetySettings, "HARM_CATEGORY_HATE_SPEECH", "BLOCK_NONE");
        addSafetySetting(safetySettings, "HARM_CATEGORY_SEXUALLY_EXPLICIT", "BLOCK_NONE");
        addSafetySetting(safetySettings, "HARM_CATEGORY_DANGEROUS_CONTENT", "BLOCK_NONE");
        payload.add("safetySettings", safetySettings);

        return payload;
    }

    /**
     * Call Gemini API with retry logic
     */
    private String callGeminiApi(JsonObject requestBody) {
        String url = geminiConfig.getGenerateContentUrl();

        return webClient.post()
                .uri(url)
                .header("Content-Type", "application/json")
                .bodyValue(requestBody.toString())
                .retrieve()
                .bodyToMono(String.class)
                .retryWhen(Retry.fixedDelay(MAX_RETRIES, Duration.ofMillis(RETRY_DELAY_MS))
                        .filter(throwable -> throwable instanceof WebClientResponseException.TooManyRequests)
                        .doBeforeRetry(retrySignal -> log.warn("Retrying Gemini API call, attempt: {}",
                                retrySignal.totalRetries() + 1)))
                .timeout(Duration.ofSeconds(30))
                .onErrorResume(WebClientResponseException.class, e -> {
                    log.error("Gemini API error: {}", e.getResponseBodyAsString());
                    return Mono.error(e);
                })
                .block();
    }

    /**
     * Execute a function call and return the result
     */
    private String executeFunctionCall(FunctionCallRequest fcr) {
        try {
            log.info("Executing function: {} with args: {}", fcr.getName(), fcr.getArgs());

            switch (fcr.getName()) {
                case "search_products":
                    return productSearchService.searchProducts(fcr.getArgs());

                case "get_product_details":
                    Long productId = ((Number) fcr.getArgs().get("productId")).longValue();
                    boolean includeVariants = fcr.getArgs().containsKey("includeVariants")
                            && (Boolean) fcr.getArgs().get("includeVariants");
                    return productSearchService.getProductDetails(productId, includeVariants);

                case "compare_products":
                    Object productIdsObj = fcr.getArgs().get("productIds");
                    List<Long> productIds = new ArrayList<>();

                    if (productIdsObj instanceof List) {
                        List<?> list = (List<?>) productIdsObj;
                        for (Object id : list) {
                            productIds.add(((Number) id).longValue());
                        }
                    }

                    return productSearchService.compareProducts(productIds);

                default:
                    log.warn("Unknown function call: {}", fcr.getName());
                    return "Chức năng không được hỗ trợ: " + fcr.getName();
            }

        } catch (Exception e) {
            log.error("Error executing function: " + fcr.getName(), e);
            return "Lỗi khi thực hiện chức năng: " + e.getMessage();
        }
    }

    /**
     * Create a model message from parts
     */
    private JsonObject createModelMessage(JsonArray parts) {
        JsonObject message = new JsonObject();
        message.addProperty("role", "model");
        message.add("parts", parts);
        return message;
    }

    /**
     * Create a function response message
     */
    private JsonObject createFunctionResponseMessage(String functionName, String result) {
        JsonObject message = new JsonObject();
        message.addProperty("role", "user");

        JsonArray parts = new JsonArray();
        JsonObject part = new JsonObject();

        JsonObject functionResponse = new JsonObject();
        functionResponse.addProperty("name", functionName);

        JsonObject response = new JsonObject();
        response.addProperty("result", result);
        functionResponse.add("response", response);

        part.add("functionResponse", functionResponse);
        parts.add(part);

        message.add("parts", parts);
        return message;
    }

    /**
     * Parse Gemini API response and extract text and function calls
     */
    private ParsedResponse parseGeminiResponse(String responseJson) {
        try {
            JsonObject response = JsonParser.parseString(responseJson).getAsJsonObject();

            if (!response.has("candidates") || response.getAsJsonArray("candidates").isEmpty()) {
                log.warn("No candidates in Gemini response");
                log.debug("Full response: {}", responseJson);
                return new ParsedResponse("Xin lỗi, tôi không thể tạo phản hồi. Vui lòng thử lại.", new ArrayList<>(), new JsonArray());
            }

            JsonObject candidate = response.getAsJsonArray("candidates").get(0).getAsJsonObject();

            // Check for finish reason (safety filters, etc.)
            if (candidate.has("finishReason")) {
                String finishReason = candidate.get("finishReason").getAsString();
                if (!"STOP".equals(finishReason)) {
                    log.warn("Gemini finished with reason: {}", finishReason);
                    log.debug("Full candidate: {}", candidate);
                }
            }

            if (!candidate.has("content")) {
                log.warn("No content in Gemini candidate");
                log.debug("Full candidate: {}", candidate);
                return new ParsedResponse("Xin lỗi, tôi không thể tạo phản hồi. Vui lòng thử lại.", new ArrayList<>(), new JsonArray());
            }

            JsonObject content = candidate.getAsJsonObject("content");

            if (!content.has("parts")) {
                log.warn("No parts in Gemini content");
                return new ParsedResponse("Xin lỗi, tôi không thể tạo phản hồi. Vui lòng thử lại.", new ArrayList<>(), new JsonArray());
            }

            JsonArray parts = content.getAsJsonArray("parts");

            StringBuilder textResponse = new StringBuilder();
            List<FunctionCallRequest> functionCalls = new ArrayList<>();

            for (int i = 0; i < parts.size(); i++) {
                JsonObject part = parts.get(i).getAsJsonObject();

                // Check for text response
                if (part.has("text")) {
                    textResponse.append(part.get("text").getAsString());
                }

                // Check for function call
                if (part.has("functionCall")) {
                    JsonObject functionCall = part.getAsJsonObject("functionCall");
                    String functionName = functionCall.get("name").getAsString();
                    JsonObject argsJson = functionCall.has("args") ? functionCall.getAsJsonObject("args") : new JsonObject();

                    // Convert args to Map
                    Map<String, Object> args = gson.fromJson(argsJson, Map.class);

                    log.info("Gemini requested function call: {} with args: {}", functionName, args);
                    functionCalls.add(new FunctionCallRequest(functionName, args));
                }
            }

            return new ParsedResponse(textResponse.toString().trim(), functionCalls, parts);

        } catch (Exception e) {
            log.error("Error parsing Gemini response", e);
            return new ParsedResponse("Xin lỗi, đã có lỗi khi xử lý phản hồi. Vui lòng thử lại.", new ArrayList<>(), new JsonArray());
        }
    }

    /**
     * Handle API errors with user-friendly messages
     */
    private String handleApiError(WebClientResponseException e) {
        switch (e.getStatusCode().value()) {
            case 400:
                log.error("Invalid request to Gemini API");
                return "Xin lỗi, yêu cầu không hợp lệ. Vui lòng thử lại.";
            case 401:
            case 403:
                log.error("Authentication error with Gemini API - check API key");
                return "Lỗi xác thực API. Vui lòng liên hệ quản trị viên.";
            case 429:
                log.error("Rate limit exceeded for Gemini API");
                return "Hệ thống đang quá tải. Vui lòng thử lại sau ít phút.";
            case 500:
            case 503:
                log.error("Gemini API server error");
                return "Dịch vụ AI tạm thời không khả dụng. Vui lòng thử lại sau.";
            default:
                log.error("Unexpected Gemini API error: {}", e.getStatusCode());
                return "Đã có lỗi xảy ra. Vui lòng thử lại sau.";
        }
    }

    /**
     * Add safety setting to array
     */
    private void addSafetySetting(JsonArray settings, String category, String threshold) {
        JsonObject setting = new JsonObject();
        setting.addProperty("category", category);
        setting.addProperty("threshold", threshold);
        settings.add(setting);
    }

    /**
     * Truncate string for logging
     */
    private String truncate(String text, int maxLength) {
        if (text == null || text.length() <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength) + "...";
    }

    /**
     * Estimate token count (rough approximation: 1 token ≈ 4 characters)
     */
    public int estimateTokenCount(String text) {
        if (text == null) return 0;
        return (int) Math.ceil(text.length() / 4.0);
    }

    /**
     * Build conversation context string for logging/monitoring
     */
    public String buildConversationContext(List<Map<String, String>> messages) {
        if (messages == null || messages.isEmpty()) {
            return "";
        }

        StringBuilder context = new StringBuilder("\n\nConversation history:\n");
        for (Map<String, String> msg : messages) {
            String role = msg.get("role");
            String content = msg.get("content");
            context.append(role).append(": ").append(truncate(content, 100)).append("\n");
        }

        return context.toString();
    }

    // ========== Inner Classes ==========

    /**
     * Parsed response from Gemini API
     */
    private static class ParsedResponse {
        private final String text;
        private final List<FunctionCallRequest> functionCalls;
        private final JsonArray parts;

        public ParsedResponse(String text, List<FunctionCallRequest> functionCalls, JsonArray parts) {
            this.text = text;
            this.functionCalls = functionCalls;
            this.parts = parts;
        }

        public String getText() {
            return text;
        }

        public List<FunctionCallRequest> getFunctionCalls() {
            return functionCalls;
        }

        public JsonArray getParts() {
            return parts;
        }

        public boolean hasText() {
            return text != null && !text.isEmpty();
        }

        public boolean hasFunctionCalls() {
            return functionCalls != null && !functionCalls.isEmpty();
        }
    }

    /**
     * Function call request from Gemini
     */
    private static class FunctionCallRequest {
        private final String name;
        private final Map<String, Object> args;

        public FunctionCallRequest(String name, Map<String, Object> args) {
            this.name = name;
            this.args = args;
        }

        public String getName() {
            return name;
        }

        public Map<String, Object> getArgs() {
            return args;
        }
    }

    /**
     * Response from Gemini with extracted product IDs
     */
    public static class GeminiResponse {
        private final String text;
        private final List<Long> productIds;

        public GeminiResponse(String text, List<Long> productIds) {
            this.text = text;
            this.productIds = productIds != null ? productIds : new ArrayList<>();
        }

        public String getText() {
            return text;
        }

        public List<Long> getProductIds() {
            return productIds;
        }
    }
}
