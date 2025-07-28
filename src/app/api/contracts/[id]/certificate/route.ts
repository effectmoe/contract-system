import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, getContractService } from '@/lib/db/mongodb';
import { Contract } from '@/types/contract';
import { CompletionCertificate } from '@/types/certificate';
import { createCertificateFromContract } from '@/lib/utils/certificateGenerator';
import { generateCertificateHTML, generateCertificatePDFOptions } from '@/lib/utils/certificatePDFTemplate';
import { generateContractPDFWithPuppeteer, generateDemoPDF } from '@/lib/pdf/puppeteer-generator';
import { rateLimiter } from '@/lib/db/kv';
import { ERROR_MESSAGES } from '@/lib/utils/constants';
import { config } from '@/lib/config/env';
import { demoContracts } from '@/lib/db/demo-data';
import puppeteer from 'puppeteer';
import { put } from '@vercel/blob';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: contractId } = await params;

    // Demo mode
    if (!process.env.MONGODB_URI) {
      console.log('Demo mode: Certificate generation would be performed for:', contractId);
      
      // デモモードでも実際にPDFを生成する
      const demoContract = demoContracts.find(c => c.contractId === contractId);
      
      if (!demoContract) {
        return NextResponse.json(
          { error: '契約書が見つかりません' },
          { status: 404 }
        );
      }

      try {
        // デモモードで証明書PDF生成
        const pdfBytes = await generateDemoPDF(demoContract, 'certificate');
        
        // PDFをBase64でエンコードしてデータURLとして返す
        const pdfBase64 = Buffer.from(pdfBytes).toString('base64');
        const pdfDataUrl = `data:application/pdf;base64,${pdfBase64}`;
        
        return NextResponse.json({
          success: true,
          certificate: {
            certificateId: 'demo-cert-' + Date.now(),
            contractId,
            contractTitle: demoContract.title,
            issuedAt: new Date(),
          },
          pdfUrl: pdfDataUrl,
          message: '証明書を生成しました（デモモード）',
        });
      } catch (pdfError) {
        console.error('Demo certificate PDF generation failed:', pdfError);
        
        // PDFエラーの場合もフォールバック応答を返す
        return NextResponse.json({
          success: true,
          certificate: {
            certificateId: 'demo-cert-fallback',
            contractId,
            contractTitle: 'デモ契約書',
            issuedAt: new Date(),
          },
          message: '証明書を生成しました（デモモード - PDFエラーのためプレースホルダー）',
        });
      }
    }

    const { db } = await connectToDatabase();

    // 契約書を取得
    const contract = await db.collection<Contract>('contracts').findOne({
      contractId,
    });

    if (!contract) {
      return NextResponse.json(
        { error: '契約書が見つかりません' },
        { status: 404 }
      );
    }

    // 契約が完了しているかチェック
    if (contract.status !== 'completed') {
      return NextResponse.json(
        { error: '契約書が完了していません。すべての当事者の署名が必要です。' },
        { status: 400 }
      );
    }

    // 既に証明書が存在するかチェック
    const existingCertificate = await db.collection<CompletionCertificate>('certificates').findOne({
      contractId,
    });

    if (existingCertificate) {
      return NextResponse.json({
        success: true,
        certificate: existingCertificate,
        message: '証明書は既に生成済みです',
      });
    }

    // 証明書を生成
    const certificate = createCertificateFromContract(contract);

    // データベースに保存
    const insertResult = await db.collection<CompletionCertificate>('certificates').insertOne(certificate);
    certificate._id = insertResult.insertedId;

    // PDFを生成してVercel Blobに保存
    let pdfUrl: string | undefined;

    try {
      const htmlContent = generateCertificateHTML(certificate);
      const pdfOptions = generateCertificatePDFOptions();

      // Puppeteerを使用してPDF生成
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf(pdfOptions);
      await browser.close();

      // Vercel Blobにアップロード
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        const blob = await put(
          `certificates/${certificate.certificateId}.pdf`,
          Buffer.from(pdfBuffer),
          {
            access: 'public',
            contentType: 'application/pdf',
          }
        );
        pdfUrl = blob.url;

        // 証明書にPDF URLを追加
        await db.collection<CompletionCertificate>('certificates').updateOne(
          { certificateId: certificate.certificateId },
          { $set: { pdfUrl } }
        );
      }
    } catch (pdfError) {
      console.error('PDF generation error:', pdfError);
      // PDF生成に失敗しても証明書データは保存済みなので続行
    }

    return NextResponse.json({
      success: true,
      certificate,
      pdfUrl,
      message: '証明書を生成しました',
    });
  } catch (error) {
    console.error('Certificate generation error:', error);
    return NextResponse.json(
      { error: '証明書の生成に失敗しました' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const { allowed } = await rateLimiter.checkLimit(`api:${ip}`, 50, 60);
    
    if (!allowed) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.RATE_LIMIT },
        { status: 429 }
      );
    }
    
    console.log('Certificate PDF generation request for contract:', id);
    
    // Demo mode対応
    const isActuallyDemo = !process.env.MONGODB_URI || process.env.MONGODB_URI === 'demo-mode' || process.env.MONGODB_URI.includes('your-cluster');
    
    let contract;
    let pdfBytes: Buffer;
    
    if (config.isDemo || isActuallyDemo) {
      console.log('Running in demo mode for certificate PDF generation');
      contract = demoContracts.find(c => c.contractId === id);
      
      if (!contract) {
        return NextResponse.json(
          { error: ERROR_MESSAGES.CONTRACT_NOT_FOUND },
          { status: 404 }
        );
      }
      
      // デモモードでは証明書PDF生成
      try {
        pdfBytes = await generateDemoPDF(contract, 'certificate');
      } catch (pdfError) {
        console.error('Demo certificate PDF generation failed:', pdfError);
        throw pdfError;
      }
    } else {
      console.log('Running in production mode for certificate PDF generation');
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

      // Puppeteerを使用した証明書PDF生成
      pdfBytes = await generateContractPDFWithPuppeteer(contract, true, 'certificate');
    }

    // Return PDF as response
    const fileName = `合意締結証明書_${contract.title}_${new Date(contract.createdAt).toISOString().split('T')[0]}.pdf`;
    const encodedFileName = encodeURIComponent(fileName);
    
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename*=UTF-8''${encodedFileName}; filename="certificate_${contract.contractId}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Failed to generate certificate PDF:', error);
    
    return NextResponse.json(
      { 
        error: '証明書PDF生成に失敗しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}