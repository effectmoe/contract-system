'use client';

import { Scale, X } from 'lucide-react';

interface ChatHeaderProps {
  onClose?: () => void;
  isEmbedded?: boolean;
}

export default function ChatHeader({ onClose, isEmbedded }: ChatHeaderProps) {
  if (isEmbedded) return null;

  return (
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
  );
}