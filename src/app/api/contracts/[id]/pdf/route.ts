import { NextRequest, NextResponse } from 'next/server';
import { getContractService } from '@/lib/db/mongodb';
import { PDFGenerator } from '@/lib/pdf/generator';
import { rateLimiter } from '@/lib/db/kv';
import { ERROR_MESSAGES } from '@/lib/utils/constants';

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
    
    const contractService = await getContractService();
    const contract = await contractService['contracts'].findOne({ 
      contractId: id 
    });

    if (!contract) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.CONTRACT_NOT_FOUND },
        { status: 404 }
      );
    }

    // Check if signatures should be included
    const includeSignatures = request.nextUrl.searchParams.get('signatures') !== 'false';

    // Generate PDF
    const pdfGenerator = new PDFGenerator(contract, includeSignatures);
    const pdfBytes = await pdfGenerator.generatePDF();

    // Log PDF generation
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
    return NextResponse.json(
      { error: ERROR_MESSAGES.GENERIC },
      { status: 500 }
    );
  }
}