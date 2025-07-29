'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FileText, Plus, Edit2, Trash2, Copy, 
  CheckCircle, XCircle, Search, Filter, Tag
} from 'lucide-react';
import { ContractTemplate } from '@/types/template';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showNewTemplateModal, setShowNewTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ContractTemplate | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates');
      const data = await response.json();
      setTemplates(data.data || []);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('このテンプレートを削除してもよろしいですか？')) return;

    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTemplates(templates.filter(t => t.templateId !== templateId));
      }
    } catch (error) {
      console.error('Failed to delete template:', error);
      alert('テンプレートの削除に失敗しました');
    }
  };

  const handleDuplicateTemplate = async (template: ContractTemplate) => {
    try {
      const duplicatedTemplate = {
        ...template,
        name: `${template.name} (コピー)`,
        templateId: `template-${Date.now()}`,
        _id: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicatedTemplate),
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates([...templates, data.data]);
      }
    } catch (error) {
      console.error('Failed to duplicate template:', error);
      alert('テンプレートの複製に失敗しました');
    }
  };

  const handleToggleActive = async (template: ContractTemplate) => {
    try {
      const response = await fetch(`/api/templates/${template.templateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !template.isActive }),
      });

      if (response.ok) {
        setTemplates(templates.map(t => 
          t.templateId === template.templateId 
            ? { ...t, isActive: !t.isActive }
            : t
        ));
      }
    } catch (error) {
      console.error('Failed to toggle template status:', error);
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = searchQuery === '' || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const getUniqueCategories = () => {
    const categories = templates.map(t => t.category).filter(Boolean);
    return [...new Set(categories)];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">契約書テンプレート管理</h1>
        <Link
          href="/contracts/templates/new"
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新規テンプレート作成
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="テンプレート名、説明、タグで検索..."
              className="input pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            className="input w-full md:w-48"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">すべてのカテゴリ</option>
            {getUniqueCategories().map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">テンプレートが見つかりませんでした</p>
          <Link
            href="/contracts/templates/new"
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            新規テンプレート作成
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div
              key={template.templateId}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {template.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {template.description || 'No description'}
                  </p>
                </div>
                <div className="ml-4">
                  {template.isActive ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                  <span className="bg-gray-100 px-2 py-1 rounded">
                    {template.category}
                  </span>
                  <span>
                    {template.content.clauses.length} 条項
                  </span>
                  <span>
                    {template.variables.length} 変数
                  </span>
                </div>
                {template.tags && template.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {template.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/contracts/templates/${template.templateId}/edit`}
                  className="flex-1 btn-secondary flex items-center justify-center gap-1 text-sm"
                >
                  <Edit2 className="w-3 h-3" />
                  編集
                </Link>
                <button
                  onClick={() => handleDuplicateTemplate(template)}
                  className="flex-1 btn-secondary flex items-center justify-center gap-1 text-sm"
                >
                  <Copy className="w-3 h-3" />
                  複製
                </button>
                <button
                  onClick={() => handleToggleActive(template)}
                  className={`px-3 py-2 rounded text-sm ${
                    template.isActive
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {template.isActive ? '無効化' : '有効化'}
                </button>
                <button
                  onClick={() => handleDeleteTemplate(template.templateId)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}