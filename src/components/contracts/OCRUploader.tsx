'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, Loader, CheckCircle, XCircle } from 'lucide-react';
import { formatFileSize } from '@/lib/utils/helpers';

interface OCRResult {
  text: string;
  confidence: number;
  isContract: boolean;
  contractInfo?: {
    title?: string;
    parties?: string[];
    date?: string;
    articles?: string[];
  };
}

interface OCRUploaderProps {
  onTextExtracted: (text: string, contractInfo?: any) => void;
}

export default function OCRUploader({ onTextExtracted }: OCRUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<OCRResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/tiff', 'image/bmp'];
    if (!allowedTypes.includes(file.type)) {
      setError('画像ファイル（JPEG、PNG、TIFF、BMP）のみ対応しています');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('ファイルサイズは10MB以下にしてください');
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload/ocr', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'OCR処理に失敗しました');
      }

      const data = await response.json();
      setResult({
        text: data.text,
        confidence: data.confidence,
        isContract: data.isContract,
        contractInfo: data.contractInfo,
      });

      // Call parent callback
      onTextExtracted(data.text, data.contractInfo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OCR処理中にエラーが発生しました');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
        />

        {uploading ? (
          <div className="flex flex-col items-center">
            <Loader className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-600">OCR処理中...</p>
          </div>
        ) : (
          <>
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">
              画像をドラッグ＆ドロップ、または
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-primary"
            >
              ファイルを選択
            </button>
            <p className="text-sm text-gray-500 mt-4">
              対応形式: JPEG, PNG, TIFF, BMP（最大10MB）
            </p>
          </>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
          <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* OCR Result */}
      {result && (
        <div className="mt-6 space-y-4">
          {/* Status */}
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <span>OCR処理が完了しました</span>
            <span className="ml-auto text-sm">
              信頼度: {(result.confidence * 100).toFixed(1)}%
            </span>
          </div>

          {/* Contract Detection */}
          {result.isContract && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                契約書として認識されました
              </h4>
              
              {result.contractInfo && (
                <div className="space-y-2 text-sm">
                  {result.contractInfo.title && (
                    <p>
                      <span className="font-medium">タイトル:</span>{' '}
                      {result.contractInfo.title}
                    </p>
                  )}
                  
                  {result.contractInfo.parties && result.contractInfo.parties.length > 0 && (
                    <p>
                      <span className="font-medium">契約当事者:</span>{' '}
                      {result.contractInfo.parties.join(', ')}
                    </p>
                  )}
                  
                  {result.contractInfo.date && (
                    <p>
                      <span className="font-medium">日付:</span>{' '}
                      {result.contractInfo.date}
                    </p>
                  )}
                  
                  {result.contractInfo.articles && result.contractInfo.articles.length > 0 && (
                    <div>
                      <span className="font-medium">条項:</span>
                      <ul className="mt-1 ml-4 list-disc list-inside">
                        {result.contractInfo.articles.slice(0, 5).map((article, index) => (
                          <li key={index}>{article}</li>
                        ))}
                        {result.contractInfo.articles.length > 5 && (
                          <li>他 {result.contractInfo.articles.length - 5} 条項</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Extracted Text Preview */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">抽出されたテキスト（プレビュー）</h4>
            <pre className="text-sm text-gray-600 whitespace-pre-wrap font-mono bg-gray-50 p-3 rounded max-h-48 overflow-y-auto">
              {result.text.substring(0, 500)}
              {result.text.length > 500 && '...'}
            </pre>
            <p className="text-sm text-gray-500 mt-2">
              合計 {result.text.length} 文字を抽出しました
            </p>
          </div>
        </div>
      )}
    </div>
  );
}