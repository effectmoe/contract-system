'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, FileText, Loader, CheckCircle, AlertCircle,
  Download, Eye, Edit, X
} from 'lucide-react';

interface PDFImporterProps {
  onImportComplete: (data: {
    filename: string;
    extractedText: string;
    pdfUrl: string;
  }) => void;
  onCancel?: () => void;
}

interface UploadResult {
  url: string;
  filename: string;
  size: number;
}

interface OCRResult {
  text: string;
  filename: string;
}

export default function PDFImporter({ onImportComplete, onCancel }: PDFImporterProps) {
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'upload' | 'process' | 'preview' | 'complete'>('upload');

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setError(null);
    setUploading(true);
    setStep('upload');

    try {
      // Upload PDF
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('/api/upload/pdf', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'アップロードに失敗しました');
      }

      const uploadData = await uploadResponse.json();
      setUploadResult(uploadData);

      // Start OCR processing
      setUploading(false);
      setProcessing(true);
      setStep('process');

      const ocrResponse = await fetch('/api/upload/pdf-ocr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdfUrl: uploadData.url,
          filename: uploadData.filename,
        }),
      });

      if (!ocrResponse.ok) {
        const errorData = await ocrResponse.json();
        throw new Error(errorData.error || 'OCR処理に失敗しました');
      }

      const ocrData = await ocrResponse.json();
      setOcrResult(ocrData);
      setProcessing(false);
      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : '処理中にエラーが発生しました');
      setUploading(false);
      setProcessing(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleConfirm = () => {
    if (uploadResult && ocrResult) {
      onImportComplete({
        filename: uploadResult.filename,
        extractedText: ocrResult.text,
        pdfUrl: uploadResult.url,
      });
      setStep('complete');
    }
  };

  const handleReset = () => {
    setUploadResult(null);
    setOcrResult(null);
    setError(null);
    setStep('upload');
  };

  if (step === 'complete') {
    return (
      <div className="text-center p-8">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          インポート完了
        </h3>
        <p className="text-gray-600">
          PDFから契約書データを作成しました
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">PDF読み込み</h2>
          <p className="text-gray-600 mt-1">
            既存のPDFから契約書を作成します
          </p>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="btn-secondary flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            キャンセル
          </button>
        )}
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            step === 'upload' ? 'bg-blue-600 text-white' :
            ['process', 'preview'].includes(step) ? 'bg-green-500 text-white' :
            'bg-gray-300 text-gray-600'
          }`}>
            1
          </div>
          <div className="mx-4 text-sm font-medium">アップロード</div>
          <div className={`w-16 h-1 ${
            ['process', 'preview'].includes(step) ? 'bg-green-500' : 'bg-gray-300'
          }`} />
          
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            step === 'process' ? 'bg-blue-600 text-white' :
            step === 'preview' ? 'bg-green-500 text-white' :
            'bg-gray-300 text-gray-600'
          }`}>
            2
          </div>
          <div className="mx-4 text-sm font-medium">OCR処理</div>
          <div className={`w-16 h-1 ${
            step === 'preview' ? 'bg-green-500' : 'bg-gray-300'
          }`} />
          
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            step === 'preview' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
          }`}>
            3
          </div>
          <div className="ml-4 text-sm font-medium">確認</div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">エラー</span>
          </div>
          <p className="text-red-600 mt-1">{error}</p>
          <button
            onClick={handleReset}
            className="mt-3 text-sm text-red-600 hover:text-red-800 underline"
          >
            最初からやり直す
          </button>
        </div>
      )}

      {/* Upload Area */}
      {step === 'upload' && !uploading && (
        <div className="mb-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              PDFファイルをアップロード
            </h3>
            <p className="text-gray-600 mb-4">
              ファイルをドラッグ＆ドロップまたはクリックして選択
            </p>
            <p className="text-sm text-gray-500">
              最大ファイルサイズ: 10MB
            </p>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="text-center py-8">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            アップロード中...
          </h3>
          <p className="text-gray-600">
            PDFファイルをアップロードしています
          </p>
        </div>
      )}

      {/* OCR Progress */}
      {processing && (
        <div className="text-center py-8">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            OCR処理中...
          </h3>
          <p className="text-gray-600">
            PDFから文字を抽出しています（数分かかる場合があります）
          </p>
        </div>
      )}

      {/* Preview */}
      {step === 'preview' && ocrResult && uploadResult && (
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-700 mb-2">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">OCR処理完了</span>
            </div>
            <p className="text-green-600">
              ファイル「{uploadResult.filename}」から文字を抽出しました
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Original PDF */}
            <div className="bg-white border rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                元のPDF
              </h4>
              <div className="bg-gray-50 rounded p-4 text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-3">{uploadResult.filename}</p>
                <a
                  href={uploadResult.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-sm flex items-center gap-2 mx-auto w-fit"
                >
                  <Eye className="w-4 h-4" />
                  PDFを確認
                </a>
              </div>
            </div>

            {/* Extracted Text */}
            <div className="bg-white border rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Edit className="w-5 h-5" />
                抽出されたテキスト
              </h4>
              <div className="bg-gray-50 rounded p-4 max-h-96 overflow-y-auto">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {ocrResult.text}
                </pre>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-4">
            <button
              onClick={handleReset}
              className="btn-secondary"
            >
              やり直し
            </button>
            <button
              onClick={handleConfirm}
              className="btn-primary"
            >
              この内容で契約書を作成
            </button>
          </div>
        </div>
      )}
    </div>
  );
}