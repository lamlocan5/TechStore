import { create } from "zustand";
import { persist } from "zustand/middleware";
import * as chatService from "@/lib/api/chatbot.service";
import type { ChatMessage, Conversation } from "@/types";
import { toast } from "sonner";

interface ChatState {
  // UI State
  isOpen: boolean;
  isLoading: boolean;
  isTyping: boolean;

  // Current conversation
  currentSessionId: string | null;
  messages: ChatMessage[];

  // Conversation history
  conversations: Conversation[];
  conversationsLoaded: boolean;

  // Actions - UI
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;

  // Actions - Messaging
  sendMessage: (content: string) => Promise<void>;
  loadConversation: (sessionId: string) => Promise<void>;
  startNewConversation: () => void;

  // Actions - Conversation Management
  fetchConversations: () => Promise<void>;
  deleteConversation: (sessionId: string) => Promise<void>;
  archiveConversation: (sessionId: string) => Promise<void>;

  // Clear state
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      // Initial state
      isOpen: false,
      isLoading: false,
      isTyping: false,
      currentSessionId: null,
      messages: [],
      conversations: [],
      conversationsLoaded: false,

      // UI Actions
      openChat: () => set({ isOpen: true }),
      closeChat: () => set({ isOpen: false }),
      toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),

      // Messaging Actions
      sendMessage: async (content: string) => {
        const { currentSessionId, messages } = get();

        // Validate input
        if (!content.trim()) {
          toast.error("Vui lòng nhập nội dung tin nhắn");
          return;
        }

        if (content.length > 2000) {
          toast.error("Tin nhắn không được vượt quá 2000 ký tự");
          return;
        }

        // Create optimistic user message
        const optimisticUserMessage: ChatMessage = {
          id: Date.now(), // Temporary ID
          role: "USER",
          content,
          createdAt: new Date().toISOString(),
        };

        // Update UI immediately
        set({
          messages: [...messages, optimisticUserMessage],
          isLoading: true,
          isTyping: true,
        });

        try {
          // Call API
          const response = await chatService.sendMessage({
            sessionId: currentSessionId,
            content,
          });

          // Debug: Log the response structure
          console.log("Chat API Response:", response);

          // Validate response
          if (!response || !response.message) {
            console.error("Invalid response structure:", response);
            throw new Error("Invalid response from server");
          }

          // Update with real response
          set((state) => ({
            messages: [
              ...state.messages.filter(
                (m) => m.id !== optimisticUserMessage.id
              ),
              {
                ...optimisticUserMessage,
                id: state.messages.length * 2, // Proper ID from response
              },
              response.message,
            ],
            currentSessionId: response.sessionId,
            isLoading: false,
            isTyping: false,
          }));

          // Refresh conversations list if needed
          if (!currentSessionId) {
            get().fetchConversations();
          }
        } catch (error: any) {
          // Remove optimistic message on error
          set((state) => ({
            messages: state.messages.filter(
              (m) => m.id !== optimisticUserMessage.id
            ),
            isLoading: false,
            isTyping: false,
          }));

          const errorMessage =
            error.response?.data?.message ||
            error.message ||
            "Không thể gửi tin nhắn. Vui lòng thử lại.";
          toast.error(errorMessage);

          console.error("Error sending message:", error);
        }
      },

      loadConversation: async (sessionId: string) => {
        try {
          set({ isLoading: true });

          const conversation = await chatService.getConversation(sessionId);

          set({
            currentSessionId: sessionId,
            messages: conversation.messages,
            isLoading: false,
            isOpen: true, // Open chat when loading conversation
          });
        } catch (error: any) {
          set({ isLoading: false });

          const errorMessage =
            error.response?.data?.message ||
            "Không thể tải cuộc trò chuyện";
          toast.error(errorMessage);

          console.error("Error loading conversation:", error);
        }
      },

      startNewConversation: () => {
        set({
          currentSessionId: null,
          messages: [],
        });
      },

      // Conversation Management
      fetchConversations: async () => {
        try {
          const response = await chatService.getConversations({
            page: 1,
            limit: 50,
          });

          set({
            conversations: response.result || [],
            conversationsLoaded: true,
          });
        } catch (error: any) {
          console.error("Error fetching conversations:", error);

          // Don't show toast error for background fetch
          set({ conversationsLoaded: true });
        }
      },

      deleteConversation: async (sessionId: string) => {
        try {
          await chatService.deleteConversation(sessionId);

          // Remove from local state
          set((state) => ({
            conversations: state.conversations.filter(
              (c) => c.sessionId !== sessionId
            ),
          }));

          // If deleting current conversation, start new one
          if (get().currentSessionId === sessionId) {
            get().startNewConversation();
          }

          toast.success("Đã xóa cuộc trò chuyện");
        } catch (error: any) {
          const errorMessage =
            error.response?.data?.message || "Không thể xóa cuộc trò chuyện";
          toast.error(errorMessage);

          console.error("Error deleting conversation:", error);
        }
      },

      archiveConversation: async (sessionId: string) => {
        try {
          await chatService.archiveConversation(sessionId);

          // Update local state
          set((state) => ({
            conversations: state.conversations.map((c) =>
              c.sessionId === sessionId ? { ...c, status: "ARCHIVED" } : c
            ),
          }));

          toast.success("Đã lưu trữ cuộc trò chuyện");
        } catch (error: any) {
          const errorMessage =
            error.response?.data?.message ||
            "Không thể lưu trữ cuộc trò chuyện";
          toast.error(errorMessage);

          console.error("Error archiving conversation:", error);
        }
      },

      clearMessages: () => {
        set({
          messages: [],
          currentSessionId: null,
        });
      },
    }),
    {
      name: "chat-storage",
      partialize: (state) => ({
        currentSessionId: state.currentSessionId,
        messages: state.messages,
        // Don't persist UI state or conversations list
      }),
    }
  )
);
