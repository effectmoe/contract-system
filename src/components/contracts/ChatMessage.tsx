'use client';

import { Bot, User, CheckCircle, AlertCircle, Info, ExternalLink, BookOpen } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '@/hooks/useChat';
import { LegalReference } from '@/lib/legal/types';

interface ChatMessageProps {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const getConfidenceColor = (confidence?: number): string => {
    if (!confidence) return 'text-gray-500';
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceIcon = (confidence?: number) => {
    if (!confidence) return <AlertCircle className="w-4 h-4" />;
    if (confidence >= 0.8) return <CheckCircle className="w-4 h-4" />;
    if (confidence >= 0.6) return <Info className="w-4 h-4" />;
    return <AlertCircle className="w-4 h-4" />;
  };

  return (
    <div
      className={`flex gap-3 ${
        message.type === 'user' ? 'justify-end' : 'justify-start'
      }`}
    >
      {message.type === 'assistant' && (
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}
      
      <div
        className={`max-w-[80%] rounded-lg p-3 ${
          message.type === 'user'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-50 text-gray-900 border'
        }`}
      >
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {message.content}
        </div>
        
        {/* 法的参照情報 */}
        {message.references && message.references.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-gray-700">法的根拠</span>
            </div>
            <div className="space-y-2">
              {(message.references as LegalReference[]).slice(0, 3).map((ref, index) => (
                <div key={index} className="bg-blue-50 p-2 rounded text-xs">
                  <div className="font-medium text-blue-900">{ref.title}</div>
                  <div className="text-blue-700 mt-1">{ref.content.substring(0, 100)}...</div>
                  {ref.url && (
                    <a
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 mt-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>詳細を確認</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 信頼度表示 */}
        {message.type === 'assistant' && message.confidence !== undefined && (
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1 ${getConfidenceColor(message.confidence)}`}>
                {getConfidenceIcon(message.confidence)}
                <span className="text-xs font-medium">
                  信頼度: {Math.round(message.confidence * 100)}%
                </span>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              {message.timestamp.toLocaleTimeString('ja-JP', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        )}
      </div>

      {message.type === 'user' && (
        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-white" />
        </div>
      )}
    </div>
  );
}