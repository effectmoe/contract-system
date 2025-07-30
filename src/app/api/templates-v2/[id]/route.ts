import { NextRequest, NextResponse } from 'next/server';
import { sampleTemplates } from '@/lib/db/template-store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  const template = sampleTemplates.find(t => t.templateId === id);
  
  if (!template) {
    return NextResponse.json({
      success: false,
      error: 'Template not found in v2',
      requestedId: id,
      availableIds: sampleTemplates.map(t => t.templateId)
    }, { status: 404 });
  }
  
  return NextResponse.json({
    success: true,
    data: template,
    version: 'v2'
  });
}