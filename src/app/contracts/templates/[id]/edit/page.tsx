'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Save, X, Plus, Trash2, MoveUp, MoveDown,
  FileText, Tag, Info, Variable, Eye, EyeOff,
  Maximize2, Minimize2, RotateCw
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
  
  // Preview state
  const [showPreview, setShowPreview] = useState(true);
  const [previewValues, setPreviewValues] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState<'basic' | 'variables' | 'clauses'>('basic');
  const [previewMode, setPreviewMode] = useState<'split' | 'fullscreen'>('split');

  useEffect(() => {
    fetchTemplate();
  }, [templateId]);

  // テンプレートがロードされたらデフォルト値を更新（初回のみ）
  const [hasInitialized, setHasInitialized] = useState(false);
  useEffect(() => {
    if (template && !loading && !hasInitialized) {
      // 初回ロード時のみ実行
      const timer = setTimeout(() => {
        updateVariableDefaultsFromContent();
        setHasInitialized(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [template, loading, hasInitialized]);

  // 契約書文面から甲乙の社名を抽出する関数
  const extractPartiesFromContent = (content: string): { disclosingParty?: string; receivingParty?: string } => {
    const result: { disclosingParty?: string; receivingParty?: string } = {};
    
    // 甲：から始まる行を探す
    const disclosingMatch = content.match(/甲[：:：]\s*(.+?)(?:\n|$)/);
    if (disclosingMatch && disclosingMatch[1]) {
      result.disclosingParty = disclosingMatch[1].trim();
    }
    
    // 乙：から始まる行を探す
    const receivingMatch = content.match(/乙[：:：]\s*(.+?)(?:\n|$)/);
    if (receivingMatch && receivingMatch[1]) {
      result.receivingParty = receivingMatch[1].trim();
    }
    
    // 開示者：受領者：パターンも検索
    const discloserMatch = content.match(/開示者[：:：]\s*(.+?)(?:\n|$)/);
    if (!result.disclosingParty && discloserMatch && discloserMatch[1]) {
      result.disclosingParty = discloserMatch[1].trim();
    }
    
    const recipientMatch = content.match(/受領者[：:：]\s*(.+?)(?:\n|$)/);
    if (!result.receivingParty && recipientMatch && recipientMatch[1]) {
      result.receivingParty = recipientMatch[1].trim();
    }
    
    return result;
  };

  useEffect(() => {
    // Initialize preview values with default values
    if (template) {
      const defaults: Record<string, any> = {};
      
      // 契約書文面から甲乙の社名を抽出
      const allClauses = template.content.clauses
        .map(clause => clause.content)
        .join('\n');
      const extractedParties = extractPartiesFromContent(allClauses);
      
      template.variables.forEach(variable => {
        // disclosingPartyとreceivingPartyの場合は抽出した値を優先的に使用
        if (variable.name === 'disclosingParty') {
          defaults[variable.name] = extractedParties.disclosingParty || variable.defaultValue || `[${variable.displayName}]`;
        } else if (variable.name === 'receivingParty') {
          defaults[variable.name] = extractedParties.receivingParty || variable.defaultValue || `[${variable.displayName}]`;
        } else {
          defaults[variable.name] = variable.defaultValue || 
            (variable.type === 'number' ? 0 : 
             variable.type === 'date' ? new Date().toISOString().split('T')[0] : 
             `[${variable.displayName}]`);
        }
      });
      setPreviewValues(defaults);
    }
  }, [template]);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/templates/${templateId}`);
      
      if (!response.ok) {
        // Fallback to template list and find the specific template
        const listResponse = await fetch('/api/templates');
        if (listResponse.ok) {
          const listData = await listResponse.json();
          const foundTemplate = listData.data?.find((t: ContractTemplate) => t.templateId === templateId);
          if (foundTemplate) {
            setTemplate(foundTemplate);
            // デフォルト値を更新
            setTimeout(() => {
              const allClauses = foundTemplate.content.clauses
                .map((clause: any) => clause.content)
                .join('\n');
              const extractedParties = extractPartiesFromContent(allClauses);
              
              const updatedVariables = foundTemplate.variables.map((variable: any) => {
                if (variable.name === 'disclosingParty' && extractedParties.disclosingParty) {
                  return { ...variable, defaultValue: extractedParties.disclosingParty };
                } else if (variable.name === 'receivingParty' && extractedParties.receivingParty) {
                  return { ...variable, defaultValue: extractedParties.receivingParty };
                }
                return variable;
              });
              
              setTemplate({
                ...foundTemplate,
                variables: updatedVariables,
              });
            }, 0);
            return;
          }
        }
        throw new Error('テンプレートの取得に失敗しました');
      }
      
      const data = await response.json();
      setTemplate(data.data);
      
      // デフォルト値を更新
      setTimeout(() => {
        const allClauses = data.data.content.clauses
          .map((clause: any) => clause.content)
          .join('\n');
        const extractedParties = extractPartiesFromContent(allClauses);
        
        const updatedVariables = data.data.variables.map((variable: any) => {
          if (variable.name === 'disclosingParty' && extractedParties.disclosingParty) {
            return { ...variable, defaultValue: extractedParties.disclosingParty };
          } else if (variable.name === 'receivingParty' && extractedParties.receivingParty) {
            return { ...variable, defaultValue: extractedParties.receivingParty };
          }
          return variable;
        });
        
        setTemplate({
          ...data.data,
          variables: updatedVariables,
        });
      }, 0);
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

  // 条項が更新されたときに甲乙の社名を再抽出してデフォルト値を更新
  const updateVariableDefaultsFromContent = () => {
    if (!template) return;
    
    const allClauses = template.content.clauses
      .map(clause => clause.content)
      .join('\n');
    const extractedParties = extractPartiesFromContent(allClauses);
    
    const updatedVariables = template.variables.map(variable => {
      if (variable.name === 'disclosingParty' && extractedParties.disclosingParty) {
        return { ...variable, defaultValue: extractedParties.disclosingParty };
      } else if (variable.name === 'receivingParty' && extractedParties.receivingParty) {
        return { ...variable, defaultValue: extractedParties.receivingParty };
      }
      return variable;
    });
    
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

  const renderPreview = () => {
    if (!template) return null;

    const replaceVariables = (text: string) => {
      let result = text;
      template.variables.forEach(variable => {
        const value = previewValues[variable.name] || `[${variable.displayName}]`;
        const regex = new RegExp(`\\{\\{\\s*${variable.name}\\s*\\}\\}`, 'g');
        result = result.replace(regex, value);
      });
      return result;
    };

    return (
      <div className="prose max-w-none">
        <h1 className="text-2xl font-bold mb-6">{template.content.title}</h1>
        
        {template.content.clauses.map((clause, index) => (
          <div key={clause.id} className="mb-6">
            <h3 className="text-lg font-semibold mb-2">
              第{index + 1}条（{clause.title}）
            </h3>
            <div className="whitespace-pre-wrap text-gray-700">
              {replaceVariables(clause.content)}
            </div>
          </div>
        ))}
      </div>
    );
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
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white shadow-sm border-b mb-6">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">テンプレート編集</h1>
            <div className="flex gap-4">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="btn-secondary flex items-center gap-2"
              >
                {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showPreview ? 'プレビューを隠す' : 'プレビューを表示'}
              </button>
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
        </div>
      </div>

      <div className={`container mx-auto px-4 py-6 ${showPreview ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : ''}`}>
        {/* Editor Panel */}
        <div className={showPreview ? '' : 'max-w-4xl mx-auto'}>
          {/* Tab Navigation */}
          <div className="bg-white rounded-lg shadow mb-4">
            <div className="border-b">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('basic')}
                  className={`px-6 py-3 text-sm font-medium ${
                    activeTab === 'basic'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  基本情報
                </button>
                <button
                  onClick={() => setActiveTab('variables')}
                  className={`px-6 py-3 text-sm font-medium ${
                    activeTab === 'variables'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  変数設定
                </button>
                <button
                  onClick={() => setActiveTab('clauses')}
                  className={`px-6 py-3 text-sm font-medium ${
                    activeTab === 'clauses'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  条項編集
                </button>
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-lg shadow">
            {activeTab === 'basic' && (
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  基本情報
                </h2>
                
                <div className="space-y-4">
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
                  
                  <div>
                    <label className="label">説明</label>
                    <textarea
                      className="input min-h-[100px]"
                      value={template.description || ''}
                      onChange={(e) => setTemplate({ ...template, description: e.target.value })}
                    />
                  </div>
                  
                  <div>
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
            )}

            {activeTab === 'variables' && (
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Variable className="w-5 h-5" />
                    変数設定
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="label text-sm">変数名（システム内部用）</label>
                          <input
                            type="text"
                            className="input"
                            value={variable.name}
                            onChange={(e) => updateVariable(index, 'name', e.target.value)}
                            placeholder="例: companyName"
                          />
                        </div>
                        
                        <div>
                          <label className="label text-sm">表示名（ユーザー向け）</label>
                          <input
                            type="text"
                            className="input"
                            value={variable.displayName}
                            onChange={(e) => updateVariable(index, 'displayName', e.target.value)}
                            placeholder="例: 会社名"
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
                        
                        <div>
                          <label className="label text-sm">デフォルト値</label>
                          <input
                            type="text"
                            className="input"
                            value={variable.defaultValue || ''}
                            onChange={(e) => updateVariable(index, 'defaultValue', e.target.value)}
                          />
                          {(variable.name === 'disclosingParty' || variable.name === 'receivingParty') && (
                            <p className="text-xs text-gray-500 mt-1">
                              契約書文面から自動的に抽出されます
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center mt-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={variable.required}
                            onChange={(e) => updateVariable(index, 'required', e.target.checked)}
                          />
                          <span className="text-sm">必須項目</span>
                        </label>
                        
                        <button
                          onClick={() => deleteVariable(index)}
                          className="btn-secondary text-red-600 hover:bg-red-50 flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          削除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'clauses' && (
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    条項編集
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
                          className="input flex-1 text-lg font-semibold"
                          value={clause.title}
                          onChange={(e) => updateClause(index, 'title', e.target.value)}
                          placeholder="条項タイトル"
                        />
                        
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => moveClause(index, 'up')}
                            disabled={index === 0}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
                            title="上に移動"
                          >
                            <MoveUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => moveClause(index, 'down')}
                            disabled={index === template.content.clauses.length - 1}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
                            title="下に移動"
                          >
                            <MoveDown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteClause(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                            title="削除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <textarea
                        className="input min-h-[120px] font-mono text-sm"
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
            )}
          </div>
        </div>

        {/* Preview Panel */}
        {showPreview && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-gray-100 px-6 py-4 border-b">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Eye className="w-5 h-5" />
                プレビュー
              </h2>
            </div>
            
            {/* Preview Values Input */}
            <div className="p-6 border-b bg-gray-50">
              <h3 className="text-sm font-medium text-gray-700 mb-3">プレビュー用の値を入力</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {template.variables.map((variable) => (
                  <div key={variable.name}>
                    <label className="text-sm text-gray-600">{variable.displayName}</label>
                    <input
                      type={variable.type === 'number' ? 'number' : variable.type === 'date' ? 'date' : 'text'}
                      className="input text-sm"
                      value={previewValues[variable.name] || ''}
                      onChange={(e) => setPreviewValues({
                        ...previewValues,
                        [variable.name]: e.target.value
                      })}
                      placeholder={`${variable.displayName}を入力`}
                    />
                  </div>
                ))}
              </div>
            </div>
            
            {/* Preview Content */}
            <div className="p-6 overflow-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
              {renderPreview()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}