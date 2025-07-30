'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  FileText, Plus, X, User, Building, Mail, 
  AlertCircle, Save, Send, Upload, ArrowLeft, Settings
} from 'lucide-react';
import { ContractType, ContractParty } from '@/types/contract';
import { ContractTemplate } from '@/types/template';
import { 
  CONTRACT_TYPE_LABELS, 
  SUCCESS_MESSAGES, 
  ERROR_MESSAGES,
  DEFAULT_TEMPLATES 
} from '@/lib/utils/constants';
import PDFImporter from './PDFImporter';

// Form validation schema
const contractSchema = z.object({
  title: z.string().min(1, '契約書名を入力してください'),
  type: z.enum([
    'service_agreement',
    'design_agreement',
    'nda',
    'employment',
    'sales',
    'lease',
    'partnership',
    'other'
  ]),
  description: z.string().optional(),
  content: z.string().min(1, '契約内容を入力してください'),
  clientName: z.string().min(1, '相手方の名前を入力してください'),
  clientEmail: z.string().email('有効なメールアドレスを入力してください'),
  clientCompany: z.string().optional(),
});

type ContractFormData = z.infer<typeof contractSchema>;

export default function ContractCreator() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ContractType | null>(null);
  const [customTemplates, setCustomTemplates] = useState<ContractTemplate[]>([]);
  const [selectedCustomTemplate, setSelectedCustomTemplate] = useState<ContractTemplate | null>(null);
  const [mode, setMode] = useState<'select' | 'manual' | 'pdf'>('select');
  const [importedData, setImportedData] = useState<{
    filename: string;
    extractedText: string;
    pdfUrl: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      type: 'service_agreement',
      content: '',
    },
  });

  const contractType = watch('type');

  // Fetch custom templates
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch('/api/templates');
        const data = await response.json();
        if (data.success && data.data) {
          setCustomTemplates(data.data.filter((t: ContractTemplate) => t.isActive));
        }
      } catch (error) {
        console.error('Failed to fetch templates:', error);
      }
    };
    fetchTemplates();
  }, []);

  const handleTemplateSelect = (type: ContractType) => {
    setSelectedTemplate(type);
    setValue('type', type);
    
    // Load template content
    const template = DEFAULT_TEMPLATES[type.toUpperCase() as keyof typeof DEFAULT_TEMPLATES];
    if (template) {
      setValue('title', template.title);
      setValue('content', generateTemplateContent(type));
    }
  };

  const handleCustomTemplateSelect = (template: ContractTemplate) => {
    setSelectedCustomTemplate(template);
    setValue('title', template.content.title);
    
    // Generate content from template clauses
    let content = template.content.title + '\n\n';
    template.content.clauses
      .sort((a, b) => a.order - b.order)
      .forEach((clause) => {
        content += `${clause.title}\n${clause.content}\n\n`;
      });
    
    setValue('content', content);
    setMode('manual');
  };

  const generateTemplateContent = (type: ContractType): string => {
    // Generate basic template content based on contract type
    const templates: Record<ContractType, string> = {
      service_agreement: `業務委託契約書

甲（委託者）：${process.env.NEXT_PUBLIC_CONTRACTOR_NAME || '株式会社サンプル'}
乙（受託者）：[相手方名]

第1条（業務内容）
甲は乙に対し、以下の業務を委託し、乙はこれを受託する。
[業務内容を記載]

第2条（契約期間）
本契約の有効期間は、契約締結日から[期間]とする。

第3条（報酬）
甲は乙に対し、本業務の対価として[金額]円を支払う。

第4条（支払条件）
[支払条件を記載]

以上、本契約の成立を証するため、本書2通を作成し、甲乙記名押印の上、各1通を保有する。`,

      design_agreement: `デザイン制作契約書

発注者：${process.env.NEXT_PUBLIC_CONTRACTOR_NAME || '株式会社サンプル'}
受注者：[相手方名]

第1条（制作内容）
発注者は受注者に対し、以下のデザイン制作業務を委託し、受注者はこれを受託する。
[制作内容を記載]

第2条（納期）
制作物の納期は[納期]とする。

第3条（制作費）
発注者は受注者に対し、本業務の対価として[金額]円を支払う。

第4条（著作権）
制作物の著作権は、制作費の完全な支払いをもって発注者に帰属する。

第5条（修正回数）
軽微な修正は[回数]回まで無償で対応する。

以上、本契約の成立を証するため、本書2通を作成し、甲乙記名押印の上、各1通を保有する。`,
      
      nda: `秘密保持契約書

甲：${process.env.NEXT_PUBLIC_CONTRACTOR_NAME || '株式会社サンプル'}
乙：[相手方名]

第1条（秘密情報の定義）
本契約において「秘密情報」とは、甲乙間で開示される一切の情報をいう。

第2条（守秘義務）
甲及び乙は、相手方から開示された秘密情報を厳重に管理し、第三者に開示又は漏洩してはならない。

第3条（守秘義務期間）
本契約に基づく守秘義務は、本契約終了後も[期間]継続する。

第4条（例外事項）
以下の情報は秘密情報から除外される。
1. 開示時に既に公知であった情報
2. 開示後、受領者の責によらず公知となった情報

以上、本契約の成立を証するため、本書2通を作成し、甲乙記名押印の上、各1通を保有する。`,
      
      employment: `雇用契約書

会社：${process.env.NEXT_PUBLIC_CONTRACTOR_NAME || '株式会社サンプル'}
従業員：[従業員名]

第1条（職種）
[職種を記載]

第2条（勤務地）
[勤務地を記載]

第3条（給与）
基本給：月額[金額]円

第4条（勤務時間）
[勤務時間を記載]

第5条（休日）
[休日を記載]

以上の内容で雇用契約を締結する。`,
      
      sales: `売買契約書

売主：${process.env.NEXT_PUBLIC_CONTRACTOR_NAME || '株式会社サンプル'}
買主：[相手方名]

第1条（売買の目的物）
[商品・サービス名]

第2条（売買代金）
金[金額]円

第3条（引渡し）
[引渡し条件を記載]

第4条（支払方法）
[支払方法を記載]

以上、本契約の成立を証するため、本書2通を作成し、売主買主記名押印の上、各1通を保有する。`,
      
      lease: `賃貸借契約書

賃貸人：${process.env.NEXT_PUBLIC_CONTRACTOR_NAME || '株式会社サンプル'}
賃借人：[相手方名]

第1条（目的物）
[物件情報を記載]

第2条（賃料）
月額[金額]円

第3条（契約期間）
[契約期間を記載]

第4条（敷金）
[敷金額]円

以上、本契約の成立を証するため、本書2通を作成し、賃貸人賃借人記名押印の上、各1通を保有する。`,
      
      partnership: `パートナーシップ契約書

甲：${process.env.NEXT_PUBLIC_CONTRACTOR_NAME || '株式会社サンプル'}
乙：[相手方名]

第1条（目的）
甲及び乙は、[事業内容]に関して協力関係を構築する。

第2条（役割分担）
甲：[甲の役割]
乙：[乙の役割]

第3条（利益配分）
[利益配分方法を記載]

第4条（契約期間）
[契約期間を記載]

以上、本契約の成立を証するため、本書2通を作成し、甲乙記名押印の上、各1通を保有する。`,
      
      other: `契約書

甲：${process.env.NEXT_PUBLIC_CONTRACTOR_NAME || '株式会社サンプル'}
乙：[相手方名]

[契約内容を自由に記載してください]

以上、本契約の成立を証するため、本書2通を作成し、甲乙記名押印の上、各1通を保有する。`,
    };

    return templates[type] || '';
  };

  const onSubmit = async (data: ContractFormData) => {
    setLoading(true);
    setError(null);

    try {
      // Create parties array
      const parties: ContractParty[] = [
        {
          id: '1',
          type: 'contractor',
          name: process.env.NEXT_PUBLIC_CONTRACTOR_NAME || '株式会社サンプル',
          email: process.env.NEXT_PUBLIC_CONTRACTOR_EMAIL || 'contract@sample.com',
          company: process.env.NEXT_PUBLIC_CONTRACTOR_COMPANY,
          role: '甲（契約者）',
          signatureRequired: true,
        },
        {
          id: '2',
          type: 'client',
          name: data.clientName,
          email: data.clientEmail,
          company: data.clientCompany,
          role: '乙（相手方）',
          signatureRequired: true,
        },
      ];

      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: data.title,
          type: data.type,
          description: data.description,
          content: data.content,
          parties,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || ERROR_MESSAGES.GENERIC);
      }

      const contract = await response.json();
      
      // Show success message and redirect
      alert(SUCCESS_MESSAGES.CONTRACT_CREATED);
      router.push(`/contracts/${contract.contractId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.GENERIC);
    } finally {
      setLoading(false);
    }
  };

  const handlePDFImport = (data: {
    filename: string;
    extractedText: string;
    pdfUrl: string;
  }) => {
    setImportedData(data);
    setValue('title', data.filename.replace('.pdf', ''));
    setValue('content', data.extractedText);
    setMode('manual');
  };

  // Mode Selection Screen
  if (mode === 'select') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">契約書作成方法を選択</h2>
          <p className="text-gray-600 mb-8 text-center">
            新規で契約書を作成するか、既存のPDFから読み込むかを選択してください
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <button
              onClick={() => setMode('manual')}
              className="p-6 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
            >
              <FileText className="w-12 h-12 text-gray-400 group-hover:text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                新規作成
              </h3>
              <p className="text-sm text-gray-600">
                標準テンプレートから契約書を作成
              </p>
            </button>
            
            <button
              onClick={() => setMode('pdf')}
              className="p-6 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
            >
              <Upload className="w-12 h-12 text-gray-400 group-hover:text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                PDF読み込み
              </h3>
              <p className="text-sm text-gray-600">
                既存のPDFから契約書データを作成
              </p>
            </button>
            
            <a
              href="/contracts/templates"
              target="_blank"
              className="p-6 border-2 border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors group flex flex-col items-center"
            >
              <Settings className="w-12 h-12 text-gray-400 group-hover:text-purple-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                テンプレート管理
              </h3>
              <p className="text-sm text-gray-600">
                カスタムテンプレートを作成・編集
              </p>
            </a>
          </div>

          {/* Custom Templates Section */}
          {customTemplates.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                カスタムテンプレートから選択
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {customTemplates.map((template) => (
                  <button
                    key={template.templateId}
                    onClick={() => handleCustomTemplateSelect(template)}
                    className="p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                  >
                    <h4 className="font-semibold text-gray-900 mb-1">{template.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        {template.category}
                      </span>
                      <span>{template.content.clauses.length} 条項</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // PDF Import Screen
  if (mode === 'pdf') {
    return (
      <div>
        <button
          onClick={() => setMode('select')}
          className="btn-secondary mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          戻る
        </button>
        <PDFImporter
          onImportComplete={handlePDFImport}
          onCancel={() => setMode('select')}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {importedData ? `PDF読み込み: ${importedData.filename}` : '新規契約書作成'}
        </h2>
        <button
          onClick={() => setMode('select')}
          className="btn-secondary flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          作成方法を変更
        </button>
      </div>
      
      <div className="card">

        {/* Template Selection */}
        <div className="mb-6">
          <label className="label">契約書テンプレート</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(CONTRACT_TYPE_LABELS).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => handleTemplateSelect(value as ContractType)}
                className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                  contractType === value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Contract Title */}
          <div>
            <label htmlFor="title" className="label">
              契約書名 <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              {...register('title')}
              className="input"
              placeholder="例：〇〇業務委託契約書"
            />
            {errors.title && (
              <p className="error-text">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="label">
              説明・備考
            </label>
            <textarea
              id="description"
              {...register('description')}
              className="input"
              rows={2}
              placeholder="契約の概要や備考を入力"
            />
          </div>

          {/* Client Information */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              相手方情報
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="clientName" className="label">
                  名前 <span className="text-red-500">*</span>
                </label>
                <input
                  id="clientName"
                  type="text"
                  {...register('clientName')}
                  className="input"
                  placeholder="山田 太郎"
                />
                {errors.clientName && (
                  <p className="error-text">{errors.clientName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="clientEmail" className="label">
                  メールアドレス <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    id="clientEmail"
                    type="email"
                    {...register('clientEmail')}
                    className="input pl-10"
                    placeholder="yamada@example.com"
                  />
                </div>
                {errors.clientEmail && (
                  <p className="error-text">{errors.clientEmail.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label htmlFor="clientCompany" className="label">
                  会社名
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    id="clientCompany"
                    type="text"
                    {...register('clientCompany')}
                    className="input pl-10"
                    placeholder="株式会社〇〇"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contract Content */}
          <div>
            <label htmlFor="content" className="label">
              契約内容 <span className="text-red-500">*</span>
            </label>
            <textarea
              id="content"
              {...register('content')}
              className="input font-mono text-sm"
              rows={15}
              placeholder="契約内容を入力してください"
            />
            {errors.content && (
              <p className="error-text">{errors.content.message}</p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  作成中...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  下書き保存
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={() => router.push('/contracts')}
              className="btn-secondary"
            >
              キャンセル
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}