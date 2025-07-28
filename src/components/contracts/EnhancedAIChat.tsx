'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, Send, Bot, User, AlertCircle, 
  CheckCircle, ExternalLink, Loader, Shield,
  BookOpen, Scale, Info, X
} from 'lucide-react';
import { LegalReference } from '@/lib/legal/knowledge-base';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  references?: LegalReference[];
  confidence?: number;
}

interface EnhancedAIChatProps {
  contractId: string;
  onClose?: () => void;
  isEmbedded?: boolean;
  contractTitle?: string;
}

export default function EnhancedAIChat({ contractId, onClose, isEmbedded = false, contractTitle }: EnhancedAIChatProps) {
  const getInitialMessage = (): ChatMessage => {
    if (isEmbedded && contractTitle) {
      return {
        id: '1',
        type: 'assistant',
        content: `こんにちは！「${contractTitle}」に特化した法務AIアシスタントです。\n\nこの契約書に関する専門的なご質問にお答えします：\n• 契約条項の詳細な解釈\n• 法的リスクの評価\n• 関連法令との整合性\n• 改善提案やベストプラクティス\n\n法的根拠に基づいた確実な回答を提供いたします。どのような点についてお聞きになりたいですか？`,
        timestamp: new Date(),
        confidence: 1.0
      };
    }
    return {
      id: '1',
      type: 'assistant',
      content: 'こんにちは！法務特化型AIアシスタントです。この契約書に関するご質問にお答えします。法的根拠に基づいた正確な情報を提供いたします。',
      timestamp: new Date(),
      confidence: 1.0
    };
  };

  const [messages, setMessages] = useState<ChatMessage[]>([getInitialMessage()]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/legal-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractId,
          message: inputMessage,
          conversationHistory: messages.slice(-10), // 最新10件の履歴を送信\n          isContractSpecific: isEmbedded // 埋め込みモードの場合は契約特化モード
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'チャットの処理に失敗しました');
      }

      const data = await response.json();
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.response,
        timestamp: new Date(),
        references: data.references || [],
        confidence: data.confidence || 0
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
      
      // エラー時のフォールバック応答
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: '申し訳ございませんが、回答の生成中にエラーが発生しました。重要な法的事項については、専門家にご相談いただくことをお勧めします。',
        timestamp: new Date(),
        confidence: 0
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

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
    <div className={`flex flex-col h-full ${isEmbedded ? 'bg-white' : 'bg-white border rounded-lg shadow-sm'}`}>
      {/* Header */}
      {!isEmbedded && (
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">法務AIアシスタント</h3>
              <p className="text-xs text-gray-600">法的根拠に基づく専門回答</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
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
                    {message.references.slice(0, 3).map((ref, index) => (
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

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="契約書について質問してください..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
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
    </div>
  );
}