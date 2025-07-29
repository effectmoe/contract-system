'use client';

import { Send, Shield } from 'lucide-react';

interface ChatInputProps {
  inputMessage: string;
  isLoading: boolean;
  isEmbedded?: boolean;
  onInputChange: (value: string) => void;
  onSend: () => void;
}

export default function ChatInput({
  inputMessage,
  isLoading,
  isEmbedded = false,
  onInputChange,
  onSend
}: ChatInputProps) {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="border-t p-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="契約書について質問してください..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isLoading}
        />
        <button
          onClick={onSend}
          disabled={!inputMessage.trim() || isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          送信
        </button>
      </div>
      
      {/* Disclaimer */}
      {!isEmbedded && (
        <div className="mt-2 flex items-start gap-2">
          <Shield className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-gray-600 leading-relaxed">
            このAIアシスタントは法的情報を提供しますが、正式な法的アドバイスではありません。
            重要な決定については必ず法律専門家にご相談ください。
          </p>
        </div>
      )}
    </div>
  );
}