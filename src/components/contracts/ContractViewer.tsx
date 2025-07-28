'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, Download, Shield, Calendar, 
  AlertCircle, CheckCircle, Loader, LogOut,
  User, Building2, Mail
} from 'lucide-react';
import { Contract } from '@/types/contract';
import { formatDate } from '@/lib/utils/helpers';
import PDFViewer from './PDFViewer';
import SignatureCapture from './SignatureCapture';
import ChatWidget from './ChatWidget';

interface ViewerInfo {
  partyId: string;
  email: string;
  name: string;
  company?: string;
  role: string;
}

interface ContractViewerProps {
  contractId: string;
  viewerInfo: ViewerInfo;
}

export default function ContractViewer({ contractId, viewerInfo }: ContractViewerProps) {
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSignature, setShowSignature] = useState(false);
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    fetchContract();
  }, [contractId]);

  const fetchContract = async () => {
    try {
      const response = await fetch(`/api/contracts/${contractId}`);
      if (!response.ok) {
        throw new Error('契約書の取得に失敗しました');
      }
      const data = await response.json();
      setContract(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期しないエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSignature = async (signatureData: string) => {
    if (!contract) return;
    
    setSigning(true);
    try {
      const response = await fetch(`/api/contracts/${contractId}/sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          partyId: viewerInfo.partyId,
          signatureData,
          signedBy: viewerInfo.name,
          ipAddress: 'viewer-ip', // In production, get actual IP
        }),
      });

      if (!response.ok) {
        throw new Error('署名の保存に失敗しました');
      }

      await fetchContract();
      setShowSignature(false);
      alert('署名が完了しました');
    } catch (err) {
      alert('署名の処理中にエラーが発生しました');
    } finally {
      setSigning(false);
    }
  };

  const handleLogout = () => {
    // Clear session cookie
    document.cookie = 'contract-viewer-session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    window.location.href = '/';
  };

  const downloadPDF = async () => {
    try {
      const response = await fetch(`/api/contracts/${contractId}/pdf`);
      if (!response.ok) throw new Error('PDF生成に失敗しました');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `契約書_${contract?.contractId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('PDFのダウンロードに失敗しました');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error || '契約書が見つかりませんでした'}</p>
        </div>
      </div>
    );
  }

  const mySignature = contract.signatures.find(s => s.partyId === viewerInfo.partyId);
  const isSigned = !!mySignature;
  const canSign = contract.status === 'pending' && !isSigned;

  return (
    <>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">契約書確認システム</h1>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">ログイン中</p>
                <p className="font-medium">{viewerInfo.name}</p>
              </div>
              <button
                onClick={handleLogout}
                className="btn-secondary flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Contract Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {contract.title}
              </h2>
              <p className="text-gray-600">{contract.description}</p>
            </div>
            <button
              onClick={downloadPDF}
              className="btn-secondary flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              PDFダウンロード
            </button>
          </div>

          {/* Your Info */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">あなたの情報</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                <span>{viewerInfo.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600" />
                <span>{viewerInfo.email}</span>
              </div>
              {viewerInfo.company && (
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>{viewerInfo.company}</span>
                </div>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" />
              <span>契約ID: {contract.contractId}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>作成日: {formatDate(contract.createdAt)}</span>
            </div>
            {contract.validUntil && (
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-gray-400" />
                <span>有効期限: {formatDate(contract.validUntil)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Signature Status */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">署名状況</h3>
          
          {isSigned ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-700 mb-2">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">署名済み</span>
              </div>
              <p className="text-sm text-green-600">
                署名日時: {formatDate(mySignature.signedAt, true)}
              </p>
              {mySignature.certificateId && (
                <p className="text-xs text-green-600 mt-1">
                  証明書ID: {mySignature.certificateId}
                </p>
              )}
            </div>
          ) : canSign ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 mb-4">
                この契約書への署名が必要です。内容を確認の上、署名してください。
              </p>
              <button
                onClick={() => setShowSignature(true)}
                className="btn-primary"
              >
                署名する
              </button>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-gray-600">
                この契約書は{contract.status === 'completed' ? '締結済み' : '処理中'}です。
              </p>
            </div>
          )}
        </div>

        {/* Contract Content */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">契約内容</h3>
          <div className="prose max-w-none">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-6 rounded-lg">
              {contract.content}
            </pre>
          </div>
        </div>

        {/* PDF Viewer */}
        {contract.pdfUrl && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">PDF表示</h3>
            <PDFViewer url={contract.pdfUrl} />
          </div>
        )}

        {/* All Parties */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">全契約当事者</h3>
          <div className="space-y-3">
            {contract.parties.map((party) => {
              const signature = contract.signatures.find(s => s.partyId === party.id);
              const signed = !!signature;
              
              return (
                <div 
                  key={party.id} 
                  className={`flex items-center justify-between p-4 rounded-lg ${
                    party.id === viewerInfo.partyId ? 'bg-blue-50' : 'bg-gray-50'
                  }`}
                >
                  <div>
                    <p className="font-medium">
                      {party.name}
                      {party.id === viewerInfo.partyId && (
                        <span className="text-sm text-blue-600 ml-2">(あなた)</span>
                      )}
                    </p>
                    <p className="text-sm text-gray-600">{party.company || party.email}</p>
                    <p className="text-xs text-gray-500">{party.role}</p>
                  </div>
                  
                  {signed ? (
                    <div className="text-right">
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">署名済み</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(signature.signedAt)}
                      </p>
                    </div>
                  ) : (
                    <div className="text-gray-400">
                      <span className="text-sm">未署名</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Signature Modal */}
      {showSignature && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h3 className="text-lg font-semibold mb-4">電子署名</h3>
            <p className="text-sm text-gray-600 mb-4">
              以下の枠内に署名してください。署名は契約書に記録されます。
            </p>
            <SignatureCapture
              onSave={handleSignature}
              onCancel={() => setShowSignature(false)}
              disabled={signing}
            />
          </div>
        </div>
      )}

      {/* Chat Widget */}
      <ChatWidget contract={contract} />
    </>
  );
}