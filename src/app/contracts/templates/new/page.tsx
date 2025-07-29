'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Save, Plus, Trash2, 
  ChevronUp, ChevronDown, Variable
} from 'lucide-react';
import { ContractTemplate, TemplateClause, TemplateVariable } from '@/types/template';

export default function NewTemplatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [template, setTemplate] = useState<Partial<ContractTemplate>>({
    name: '',
    description: '',
    category: '',
    content: {
      title: '',
      clauses: [{
        id: `clause-${Date.now()}`,
        title: '',
        content: '',
        isRequired: true,
        order: 1
      }]
    },
    variables: [],
    tags: [],
    isActive: true
  });

  const handleAddClause = () => {
    setTemplate(prev => ({
      ...prev,
      content: {
        ...prev.content!,
        clauses: [
          ...prev.content!.clauses,
          {
            id: `clause-${Date.now()}`,
            title: '',
            content: '',
            isRequired: true,
            order: prev.content!.clauses.length + 1
          }
        ]
      }
    }));
  };

  const handleRemoveClause = (clauseId: string) => {
    setTemplate(prev => ({
      ...prev,
      content: {
        ...prev.content!,
        clauses: prev.content!.clauses
          .filter(c => c.id !== clauseId)
          .map((c, index) => ({ ...c, order: index + 1 }))
      }
    }));
  };

  const handleUpdateClause = (clauseId: string, updates: Partial<TemplateClause>) => {
    setTemplate(prev => ({
      ...prev,
      content: {
        ...prev.content!,
        clauses: prev.content!.clauses.map(c =>
          c.id === clauseId ? { ...c, ...updates } : c
        )
      }
    }));
  };

  const handleMoveClause = (clauseId: string, direction: 'up' | 'down') => {
    setTemplate(prev => {
      const clauses = [...prev.content!.clauses];
      const index = clauses.findIndex(c => c.id === clauseId);
      
      if (direction === 'up' && index > 0) {
        [clauses[index], clauses[index - 1]] = [clauses[index - 1], clauses[index]];
      } else if (direction === 'down' && index < clauses.length - 1) {
        [clauses[index], clauses[index + 1]] = [clauses[index + 1], clauses[index]];
      }
      
      return {
        ...prev,
        content: {
          ...prev.content!,
          clauses: clauses.map((c, i) => ({ ...c, order: i + 1 }))
        }
      };
    });
  };

  const handleAddVariable = () => {
    const newVariable: TemplateVariable = {
      id: `var-${Date.now()}`,
      name: '',
      displayName: '',
      type: 'text',
      required: false
    };
    
    setTemplate(prev => ({
      ...prev,
      variables: [...(prev.variables || []), newVariable]
    }));
  };

  const handleRemoveVariable = (varId: string) => {
    setTemplate(prev => ({
      ...prev,
      variables: prev.variables?.filter(v => v.id !== varId) || []
    }));
  };

  const handleUpdateVariable = (varId: string, updates: Partial<TemplateVariable>) => {
    setTemplate(prev => ({
      ...prev,
      variables: prev.variables?.map(v =>
        v.id === varId ? { ...v, ...updates } : v
      ) || []
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });

      if (response.ok) {
        router.push('/contracts/templates');
      } else {
        const error = await response.json();
        alert(error.error || 'テンプレートの作成に失敗しました');
      }
    } catch (error) {
      console.error('Failed to create template:', error);
      alert('テンプレートの作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/contracts/templates"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">新規テンプレート作成</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">基本情報</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                テンプレート名 *
              </label>
              <input
                type="text"
                required
                className="input"
                value={template.name}
                onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                placeholder="例: 秘密保持契約書（NDA）"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                説明
              </label>
              <textarea
                className="input"
                rows={3}
                value={template.description}
                onChange={(e) => setTemplate({ ...template, description: e.target.value })}
                placeholder="このテンプレートの説明を入力"
              />
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  カテゴリ *
                </label>
                <input
                  type="text"
                  required
                  className="input"
                  value={template.category}
                  onChange={(e) => setTemplate({ ...template, category: e.target.value })}
                  placeholder="例: NDA"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  タグ（カンマ区切り）
                </label>
                <input
                  type="text"
                  className="input"
                  value={template.tags?.join(', ')}
                  onChange={(e) => setTemplate({ 
                    ...template, 
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                  })}
                  placeholder="例: 秘密保持, 標準"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Contract Content */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">契約書内容</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                契約書タイトル *
              </label>
              <input
                type="text"
                required
                className="input"
                value={template.content?.title}
                onChange={(e) => setTemplate({
                  ...template,
                  content: { ...template.content!, title: e.target.value }
                })}
                placeholder="例: 秘密保持契約書"
              />
            </div>

            {/* Clauses */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  条項
                </label>
                <button
                  type="button"
                  onClick={handleAddClause}
                  className="btn-secondary text-sm flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  条項を追加
                </button>
              </div>
              
              <div className="space-y-4">
                {template.content?.clauses.map((clause, index) => (
                  <div key={clause.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 space-y-3">
                        <input
                          type="text"
                          required
                          className="input"
                          value={clause.title}
                          onChange={(e) => handleUpdateClause(clause.id, { title: e.target.value })}
                          placeholder="条項タイトル"
                        />
                        <textarea
                          required
                          className="input"
                          rows={4}
                          value={clause.content}
                          onChange={(e) => handleUpdateClause(clause.id, { content: e.target.value })}
                          placeholder="条項内容（変数は {{変数名}} の形式で入力）"
                        />
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={clause.isRequired}
                            onChange={(e) => handleUpdateClause(clause.id, { isRequired: e.target.checked })}
                          />
                          必須条項
                        </label>
                      </div>
                      <div className="flex items-center gap-1 ml-4">
                        <button
                          type="button"
                          onClick={() => handleMoveClause(clause.id, 'up')}
                          disabled={index === 0}
                          className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveClause(clause.id, 'down')}
                          disabled={index === template.content!.clauses.length - 1}
                          className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveClause(clause.id)}
                          className="p-1 hover:bg-red-100 text-red-600 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Variables */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Variable className="w-5 h-5" />
              変数設定
            </h2>
            <button
              type="button"
              onClick={handleAddVariable}
              className="btn-secondary text-sm flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              変数を追加
            </button>
          </div>
          
          {template.variables && template.variables.length > 0 ? (
            <div className="space-y-3">
              {template.variables.map((variable) => (
                <div key={variable.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="grid md:grid-cols-4 gap-3">
                    <input
                      type="text"
                      required
                      className="input"
                      value={variable.name}
                      onChange={(e) => handleUpdateVariable(variable.id, { name: e.target.value })}
                      placeholder="変数名（英字）"
                    />
                    <input
                      type="text"
                      required
                      className="input"
                      value={variable.displayName}
                      onChange={(e) => handleUpdateVariable(variable.id, { displayName: e.target.value })}
                      placeholder="表示名"
                    />
                    <select
                      className="input"
                      value={variable.type}
                      onChange={(e) => handleUpdateVariable(variable.id, { 
                        type: e.target.value as TemplateVariable['type'] 
                      })}
                    >
                      <option value="text">テキスト</option>
                      <option value="number">数値</option>
                      <option value="date">日付</option>
                      <option value="select">選択肢</option>
                      <option value="boolean">真偽値</option>
                    </select>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1 text-sm">
                        <input
                          type="checkbox"
                          checked={variable.required}
                          onChange={(e) => handleUpdateVariable(variable.id, { required: e.target.checked })}
                        />
                        必須
                      </label>
                      <button
                        type="button"
                        onClick={() => handleRemoveVariable(variable.id)}
                        className="ml-auto p-1 hover:bg-red-100 text-red-600 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              変数を追加すると、契約書内で動的な値を使用できます
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link
            href="/contracts/templates"
            className="btn-secondary"
          >
            キャンセル
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="w-4 h-4" />
            )}
            テンプレートを作成
          </button>
        </div>
      </form>
    </div>
  );
}