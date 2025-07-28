import { Contract } from '@/types/contract';
import { generateContractHTML } from './contract-html-generator';
import { config } from '../config/env';

// Vercel環境用の設定 - これらのメソッドは最新版では使用しない

export async function generateContractPDFWithPuppeteer(
  contract: Contract, 
  includeSignatures: boolean = true
): Promise<Buffer> {
  // デモモードの場合は軽量なデモPDFを返す
  if (config.isDemo) {
    return generateDemoPDF(contract);
  }
  
  let browser = null;
  
  try {
    console.log('Starting PDF generation for contract:', contract.contractId);
    
    // 開発環境とVercel環境で異なる設定
    if (process.env.NODE_ENV === 'development') {
      console.log('Using local Puppeteer for development');
      // ローカル開発環境 - 動的インポート
      const puppeteerLocal = await import('puppeteer');
      browser = await puppeteerLocal.default.launch({
        headless: true,
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
    } else {
      console.log('Using Vercel Chromium for production');
      // Vercel環境 - 動的インポート
      const [chromium, puppeteer] = await Promise.all([
        import('@sparticuz/chromium'),
        import('puppeteer-core')
      ]);
      
      browser = await puppeteer.default.launch({
        args: chromium.default.args,
        executablePath: await chromium.default.executablePath(),
        headless: true,
      });
    }

    console.log('Browser launched successfully');
    const page = await browser.newPage();
    
    // ページサイズをA4に設定
    await page.setViewport({ width: 794, height: 1123 });
    
    // HTMLコンテンツを生成
    console.log('Generating HTML content');
    const htmlContent = generateContractHTML(contract, includeSignatures);
    
    // HTMLを設定
    console.log('Setting page content');
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    // フォントが読み込まれるまで少し待機
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Generating PDF');
    // PDFを生成（日本語も正しく表示される）
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      },
      timeout: 30000
    });
    
    console.log('PDF generated successfully, size:', pdfBuffer.length, 'bytes');
    return Buffer.from(pdfBuffer);
    
  } catch (error) {
    console.error('PDF generation error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      contractId: contract.contractId,
      environment: process.env.NODE_ENV
    });
    throw new Error(`PDF生成に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    if (browser) {
      console.log('Closing browser');
      await browser.close();
    }
  }
}

// デモモード用の簡易PDF生成（実際のPuppeteerを使わない）
export async function generateDemoPDF(contract: Contract): Promise<Buffer> {
  console.log('Generating demo PDF for contract:', contract.contractId);
  
  const htmlContent = generateContractHTML(contract, true);
  
  // デモ用の簡単なPDFコンテンツ（HTMLテキスト）
  const demoText = `
PDF Demo Mode - Contract: ${contract.title}
Contract ID: ${contract.contractId}
Created: ${new Date(contract.createdAt).toLocaleDateString('ja-JP')}

This is a demo PDF. In production mode, a full PDF would be generated using Puppeteer.

Contract Content:
${contract.content}

Generated at: ${new Date().toISOString()}
  `;
  
  return Buffer.from(demoText, 'utf-8');
}