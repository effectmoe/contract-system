'use client';

import { useRef, useEffect } from 'react';
import { AlertCircle, Bot, Loader } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import ChatMessage from './ChatMessage';
import ChatHeader from './ChatHeader';
import ChatInput from './ChatInput';

interface EnhancedAIChatProps {
  contractId: string;
  onClose?: () => void;
  isEmbedded?: boolean;
  contractTitle?: string;
}

export default function EnhancedAIChat({ contractId, onClose, isEmbedded = false, contractTitle }: EnhancedAIChatProps) {
  const { 
    messages, 
    inputMessage, 
    isLoading, 
    error, 
    setInputMessage, 
    sendMessage,
    clearError 
  } = useChat({ contractId, isEmbedded });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 初回メッセージの追加
  useEffect(() => {
    const initialMessage = getInitialMessage(isEmbedded, contractTitle);
    if (messages.length === 0) {
      messages.push(initialMessage);
    }
  }, []);
  const inputRef = useRef<HTMLInputElement>(null);

  // スクロール処理
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className={`flex flex-col h-full ${isEmbedded ? 'bg-white' : 'bg-white border rounded-lg shadow-sm'}`}>
      <ChatHeader onClose={onClose} isEmbedded={isEmbedded} />

      {/* Error Display */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
            <button
              onClick={clearError}
              className="text-red-700 hover:text-red-900 text-sm"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-gray-50 border rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Loader className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-sm text-gray-600">回答を生成中...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <ChatInput
        inputMessage={inputMessage}
        isLoading={isLoading}
        isEmbedded={isEmbedded}
        onInputChange={setInputMessage}
        onSend={sendMessage}
      />
    </div>
  );
}

/**
 * 初回メッセージを生成
 */
function getInitialMessage(isEmbedded?: boolean, contractTitle?: string) {
  if (isEmbedded && contractTitle) {
    return {
      id: '1',
      type: 'assistant' as const,
      content: `こんにちは！「${contractTitle}」に特化した法務AIアシスタントです。\n\nこの契約書に関する専門的なご質問にお答えします：\n• 契約条項の詳細な解釈\n• 法的リスクの評価\n• 関連法令との整合性\n• 改善提案やベストプラクティス\n\n法的根拠に基づいた確実な回答を提供いたします。どのような点についてお聞きになりたいですか？`,
      timestamp: new Date(),
      confidence: 1.0
    };
  }
  return {
    id: '1',
    type: 'assistant' as const,
    content: 'こんにちは！法務特化型AIアシスタントです。この契約書に関するご質問にお答えします。法的根拠に基づいた正確な情報を提供いたします。',
    timestamp: new Date(),
    confidence: 1.0
  };
}