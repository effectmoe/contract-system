import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Contract } from '@/types/contract';
import { CompletionCertificate } from '@/types/certificate';
import { createCertificateFromContract } from '@/lib/utils/certificateGenerator';
import { generateCertificateHTML, generateCertificatePDFOptions } from '@/lib/utils/certificatePDFTemplate';
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
      
      // Create demo certificate
      const demoCertificate: CompletionCertificate = {
        certificateId: 'demo-cert-123456',
        contractId,
        contractTitle: 'デモ契約書',
        contractManagementNumber: contractId,
        signatureType: 'electronic_signature',
        authType: 'email_auth',
        timestampDate: new Date(),
        parties: [
          {
            id: 'party1',
            type: 'sender',
            name: 'テスト送信者',
            email: 'sender@example.com',
            company: 'テスト会社',
            authMethod: 'Eメール認証',
            signedAt: new Date('2024-12-01T10:00:00Z'),
          },
          {
            id: 'party2',
            type: 'receiver',
            name: 'テスト受信者',
            email: 'receiver@example.com',
            company: 'テスト受信者会社',
            authMethod: 'Eメール認証',
            signedAt: new Date('2024-12-01T11:00:00Z'),
            inputInfo: {
              name: 'テスト受信者',
              address: '東京都渋谷区テスト1-2-3',
              company: 'テスト受信者会社',
            },
          },
        ],
        issuedAt: new Date(),
        issuedBy: '電子契約システム（デモ）',
        issuerCompany: 'tonychustudio',
        certificateHash: 'demo-hash-' + Date.now(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return NextResponse.json({
        success: true,
        certificate: demoCertificate,
        pdfUrl: '/demo-certificate-url',
        message: '証明書を生成しました（デモモード）',
      });
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
    const { id: contractId } = await params;

    // Demo mode
    if (!process.env.MONGODB_URI) {
      return NextResponse.json({
        success: false,
        error: 'デモモードでは証明書の取得はできません',
      });
    }

    const { db } = await connectToDatabase();

    // 証明書を取得
    const certificate = await db.collection<CompletionCertificate>('certificates').findOne({
      contractId,
    });

    if (!certificate) {
      return NextResponse.json(
        { error: '証明書が見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      certificate,
    });
  } catch (error) {
    console.error('Certificate fetch error:', error);
    return NextResponse.json(
      { error: '証明書の取得に失敗しました' },
      { status: 500 }
    );
  }
}