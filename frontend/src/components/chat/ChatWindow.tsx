"use client";

import { useEffect, useRef } from "react";
import { useChatStore } from "@/lib/store/chat.store";
import { cn } from "@/lib/utils";
import ChatHeader from "./ChatHeader";
import ChatMessageList from "./ChatMessageList";
import ChatInput from "./ChatInput";

export default function ChatWindow() {
  const { isOpen } = useChatStore();
  const windowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && windowRef.current) {
      windowRef.current.focus();
    }
  }, [isOpen]);

  return (
    <div
      ref={windowRef}
      className={cn(
        "fixed bottom-6 right-6 z-50",
        "w-[400px] h-[600px] max-h-[80vh]",
        "bg-white dark:bg-gray-900 rounded-lg shadow-2xl",
        "flex flex-col overflow-hidden",
        "border border-gray-200 dark:border-gray-800",
        "transition-all duration-300",
        isOpen
          ? "opacity-100 scale-100 translate-y-0"
          : "opacity-0 scale-95 translate-y-4 pointer-events-none"
      )}
    >
      <ChatHeader />
      <ChatMessageList />
      <ChatInput />
    </div>
  );
}
