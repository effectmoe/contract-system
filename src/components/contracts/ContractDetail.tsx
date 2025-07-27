'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, Download, Edit, Send, Shield, MessageSquare, 
  Brain, Calendar, Users, AlertCircle, CheckCircle,
  ChevronLeft, Loader
} from 'lucide-react';
import { Contract } from '@/types/contract';
import { CONTRACT_STATUS_LABELS, CONTRACT_TYPE_LABELS, STATUS_COLORS } from '@/lib/utils/constants';
import { formatDate } from '@/lib/utils/helpers';
import PDFViewer from './PDFViewer';
import SignatureCapture from './SignatureCapture';
import AIChat from './AIChat';

interface ContractDetailProps {
  contractId: string;
}

export default function ContractDetail({ contractId }: ContractDetailProps) {
  const router = useRouter();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'detail' | 'pdf' | 'signature' | 'ai'>('detail');
  const [showSignature, setShowSignature] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

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

  const handleSendForSignature = async (partyId: string) => {
    try {
      const response = await fetch(`/api/contracts/${contractId}/sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ partyId }),
      });

      if (!response.ok) {
        throw new Error('署名依頼の送信に失敗しました');
      }

      const data = await response.json();
      alert(`署名依頼を送信しました。\n署名URL: ${data.signatureUrl}`);
      
      // Refresh contract data
      await fetchContract();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'エラーが発生しました');
    }
  };

  const handleSign = async (signatureDataUrl: string) => {
    // This would be called from the signature page with token
    console.log('Signature captured:', signatureDataUrl);
    setShowSignature(false);
    // Refresh contract
    await fetchContract();
  };

  const handleAIAnalysis = async () => {
    setAnalyzing(true);
    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contractId }),
      });

      if (!response.ok) {
        throw new Error('AI分析に失敗しました');
      }

      const data = await response.json();
      alert('AI分析が完了しました');
      
      // Refresh contract to show analysis results
      await fetchContract();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setAnalyzing(false);
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
          <button
            onClick={() => router.push('/contracts')}
            className="mt-4 btn-secondary"
          >
            一覧に戻る
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: Contract['status']) => {
    return STATUS_COLORS[status] || '#6B7280';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/contracts')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          契約書一覧に戻る
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {contract.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                {CONTRACT_TYPE_LABELS[contract.type]}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                作成日: {formatDate(contract.createdAt)}
              </span>
              <span
                className="px-3 py-1 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: getStatusColor(contract.status) }}
              >
                {CONTRACT_STATUS_LABELS[contract.status]}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            {contract.status === 'draft' && (
              <button
                onClick={() => router.push(`/contracts/${contractId}/edit`)}
                className="btn-secondary flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                編集
              </button>
            )}
            <a
              href={`/api/contracts/${contractId}/pdf`}
              download
              className="btn-secondary flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              PDF
            </a>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('detail')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'detail'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            詳細情報
          </button>
          <button
            onClick={() => setActiveTab('pdf')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pdf'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            PDF表示
          </button>
          <button
            onClick={() => setActiveTab('signature')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'signature'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            署名状況
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'ai'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            AI分析
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'detail' && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Contract Info */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">契約情報</h3>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm text-gray-500">契約ID</dt>
                <dd className="font-mono text-sm">{contract.contractId}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">説明</dt>
                <dd>{contract.description || '-'}</dd>
              </div>
              {contract.transactionDate && (
                <div>
                  <dt className="text-sm text-gray-500">取引日</dt>
                  <dd>{formatDate(contract.transactionDate)}</dd>
                </div>
              )}
              {contract.transactionAmount && (
                <div>
                  <dt className="text-sm text-gray-500">取引金額</dt>
                  <dd>¥{contract.transactionAmount.toLocaleString()}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Parties */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              契約当事者
            </h3>
            <div className="space-y-3">
              {contract.parties.map((party) => (
                <div key={party.id} className="border-l-4 border-gray-200 pl-3">
                  <p className="font-medium">{party.name}</p>
                  <p className="text-sm text-gray-600">{party.email}</p>
                  {party.company && (
                    <p className="text-sm text-gray-600">{party.company}</p>
                  )}
                  <p className="text-xs text-gray-500">{party.role}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Content Preview */}
          <div className="card md:col-span-2">
            <h3 className="text-lg font-semibold mb-4">契約内容</h3>
            <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
              {contract.content}
            </pre>
          </div>
        </div>
      )}

      {activeTab === 'pdf' && (
        <div className="card">
          <PDFViewer contractId={contract.contractId} />
        </div>
      )}

      {activeTab === 'signature' && (
        <div className="space-y-6">
          {/* Signature Status */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              署名状況
            </h3>
            
            <div className="space-y-4">
              {contract.parties.map((party) => {
                const signature = contract.signatures.find(s => s.partyId === party.id);
                const isSigned = !!signature;

                return (
                  <div key={party.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{party.name}</p>
                      <p className="text-sm text-gray-600">{party.email}</p>
                    </div>
                    
                    {isSigned ? (
                      <div className="text-right">
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-medium">署名済み</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(signature.signedAt, true)}
                        </p>
                        {signature.certificateId && (
                          <p className="text-xs text-gray-500">
                            証明書ID: {signature.certificateId}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {party.signatureRequired && contract.status !== 'completed' && (
                          <button
                            onClick={() => handleSendForSignature(party.id)}
                            className="btn-primary text-sm flex items-center gap-1"
                          >
                            <Send className="w-4 h-4" />
                            署名依頼
                          </button>
                        )}
                        <span className="text-gray-500">未署名</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Demo Signature */}
          {showSignature && (
            <div className="card">
              <SignatureCapture
                partyName="デモユーザー"
                onSign={handleSign}
                onCancel={() => setShowSignature(false)}
              />
            </div>
          )}
        </div>
      )}

      {activeTab === 'ai' && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* AI Analysis */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Brain className="w-5 h-5" />
                AI分析結果
              </h3>
              <button
                onClick={handleAIAnalysis}
                disabled={analyzing}
                className="btn-primary text-sm"
              >
                {analyzing ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin mr-1" />
                    分析中...
                  </>
                ) : (
                  '分析実行'
                )}
              </button>
            </div>

            {contract.aiAnalysis ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-1">要約</h4>
                  <p className="text-sm text-gray-700">{contract.aiAnalysis.summary}</p>
                </div>

                <div>
                  <h4 className="font-medium mb-1">重要条項</h4>
                  <ul className="text-sm text-gray-700 list-disc list-inside">
                    {contract.aiAnalysis.keyTerms.map((term, index) => (
                      <li key={index}>{term}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-1">リスク評価</h4>
                  <div className="space-y-2">
                    {contract.aiAnalysis.risks.map((risk, index) => (
                      <div
                        key={index}
                        className={`p-2 rounded text-sm ${
                          risk.level === 'high'
                            ? 'bg-red-50 text-red-700'
                            : risk.level === 'medium'
                            ? 'bg-yellow-50 text-yellow-700'
                            : 'bg-green-50 text-green-700'
                        }`}
                      >
                        <span className="font-medium">
                          {risk.level === 'high' ? '高' : risk.level === 'medium' ? '中' : '低'}リスク:
                        </span>{' '}
                        {risk.description}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-1">推奨事項</h4>
                  <ul className="text-sm text-gray-700 list-disc list-inside">
                    {contract.aiAnalysis.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                AI分析を実行して契約内容を詳しく確認しましょう
              </p>
            )}
          </div>

          {/* AI Chat */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              AIアシスタント
            </h3>
            <div className="h-[500px]">
              <AIChat contractId={contract.contractId} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}