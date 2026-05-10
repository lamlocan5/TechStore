"use client";

import { X, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChatStore } from "@/lib/store/chat.store";

export default function ChatHeader() {
  const { closeChat, startNewConversation, currentSessionId } = useChatStore();

  return (
    <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground">
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
        <h3 className="font-semibold">Trợ lý AI</h3>
      </div>
      <div className="flex gap-1">
        {currentSessionId && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={startNewConversation}
            title="Cuộc trò chuyện mới"
          >
            <PlusCircle className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
          onClick={closeChat}
          title="Đóng"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
