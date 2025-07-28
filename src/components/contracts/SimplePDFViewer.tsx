'use client';

import { Download } from 'lucide-react';

interface SimplePDFViewerProps {
  contractId: string;
  includeSignatures?: boolean;
}

export default function SimplePDFViewer({ contractId, includeSignatures = true }: SimplePDFViewerProps) {
  const pdfUrl = `/api/contracts/${contractId}/pdf${includeSignatures ? '' : '?signatures=false'}`;

  const downloadPDF = async () => {
    try {
      const response = await fetch(pdfUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contract_${contractId}.pdf`;
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
        />
      </div>
    </div>
  );
}