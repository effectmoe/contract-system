import { NextRequest, NextResponse } from 'next/server';
import { ContractTemplate } from '@/types/template';
import { getKVStore } from '@/lib/db/kv';
import { sampleTemplates } from '@/lib/db/template-store';

// Force rebuild: 2025-07-30-05:40
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  // Always use sample templates for now
  const template = sampleTemplates.find(t => t.templateId === id);
  
  if (!template) {
    return NextResponse.json({
      success: false,
      error: 'Template not found in sample data',
      requestedId: id,
      availableTemplates: sampleTemplates.map(t => ({ id: t.templateId, name: t.name }))
    }, { status: 404 });
  }
  
  return NextResponse.json({
    success: true,
    data: template,
    isDemo: true
  });
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