'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, Save, FileText, Users, Calendar, 
  AlertCircle, CheckCircle, X 
} from 'lucide-react';
import { Contract } from '@/types/contract';
import { CONTRACT_TYPE_LABELS, CONTRACT_TYPES } from '@/lib/utils/constants';

export default function EditContractPage() {
  const router = useRouter();
  const params = useParams();
  const contractId = params.id as string;

  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    type: 'service_agreement' as keyof typeof CONTRACT_TYPES,
  });

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
      setFormData({
        title: data.title,
        description: data.description || '',
        content: data.content,
        type: data.type,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期しないエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!contract) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/contracts/${contractId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          content: formData.content,
          type: formData.type,
        }),
      });

      if (!response.ok) {
        throw new Error('契約書の更新に失敗しました');
      }

      // 保存成功後、詳細ページに戻る
      router.push(`/contracts/${contractId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/contracts/${contractId}`);
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
          <p className="text-red-600 mb-4">{error || '契約書が見つかりませんでした'}</p>
          <button
            onClick={() => router.push('/contracts')}
            className="btn-secondary"
          >
            一覧に戻る
          </button>
        </div>
      </div>
    );
  }

  // 編集可能なステータスかチェック
  if (contract.status !== 'draft') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-yellow-600 mb-4">
            この契約書は編集できません。編集できるのは下書きステータスの契約書のみです。
          </p>
          <button
            onClick={() => router.push(`/contracts/${contractId}`)}
            className="btn-secondary"
          >
            詳細ページに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={handleCancel}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          契約書詳細に戻る
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              契約書編集
            </h1>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FileText className="w-4 h-4" />
              {contract.contractId}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="btn-secondary flex items-center gap-2"
              disabled={saving}
            >
              <X className="w-4 h-4" />
              キャンセル
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !formData.title.trim() || !formData.content.trim()}
              className="btn-primary flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  保存中...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  保存
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="space-y-6">
        {/* Basic Info */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">基本情報</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                契約書タイトル <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="契約書のタイトルを入力してください"
                required
              />
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                契約種別
              </label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as keyof typeof CONTRACT_TYPES }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {Object.entries(CONTRACT_TYPES).map(([key, value]) => (
                  <option key={key} value={value}>
                    {CONTRACT_TYPE_LABELS[value as keyof typeof CONTRACT_TYPE_LABELS]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                説明
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="契約書の説明を入力してください（任意）"
              />
            </div>
          </div>
        </div>

        {/* Contract Content */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">
            契約内容 <span className="text-red-500">*</span>
          </h3>
          <div>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              rows={20}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              placeholder="契約書の内容を入力してください"
              required
            />
            <p className="text-sm text-gray-500 mt-2">
              契約書の本文を入力してください。改行や書式設定も保持されます。
            </p>
          </div>
        </div>

        {/* Party Information - Read Only */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            契約当事者（参照のみ）
          </h3>
          <div className="space-y-3">
            {contract.parties.map((party) => (
              <div key={party.id} className="bg-gray-50 p-3 rounded-lg">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium">{party.name}</p>
                    <p className="text-sm text-gray-600">{party.email}</p>
                  </div>
                  <div>
                    {party.company && (
                      <p className="text-sm text-gray-600">{party.company}</p>
                    )}
                    <p className="text-xs text-gray-500">{party.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            契約当事者情報の変更は現在サポートされていません。
          </p>
        </div>
      </div>
    </div>
  );
}