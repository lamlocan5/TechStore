"use client";

import { Bot, Sparkles } from "lucide-react";
import { useChatStore } from "@/lib/store/chat.store";

const SUGGESTED_QUESTIONS = [
  "Tìm laptop gaming cho tôi",
  "Smartphone tốt nhất trong tầm giá 15 triệu",
  "Điện thoại chụp ảnh đẹp dưới 10 triệu",
  "Laptop để làm việc văn phòng",
];

export default function ChatWelcome() {
  const { sendMessage } = useChatStore();

  return (
    <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Bot className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Xin chào!</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6 max-w-sm">
        Tôi là trợ lý AI. Tôi có thể giúp bạn tìm kiếm và tư vấn sản phẩm.
      </p>

      <div className="w-full max-w-sm space-y-2">
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
          <Sparkles className="h-3 w-3" />
          <span>Câu hỏi gợi ý:</span>
        </div>
        {SUGGESTED_QUESTIONS.map((question, index) => (
          <button
            key={index}
            onClick={() => sendMessage(question)}
            className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}
