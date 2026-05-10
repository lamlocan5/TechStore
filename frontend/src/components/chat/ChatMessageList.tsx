"use client";

import { useEffect, useRef } from "react";
import { useChatStore } from "@/lib/store/chat.store";
import ChatMessage from "./ChatMessage";
import ChatTypingIndicator from "./ChatTypingIndicator";
import ChatWelcome from "./ChatWelcome";

export default function ChatMessageList() {
  const { messages, isTyping } = useChatStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  if (messages.length === 0) {
    return <ChatWelcome />;
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-950">
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}
      {isTyping && <ChatTypingIndicator />}
      <div ref={bottomRef} />
    </div>
  );
}
