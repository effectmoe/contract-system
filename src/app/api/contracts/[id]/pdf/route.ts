import { NextRequest, NextResponse } from 'next/server';
import { getContractService } from '@/lib/db/mongodb';
import { generateContractPDFWithPuppeteer, generateDemoPDF } from '@/lib/pdf/puppeteer-generator';
import { rateLimiter } from '@/lib/db/kv';
import { ERROR_MESSAGES } from '@/lib/utils/constants';
import { config } from '@/lib/config/env';
import { demoContracts } from '@/lib/db/demo-data';

// GET /api/contracts/[id]/pdf - Generate PDF for contract
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const { allowed } = await rateLimiter.checkLimit(`api:${ip}`, 50, 60);
    
    if (!allowed) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.RATE_LIMIT },
        { status: 429 }
      );
    }

    const { id } = await params;
    
    console.log('PDF generation request for contract:', id);
    
    // Check if signatures should be included
    const includeSignatures = request.nextUrl.searchParams.get('signatures') !== 'false';
    
    // Demo mode対応
    const isActuallyDemo = !process.env.MONGODB_URI || process.env.MONGODB_URI === 'demo-mode' || process.env.MONGODB_URI.includes('your-cluster');
    
    let contract;
    let pdfBytes: Buffer;
    
    if (config.isDemo || isActuallyDemo) {
      console.log('Running in demo mode for PDF generation');
      contract = demoContracts.find(c => c.contractId === id);
      
      if (!contract) {
        return NextResponse.json(
          { error: ERROR_MESSAGES.CONTRACT_NOT_FOUND },
          { status: 404 }
        );
      }
      
      // デモモードでは簡易PDF生成
      try {
        pdfBytes = await generateDemoPDF(contract);
      } catch (pdfError) {
        console.error('Demo PDF generation failed:', pdfError);
        // フォールバック: 最小限のPDFを生成
        const minimalPdf = Buffer.from([
          0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34, 0x0A, // %PDF-1.4
          0x31, 0x20, 0x30, 0x20, 0x6F, 0x62, 0x6A, 0x0A, // 1 0 obj
          0x3C, 0x3C, 0x2F, 0x54, 0x79, 0x70, 0x65, 0x2F, 0x43, 0x61, 0x74, 0x61, 0x6C, 0x6F, 0x67, 0x2F, 0x50, 0x61, 0x67, 0x65, 0x73, 0x20, 0x32, 0x20, 0x30, 0x20, 0x52, 0x3E, 0x3E, 0x0A, // <</Type/Catalog/Pages 2 0 R>>
          0x65, 0x6E, 0x64, 0x6F, 0x62, 0x6A, 0x0A, // endobj
          0x32, 0x20, 0x30, 0x20, 0x6F, 0x62, 0x6A, 0x0A, // 2 0 obj
          0x3C, 0x3C, 0x2F, 0x54, 0x79, 0x70, 0x65, 0x2F, 0x50, 0x61, 0x67, 0x65, 0x73, 0x2F, 0x43, 0x6F, 0x75, 0x6E, 0x74, 0x20, 0x31, 0x2F, 0x4B, 0x69, 0x64, 0x73, 0x5B, 0x33, 0x20, 0x30, 0x20, 0x52, 0x5D, 0x3E, 0x3E, 0x0A, // <</Type/Pages/Count 1/Kids[3 0 R]>>
          0x65, 0x6E, 0x64, 0x6F, 0x62, 0x6A, 0x0A, // endobj
          0x33, 0x20, 0x30, 0x20, 0x6F, 0x62, 0x6A, 0x0A, // 3 0 obj
          0x3C, 0x3C, 0x2F, 0x54, 0x79, 0x70, 0x65, 0x2F, 0x50, 0x61, 0x67, 0x65, 0x2F, 0x50, 0x61, 0x72, 0x65, 0x6E, 0x74, 0x20, 0x32, 0x20, 0x30, 0x20, 0x52, 0x3E, 0x3E, 0x0A, // <</Type/Page/Parent 2 0 R>>
          0x65, 0x6E, 0x64, 0x6F, 0x62, 0x6A, 0x0A, // endobj
          0x78, 0x72, 0x65, 0x66, 0x0A, // xref
          0x30, 0x20, 0x34, 0x0A, // 0 4
          0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x36, 0x35, 0x35, 0x33, 0x35, 0x20, 0x66, 0x0A, // 0000000000 65535 f
          0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x31, 0x35, 0x20, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x6E, 0x0A, // 0000000015 00000 n
          0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x36, 0x38, 0x20, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x6E, 0x0A, // 0000000068 00000 n
          0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x31, 0x32, 0x35, 0x20, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x6E, 0x0A, // 0000000125 00000 n
          0x74, 0x72, 0x61, 0x69, 0x6C, 0x65, 0x72, 0x0A, // trailer
          0x3C, 0x3C, 0x2F, 0x53, 0x69, 0x7A, 0x65, 0x20, 0x34, 0x2F, 0x52, 0x6F, 0x6F, 0x74, 0x20, 0x31, 0x20, 0x30, 0x20, 0x52, 0x3E, 0x3E, 0x0A, // <</Size 4/Root 1 0 R>>
          0x73, 0x74, 0x61, 0x72, 0x74, 0x78, 0x72, 0x65, 0x66, 0x0A, // startxref
          0x31, 0x38, 0x32, 0x0A, // 182
          0x25, 0x25, 0x45, 0x4F, 0x46 // %%EOF
        ]);
        pdfBytes = minimalPdf;
      }
    } else {
      console.log('Running in production mode for PDF generation');
      const contractService = await getContractService();
      contract = await contractService['contracts'].findOne({ 
        contractId: id 
      });

      if (!contract) {
        return NextResponse.json(
          { error: ERROR_MESSAGES.CONTRACT_NOT_FOUND },
          { status: 404 }
        );
      }

      // Puppeteerを使用したPDF生成
      pdfBytes = await generateContractPDFWithPuppeteer(contract, includeSignatures);
    }

    // Log PDF generation (only in production mode)
    if (!config.isDemo && !isActuallyDemo) {
      const contractService = await getContractService();
      await contractService['auditLogs'].create({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        action: 'downloaded',
        performedBy: 'system', // TODO: Get from auth
        performedAt: new Date(),
        details: { 
          contractId: id,
          format: 'pdf',
          includeSignatures
        },
      });
    }

    // Return PDF as response
    // ファイル名を適切に設定（日本語タイトルと日付を含める）
    const fileName = `契約書_${contract.title}_${new Date(contract.createdAt).toISOString().split('T')[0]}.pdf`;
    const encodedFileName = encodeURIComponent(fileName);
    
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        // inline でブラウザ内表示、filename*= でUTF-8エンコーディング対応
        'Content-Disposition': `inline; filename*=UTF-8''${encodedFileName}; filename="${contract.contractId}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    console.error('PDF generation error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      environment: process.env.NODE_ENV
    });
    
    return NextResponse.json(
      { 
        error: 'PDF生成に失敗しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}