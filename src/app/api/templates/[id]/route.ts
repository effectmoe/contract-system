import { NextRequest, NextResponse } from 'next/server';
import { ContractTemplate } from '@/types/template';
import { getKVStore } from '@/lib/db/kv';
import { demoTemplates, sampleTemplates } from '@/lib/db/template-store';

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
    
    let templates: ContractTemplate[] = [];
    
    if (!isKVConfigured) {
      // Demo mode - use in-memory storage
      if (demoTemplates.length === 0) {
        demoTemplates.push(...sampleTemplates);
      }
      templates = demoTemplates;
    } else {
      // Production mode - use KV store
      templates = await kv.get<ContractTemplate[]>('templates') || [];
    }
    
    const template = templates.find(t => t.templateId === id);

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
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
      { success: false, error: 'Failed to fetch template' },
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
      // Demo mode - use in-memory storage
      if (demoTemplates.length === 0) {
        demoTemplates.push(...sampleTemplates);
      }
      
      const index = demoTemplates.findIndex(t => t.templateId === id);
      if (index === -1) {
        return NextResponse.json(
          { success: false, error: 'Template not found' },
          { status: 404 }
        );
      }

      demoTemplates[index] = {
        ...demoTemplates[index],
        ...body,
        updatedAt: new Date()
      };

      return NextResponse.json({ 
        success: true, 
        data: demoTemplates[index],
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
      // Demo mode - use in-memory storage
      if (demoTemplates.length === 0) {
        demoTemplates.push(...sampleTemplates);
      }
      
      const initialLength = demoTemplates.length;
      demoTemplates = demoTemplates.filter(t => t.templateId !== id);
      
      if (demoTemplates.length === initialLength) {
        return NextResponse.json(
          { success: false, error: 'Template not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Template deleted successfully',
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