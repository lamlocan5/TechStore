"use client";

import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChatStore } from "@/lib/store/chat.store";
import { cn } from "@/lib/utils";

export default function ChatButton() {
  const { isOpen, toggleChat } = useChatStore();

  return (
    <Button
      onClick={toggleChat}
      className={cn(
        "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg",
        "transition-all duration-300 hover:scale-110",
        "bg-primary hover:bg-primary/90",
        isOpen && "scale-0 opacity-0"
      )}
      size="icon"
      aria-label="Open chat"
    >
      <MessageCircle className="h-6 w-6" />
    </Button>
  );
}
