import apiClient from "./client";
import type {
  ApiResponse,
  PaginatedResponse,
  ChatMessage,
  ChatMessageRequest,
  ChatMessageResponse,
  Conversation,
  ConversationListItem,
} from "@/types";

/**
 * Send a message to the chatbot and get AI response
 */
export async function sendMessage(
  data: ChatMessageRequest
): Promise<ChatMessageResponse> {
  const response = await apiClient.post<ApiResponse<ChatMessageResponse>>(
    "/chatbot/chat/message",
    data
  );
  return response.data.result;
}

/**
 * Get user's conversations with pagination
 */
export async function getConversations(params: {
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<Conversation>> {
  const { page = 1, limit = 20 } = params;

  const response = await apiClient.get<
    ApiResponse<PaginatedResponse<Conversation>>
  >("/chatbot/chat/conversations", {
    params: { page, limit },
  });

  return response.data.result;
}

/**
 * Get a specific conversation by session ID
 */
export async function getConversation(
  sessionId: string
): Promise<Conversation> {
  const response = await apiClient.get<ApiResponse<Conversation>>(
    `/chatbot/chat/conversations/${sessionId}`
  );

  return response.data.result;
}

/**
 * Delete a conversation
 */
export async function deleteConversation(sessionId: string): Promise<void> {
  await apiClient.delete(`/chatbot/chat/conversations/${sessionId}`);
}

/**
 * Archive a conversation
 */
export async function archiveConversation(sessionId: string): Promise<void> {
  await apiClient.post(`/chatbot/chat/conversations/${sessionId}/archive`);
}
