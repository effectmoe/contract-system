'use client';

import { Download } from 'lucide-react';
import { formatDate } from '@/lib/utils/helpers';

interface SimplePDFViewerProps {
  contractId: string;
  includeSignatures?: boolean;
  contractType?: string;
  contractTitle?: string;
}

export default function SimplePDFViewer({ 
  contractId, 
  includeSignatures = true, 
  contractType = 'contract',
  contractTitle = '契約書'
}: SimplePDFViewerProps) {
  const pdfUrl = `/api/contracts/${contractId}/pdf${includeSignatures ? '' : '?signatures=false'}`;

  const downloadPDF = async () => {
    try {
      const response = await fetch(pdfUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // 契約タイプに応じたファイル名を生成
      const date = formatDate(new Date()).replace(/\//g, '-');
      let filename = '';
      
      switch(contractType) {
        case 'nda':
          filename = `秘密保持契約書_${contractId}_${date}.pdf`;
          break;
        case 'certificate':
          filename = `合意締結証明書_${contractId}_${date}.pdf`;
          break;
        default:
          filename = `${contractTitle.replace(/[\/\\?%*:|"<>]/g, '_')}_${contractId}_${date}.pdf`;
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download PDF:', error);
      alert('PDFのダウンロードに失敗しました');
    }
  };

  return (
    <div className="bg-gray-100 rounded-lg">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <h3 className="text-sm font-medium">PDFプレビュー</h3>
        <button
          onClick={downloadPDF}
          className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          title="ダウンロード"
        >
          <Download className="w-4 h-4" />
          ダウンロード
        </button>
      </div>

      {/* PDF Display using iframe */}
      <div className="p-4">
        <iframe
          src={pdfUrl}
          className="w-full h-[600px] bg-white rounded shadow-lg"
          title="契約書PDF"
          onError={(e) => {
            console.error('PDF iframe error:', e);
          }}
        />
        <div className="mt-4 text-sm text-gray-600">
          <p>PDFが表示されない場合は、上記のダウンロードボタンからPDFをダウンロードしてご確認ください。</p>
          <p className="mt-2">
            <a 
              href={pdfUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              新しいタブで開く →
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}