import { NextRequest, NextResponse } from 'next/server';
import { ContractTemplate } from '@/types/template';
import { getKVStore } from '@/lib/db/kv';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const kv = await getKVStore();
    const templates = await kv.get<ContractTemplate[]>('templates') || [];
    const template = templates.find(t => t.templateId === params.id);

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: template 
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
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const kv = await getKVStore();
    const templates = await kv.get<ContractTemplate[]>('templates') || [];
    
    const index = templates.findIndex(t => t.templateId === params.id);
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
  { params }: { params: { id: string } }
) {
  try {
    const kv = await getKVStore();
    const templates = await kv.get<ContractTemplate[]>('templates') || [];
    
    const filteredTemplates = templates.filter(t => t.templateId !== params.id);
    
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