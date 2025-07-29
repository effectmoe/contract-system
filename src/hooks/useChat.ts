import { useState, useCallback } from 'react';

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  references?: any[];
  confidence?: number;
}

interface UseChatProps {
  contractId: string;
  isEmbedded?: boolean;
}

interface UseChatReturn {
  messages: ChatMessage[];
  inputMessage: string;
  isLoading: boolean;
  error: string | null;
  setInputMessage: (message: string) => void;
  sendMessage: () => Promise<void>;
  clearError: () => void;
}

export function useChat({ contractId, isEmbedded = false }: UseChatProps): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async () => {
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
          conversationHistory: messages.slice(-10), // 最新10件の履歴を送信
          isContractSpecific: isEmbedded // 埋め込みモードの場合は契約特化モード
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
  }, [contractId, inputMessage, isEmbedded, messages]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    messages,
    inputMessage,
    isLoading,
    error,
    setInputMessage,
    sendMessage,
    clearError
  };
}