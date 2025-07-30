import { NextRequest, NextResponse } from 'next/server';
import { ContractTemplate } from '@/types/template';
import { getKVStore } from '@/lib/db/kv';

// Define templates directly here to avoid circular dependency issues
const sampleTemplates: ContractTemplate[] = [
  {
    templateId: 'nda-template',
    name: '秘密保持契約書（NDA）',
    description: '標準的な秘密保持契約書のテンプレート',
    category: 'NDA',
    content: {
      title: '秘密保持契約書',
      clauses: [
        {
          id: 'clause-1',
          title: '目的',
          content: '本契約は、{{disclosingParty}}（以下「開示者」という）が{{receivingParty}}（以下「受領者」という）に対して開示する秘密情報の取り扱いについて定めることを目的とする。',
          isRequired: true,
          order: 1,
          variables: ['disclosingParty', 'receivingParty']
        }
      ]
    },
    variables: [
      {
        id: 'disclosingParty',
        name: 'disclosingParty',
        displayName: '開示者',
        type: 'text',
        required: true
      }
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: ['秘密保持', 'NDA', '標準']
  },
  {
    templateId: 'service-agreement-template',
    name: '業務委託契約書',
    description: '標準的な業務委託契約書のテンプレート',
    category: '業務委託',
    content: {
      title: '業務委託契約書',
      clauses: [
        {
          id: 'clause-1',
          title: '委託業務',
          content: '{{client}}（以下「委託者」という）は、{{contractor}}（以下「受託者」という）に対し、次の業務を委託し、受託者はこれを受託する。',
          isRequired: true,
          order: 1,
          variables: ['client', 'contractor']
        }
      ]
    },
    variables: [
      {
        id: 'client',
        name: 'client',
        displayName: '委託者',
        type: 'text',
        required: true
      }
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: ['業務委託', '標準']
  }
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const kv = await getKVStore();
    
    // Check if KV is available
    const kvUrl = process.env.KV_REST_API_URL;
    const kvToken = process.env.KV_REST_API_TOKEN;
    const isKVConfigured = kvUrl && kvToken && !kvUrl.includes('your-kv-instance') && kvUrl !== 'demo-mode';
    
    console.log('Environment check:', { kvUrl: kvUrl ? 'SET' : 'NOT_SET', kvToken: kvToken ? 'SET' : 'NOT_SET', isKVConfigured });
    
    let templates: ContractTemplate[] = [];
    
    let template: ContractTemplate | undefined | null = null;
    
    if (!isKVConfigured) {
      // Demo mode - search directly from sample templates
      console.log('Debug: Looking for template ID:', id);
      console.log('Debug: Available templates:', sampleTemplates.map(t => t.templateId));
      template = sampleTemplates.find(t => t.templateId === id);
      console.log('Debug: Found template:', template ? 'YES' : 'NO');
    } else {
      // Production mode - use KV store
      templates = await kv.get<ContractTemplate[]>('templates') || [];
      template = templates.find(t => t.templateId === id);
    }

    if (!template) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Template not found',
          debug: {
            searchId: id,
            isKVConfigured,
            availableTemplates: !isKVConfigured ? sampleTemplates.map(t => t.templateId) : 'KV mode'
          }
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: template,
      isDemo: !isKVConfigured
    });
  } catch (error) {
    console.error('Failed to fetch template:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch template',
        detail: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const kv = await getKVStore();
    
    // Check if KV is available
    const kvUrl = process.env.KV_REST_API_URL;
    const kvToken = process.env.KV_REST_API_TOKEN;
    const isKVConfigured = kvUrl && kvToken && !kvUrl.includes('your-kv-instance') && kvUrl !== 'demo-mode';
    
    if (!isKVConfigured) {
      // Demo mode - templates are read-only, return the original
      const template = sampleTemplates.find(t => t.templateId === id);
      if (!template) {
        return NextResponse.json(
          { success: false, error: 'Template not found' },
          { status: 404 }
        );
      }
      
      const updatedTemplate = { ...template, ...body, updatedAt: new Date() };
      
      return NextResponse.json({ 
        success: true, 
        data: updatedTemplate,
        isDemo: true 
      });
    }
    
    // Production mode - use KV store
    const templates = await kv.get<ContractTemplate[]>('templates') || [];
    
    const index = templates.findIndex(t => t.templateId === id);
    if (index === -1) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    templates[index] = {
      ...templates[index],
      ...body,
      updatedAt: new Date()
    };

    await kv.set('templates', templates);

    return NextResponse.json({ 
      success: true, 
      data: templates[index] 
    });
  } catch (error) {
    console.error('Failed to update template:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update template' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const kv = await getKVStore();
    
    // Check if KV is available
    const kvUrl = process.env.KV_REST_API_URL;
    const kvToken = process.env.KV_REST_API_TOKEN;
    const isKVConfigured = kvUrl && kvToken && !kvUrl.includes('your-kv-instance') && kvUrl !== 'demo-mode';
    
    if (!isKVConfigured) {
      // Demo mode - check if template exists but don't actually delete
      const template = sampleTemplates.find(t => t.templateId === id);
      
      if (!template) {
        return NextResponse.json(
          { success: false, error: 'Template not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Template deleted successfully (demo mode)',
        isDemo: true 
      });
    }
    
    // Production mode - use KV store
    const templates = await kv.get<ContractTemplate[]>('templates') || [];
    
    const filteredTemplates = templates.filter(t => t.templateId !== id);
    
    if (filteredTemplates.length === templates.length) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    await kv.set('templates', filteredTemplates);

    return NextResponse.json({ 
      success: true, 
      message: 'Template deleted successfully' 
    });
  } catch (error) {
    console.error('Failed to delete template:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}