'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Save, X, Plus, Trash2, MoveUp, MoveDown,
  FileText, Tag, Info, Variable
} from 'lucide-react';
import { ContractTemplate } from '@/types/template';

export default function EditTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.id as string;
  
  const [template, setTemplate] = useState<ContractTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplate();
  }, [templateId]);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/templates/${templateId}`);
      
      if (!response.ok) {
        throw new Error('テンプレートの取得に失敗しました');
      }
      
      const data = await response.json();
      setTemplate(data.data);
    } catch (error) {
      console.error('Failed to fetch template:', error);
      setError('テンプレートの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!template) return;
    
    try {
      setSaving(true);
      setError(null);
      
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });

      if (!response.ok) {
        throw new Error('保存に失敗しました');
      }

      router.push('/contracts/templates');
    } catch (error) {
      console.error('Failed to save template:', error);
      setError('テンプレートの保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const addClause = () => {
    if (!template) return;
    
    const newClause = {
      id: `clause-${Date.now()}`,
      title: '新規条項',
      content: '',
      isRequired: true,
      order: template.content.clauses.length,
    };
    
    setTemplate({
      ...template,
      content: {
        ...template.content,
        clauses: [...template.content.clauses, newClause],
      },
    });
  };

  const updateClause = (index: number, field: string, value: any) => {
    if (!template) return;
    
    const updatedClauses = [...template.content.clauses];
    updatedClauses[index] = { ...updatedClauses[index], [field]: value };
    
    setTemplate({
      ...template,
      content: {
        ...template.content,
        clauses: updatedClauses,
      },
    });
  };

  const deleteClause = (index: number) => {
    if (!template) return;
    
    const updatedClauses = template.content.clauses.filter((_, i) => i !== index);
    
    setTemplate({
      ...template,
      content: {
        ...template.content,
        clauses: updatedClauses,
      },
    });
  };

  const moveClause = (index: number, direction: 'up' | 'down') => {
    if (!template) return;
    
    const clauses = [...template.content.clauses];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= clauses.length) return;
    
    [clauses[index], clauses[newIndex]] = [clauses[newIndex], clauses[index]];
    
    setTemplate({
      ...template,
      content: {
        ...template.content,
        clauses,
      },
    });
  };

  const addVariable = () => {
    if (!template) return;
    
    const newVariable = {
      id: `var_${Date.now()}`,
      name: `variable_${Date.now()}`,
      displayName: '新規変数',
      type: 'text' as const,
      required: false,
      defaultValue: '',
    };
    
    setTemplate({
      ...template,
      variables: [...template.variables, newVariable],
    });
  };

  const updateVariable = (index: number, field: string, value: any) => {
    if (!template) return;
    
    const updatedVariables = [...template.variables];
    updatedVariables[index] = { ...updatedVariables[index], [field]: value };
    
    setTemplate({
      ...template,
      variables: updatedVariables,
    });
  };

  const deleteVariable = (index: number) => {
    if (!template) return;
    
    const updatedVariables = template.variables.filter((_, i) => i !== index);
    
    setTemplate({
      ...template,
      variables: updatedVariables,
    });
  };

  const addTag = () => {
    const newTag = prompt('新しいタグを入力してください:');
    if (!newTag || !template) return;
    
    setTemplate({
      ...template,
      tags: [...(template.tags || []), newTag.trim()],
    });
  };

  const removeTag = (tag: string) => {
    if (!template) return;
    
    setTemplate({
      ...template,
      tags: template.tags?.filter(t => t !== tag) || [],
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 mb-4">{error || 'テンプレートが見つかりません'}</p>
          <Link href="/contracts/templates" className="btn-secondary">
            テンプレート一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">テンプレート編集</h1>
        <div className="flex gap-4">
          <Link
            href="/contracts/templates"
            className="btn-secondary flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            キャンセル
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      {/* Basic Information */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Info className="w-5 h-5" />
          基本情報
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="label">テンプレート名</label>
            <input
              type="text"
              className="input"
              value={template.name}
              onChange={(e) => setTemplate({ ...template, name: e.target.value })}
            />
          </div>
          
          <div>
            <label className="label">カテゴリ</label>
            <input
              type="text"
              className="input"
              value={template.category}
              onChange={(e) => setTemplate({ ...template, category: e.target.value })}
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="label">説明</label>
            <textarea
              className="input min-h-[100px]"
              value={template.description || ''}
              onChange={(e) => setTemplate({ ...template, description: e.target.value })}
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="label flex items-center gap-2">
              <Tag className="w-4 h-4" />
              タグ
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {template.tags?.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <button
                onClick={addTag}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                <Plus className="w-3 h-3 mr-1" />
                タグを追加
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Variables */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Variable className="w-5 h-5" />
            変数
          </h2>
          <button
            onClick={addVariable}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            変数を追加
          </button>
        </div>
        
        <div className="space-y-4">
          {template.variables.map((variable, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <label className="label text-sm">変数名</label>
                  <input
                    type="text"
                    className="input"
                    value={variable.name}
                    onChange={(e) => updateVariable(index, 'name', e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="label text-sm">表示名</label>
                  <input
                    type="text"
                    className="input"
                    value={variable.displayName}
                    onChange={(e) => updateVariable(index, 'displayName', e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="label text-sm">タイプ</label>
                  <select
                    className="input"
                    value={variable.type}
                    onChange={(e) => updateVariable(index, 'type', e.target.value)}
                  >
                    <option value="text">テキスト</option>
                    <option value="number">数値</option>
                    <option value="date">日付</option>
                    <option value="select">選択</option>
                  </select>
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={() => deleteVariable(index)}
                    className="btn-secondary text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="label text-sm">デフォルト値</label>
                  <input
                    type="text"
                    className="input"
                    value={variable.defaultValue || ''}
                    onChange={(e) => updateVariable(index, 'defaultValue', e.target.value)}
                  />
                </div>
                
                <div className="flex items-end">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={variable.required}
                      onChange={(e) => updateVariable(index, 'required', e.target.checked)}
                    />
                    <span className="text-sm">必須項目</span>
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Clauses */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5" />
            条項
          </h2>
          <button
            onClick={addClause}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            条項を追加
          </button>
        </div>
        
        <div className="space-y-4">
          {template.content.clauses.map((clause, index) => (
            <div key={clause.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-4">
                <input
                  type="text"
                  className="input text-lg font-semibold"
                  value={clause.title}
                  onChange={(e) => updateClause(index, 'title', e.target.value)}
                />
                
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => moveClause(index, 'up')}
                    disabled={index === 0}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
                  >
                    <MoveUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => moveClause(index, 'down')}
                    disabled={index === template.content.clauses.length - 1}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
                  >
                    <MoveDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteClause(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <textarea
                className="input min-h-[150px] font-mono text-sm"
                value={clause.content}
                onChange={(e) => updateClause(index, 'content', e.target.value)}
                placeholder="条項の内容を入力してください。変数は {{変数名}} の形式で使用できます。"
              />
              
              <div className="mt-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={clause.isRequired}
                    onChange={(e) => updateClause(index, 'isRequired', e.target.checked)}
                  />
                  <span className="text-sm">必須条項</span>
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}