'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, Download, Edit, Send, Shield, MessageSquare, 
  Brain, Calendar, Users, AlertCircle, CheckCircle,
  ChevronLeft, Award, Link2, Receipt, FileSpreadsheet, 
  RefreshCw, ExternalLink, Trash2, AlertTriangle
} from 'lucide-react';
import { Contract } from '@/types/contract';
import { CONTRACT_STATUS_LABELS, CONTRACT_TYPE_LABELS, STATUS_COLORS } from '@/lib/utils/constants';
import { formatDate } from '@/lib/utils/helpers';
import SimplePDFViewer from './SimplePDFViewer';
import SignatureCapture from './SignatureCapture';
import AIChat from './AIChat';
import EnhancedAIChat from './EnhancedAIChat';
import EnhancedAnalysisDisplay from './EnhancedAnalysisDisplay';
import DeleteConfirmModal from './DeleteConfirmModal';
import { EnhancedAnalysis } from '@/lib/legal/rag-service';

interface ContractDetailProps {
  contractId: string;
}

export default function ContractDetail({ contractId }: ContractDetailProps) {
  const router = useRouter();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'detail' | 'pdf' | 'signature' | 'ai' | 'enhanced-ai'>('detail');
  const [showSignature, setShowSignature] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [enhancedAnalyzing, setEnhancedAnalyzing] = useState(false);
  const [enhancedAnalysis, setEnhancedAnalysis] = useState<EnhancedAnalysis | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleSendMagicLink = async (party: any) => {
    try {
      const response = await fetch('/api/auth/send-magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractId: contract!.contractId,
          partyId: party.id,
          email: party.email,
          name: party.name,
        }),
      });

      if (!response.ok) {
        throw new Error('リンクの送信に失敗しました');
      }

      const data = await response.json();
      
      if (data.demoLink) {
        // Demo mode: show the link
        alert(`デモモード: 以下のリンクで契約書を確認できます\n${window.location.origin}${data.demoLink}`);
      } else {
        alert(`${party.name}様にアクセスリンクを送信しました`);
      }
    } catch (err) {
      alert('リンクの送信に失敗しました');
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

  const handleEnhancedAIAnalysis = async () => {
    setEnhancedAnalyzing(true);
    try {
      const response = await fetch('/api/ai/enhanced-analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contractId }),
      });

      if (!response.ok) {
        throw new Error('拡張AI分析に失敗しました');
      }

      const data = await response.json();
      setEnhancedAnalysis(data.analysis);
      alert('拡張AI分析が完了しました');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setEnhancedAnalyzing(false);
    }
  };


  const handleDownloadCertificate = async () => {
    if (!contract) return;
    
    try {
      const response = await fetch(`/api/contracts/${contractId}/certificate`);
      
      if (!response.ok) {
        throw new Error('証明書が見つかりません');
      }

      const data = await response.json();
      
      if (data.certificate?.pdfUrl) {
        const link = document.createElement('a');
        link.href = data.certificate.pdfUrl;
        link.download = `合意締結証明書_${contract.contractId}.pdf`;
        link.click();
      } else {
        alert('証明書のPDFが生成されていません');
      }
    } catch (err) {
      alert('証明書のダウンロードに失敗しました');
    }
  };

  const handleDeleteContract = async () => {
    if (!contract) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/contracts/${contractId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '契約書の削除に失敗しました');
      }

      // 削除成功
      router.push('/contracts?deleted=true');
    } catch (err) {
      alert(err instanceof Error ? err.message : '契約書の削除に失敗しました');
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {contract.type === 'nda' ? 'NDA PDF' : '契約書PDF'}
            </a>
            
            {contract.status === 'completed' && (
              <a
                href={`/api/contracts/${contractId}/certificate`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary flex items-center gap-2"
              >
                <Award className="w-4 h-4" />
                合意締結証明書
              </a>
            )}
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
          <button
            onClick={() => setActiveTab('enhanced-ai')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'enhanced-ai'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            拡張AI分析
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

          {/* AAM Accounting System Integration */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Link2 className="w-5 h-5" />
              会計システム連動
            </h3>
            {contract.accountingIntegration ? (
              <div className="space-y-3">
                {/* Invoice Link */}
                {contract.accountingIntegration.invoiceNumber && (
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Receipt className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium">請求書</p>
                        <p className="text-xs text-gray-600">
                          {contract.accountingIntegration.invoiceNumber}
                        </p>
                      </div>
                    </div>
                    {contract.accountingIntegration.accountingSystemUrl && (
                      <a
                        href={`${contract.accountingIntegration.accountingSystemUrl}/invoices/${contract.accountingIntegration.invoiceId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                )}
                
                {/* Estimate Link */}
                {contract.accountingIntegration.estimateNumber && (
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium">見積書</p>
                        <p className="text-xs text-gray-600">
                          {contract.accountingIntegration.estimateNumber}
                        </p>
                      </div>
                    </div>
                    {contract.accountingIntegration.accountingSystemUrl && (
                      <a
                        href={`${contract.accountingIntegration.accountingSystemUrl}/estimates/${contract.accountingIntegration.estimateId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                )}
                
                {/* Sync Status */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">同期状態</span>
                  <span className={`flex items-center gap-1 ${
                    contract.accountingIntegration.syncStatus === 'synced' 
                      ? 'text-green-600' 
                      : contract.accountingIntegration.syncStatus === 'error'
                      ? 'text-red-600'
                      : 'text-yellow-600'
                  }`}>
                    {contract.accountingIntegration.syncStatus === 'synced' && <CheckCircle className="w-4 h-4" />}
                    {contract.accountingIntegration.syncStatus === 'error' && <AlertCircle className="w-4 h-4" />}
                    {contract.accountingIntegration.syncStatus === 'pending' && <RefreshCw className="w-4 h-4 animate-spin" />}
                    {contract.accountingIntegration.syncStatus === 'synced' ? '同期済み' 
                      : contract.accountingIntegration.syncStatus === 'error' ? 'エラー' 
                      : '同期中'}
                  </span>
                </div>
                
                {contract.accountingIntegration.lastSyncedAt && (
                  <p className="text-xs text-gray-500">
                    最終同期: {formatDate(contract.accountingIntegration.lastSyncedAt)}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <Link2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500 mb-3">
                  会計システムと連動していません
                </p>
                <button className="btn-secondary text-sm">
                  会計システムと連動
                </button>
              </div>
            )}
          </div>

          {/* Parties */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              契約当事者
            </h3>
            <div className="space-y-3">
              {contract.parties.map((party) => (
                <div key={party.id} className="border-l-4 border-gray-200 pl-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{party.name}</p>
                    <p className="text-sm text-gray-600">{party.email}</p>
                    {party.company && (
                      <p className="text-sm text-gray-600">{party.company}</p>
                    )}
                    <p className="text-xs text-gray-500">{party.role}</p>
                  </div>
                  <button
                    onClick={() => handleSendMagicLink(party)}
                    className="btn-secondary text-sm flex items-center gap-2"
                    title="確認リンクを送信"
                  >
                    <Send className="w-4 h-4" />
                    確認リンク送信
                  </button>
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
          <SimplePDFViewer 
            contractId={contract.contractId} 
            contractType={contract.type}
            contractTitle={contract.title}
          />
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

          {/* Danger Zone */}
          <div className="col-span-full">
            <div className="card border-red-200 bg-red-50">
              <div className="border-b border-red-200 pb-4 mb-4">
                <h3 className="text-lg font-semibold text-red-800 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Danger Zone
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  この操作は元に戻すことができません。慎重に行ってください。
                </p>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-red-800">契約書を削除</h4>
                  <p className="text-sm text-red-600 mt-1">
                    この契約書とすべての関連データが完全に削除されます。
                  </p>
                </div>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  削除
                </button>
              </div>
            </div>
          </div>
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
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
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

      {activeTab === 'enhanced-ai' && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* 拡張AI分析 */}
          <div className="md:col-span-1">
            <EnhancedAnalysisDisplay
              contractId={contract.contractId}
              analysis={enhancedAnalysis}
              onRunAnalysis={handleEnhancedAIAnalysis}
              isAnalyzing={enhancedAnalyzing}
            />
          </div>

          {/* 法務特化型AIチャット */}
          <div className="md:col-span-1">
            <div className="card h-[600px]">
              <EnhancedAIChat 
                contractId={contract.contractId}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* 契約書特化型チャット（ページ下部埋め込み） */}
      <div className="mt-12 border-t pt-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">この契約書について質問する</h2>
          <p className="text-gray-600">
            この契約書「{contract.title}」に関する専門的な質問にお答えします。
            法的根拠に基づいた詳細な回答を提供いたします。
          </p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="h-[500px]">
            <EnhancedAIChat 
              contractId={contract.contractId}
              isEmbedded={true}
              contractTitle={contract.title}
            />
          </div>
        </div>
        
        {/* 免責事項 */}
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 mb-1">専門的な法的アドバイスについて</p>
              <p className="text-blue-800 leading-relaxed">
                このAIアシスタントは契約書「{contract.title}」に特化した情報を提供しますが、
                正式な法的アドバイスではありません。重要な決定については必ず法律専門家にご相談ください。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteContract}
        contractTitle={contract.title}
        contractId={contract.contractId}
        isDeleting={isDeleting}
      />
    </div>
  );
}