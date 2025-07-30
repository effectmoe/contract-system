import { NextRequest, NextResponse } from 'next/server';
import { ContractTemplate } from '@/types/template';
import { getKVStore } from '@/lib/db/kv';
import { demoTemplateStore, sampleTemplates } from '@/lib/db/template-store';

export async function GET(request: NextRequest) {
  try {
    const kv = await getKVStore();
    
    // Check if KV is available
    const kvUrl = process.env.KV_REST_API_URL;
    const kvToken = process.env.KV_REST_API_TOKEN;
    const isKVConfigured = kvUrl && kvToken && !kvUrl.includes('your-kv-instance') && kvUrl !== 'demo-mode';
    
    if (!isKVConfigured) {
      // Demo mode - use in-memory storage (already initialized)
      return NextResponse.json({ 
        success: true, 
        data: demoTemplateStore.getAll(),
        isDemo: true 
      });
    }
    
    // Production mode - use KV store
    const templates = await kv.get<ContractTemplate[]>('templates');

    // Initialize with sample templates if none exist
    if (!templates || templates.length === 0) {
      await kv.set('templates', sampleTemplates);
      return NextResponse.json({ 
        success: true, 
        data: sampleTemplates 
      });
    }

    return NextResponse.json({ 
      success: true, 
      data: templates 
    });
  } catch (error) {
    console.error('Failed to fetch templates:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const kv = await getKVStore();
    
    const newTemplate: ContractTemplate = {
      ...body,
      templateId: body.templateId || `template-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: body.isActive !== false
    };

    // Check if KV is available
    const kvUrl = process.env.KV_REST_API_URL;
    const kvToken = process.env.KV_REST_API_TOKEN;
    const isKVConfigured = kvUrl && kvToken && !kvUrl.includes('your-kv-instance') && kvUrl !== 'demo-mode';
    
    if (!isKVConfigured) {
      // Demo mode - use in-memory storage
      demoTemplateStore.add(newTemplate);
      return NextResponse.json({ 
        success: true, 
        data: newTemplate,
        isDemo: true 
      });
    }

    // Production mode - use KV store
    const templates = await kv.get<ContractTemplate[]>('templates') || [];
    templates.push(newTemplate);
    await kv.set('templates', templates);

    return NextResponse.json({ 
      success: true, 
      data: newTemplate 
    });
  } catch (error) {
    console.error('Failed to create template:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create template' },
      { status: 500 }
    );
  }
}