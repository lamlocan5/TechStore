"use client";

import { useEffect } from "react";
import { useChatStore } from "@/lib/store/chat.store";
import { useAuthStore } from "@/lib/store/auth.store";
import ChatButton from "./ChatButton";
import ChatWindow from "./ChatWindow";

export default function ChatWidget() {
  const { isAuthenticated } = useAuthStore();
  const { isOpen, fetchConversations, conversationsLoaded } = useChatStore();

  // Fetch conversations on mount if authenticated
  useEffect(() => {
    if (isAuthenticated && !conversationsLoaded) {
      fetchConversations();
    }
  }, [isAuthenticated, conversationsLoaded, fetchConversations]);

  // Only show for authenticated users
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <ChatButton />
      {isOpen && <ChatWindow />}
    </>
  );
}
