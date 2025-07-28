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
      pdfBytes = await generateDemoPDF(contract);
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
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${contract.contractId}.pdf"`,
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