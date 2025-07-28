import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import pdf2pic from 'pdf2pic';
import { ComputerVisionClient } from '@azure/cognitiveservices-computervision';
import { ApiKeyCredentials } from '@azure/ms-rest-js';

const requestSchema = z.object({
  pdfUrl: z.string().url(),
  filename: z.string(),
});

async function extractTextFromPDF(pdfUrl: string): Promise<string> {
  try {
    // Demo mode
    if (!process.env.AZURE_COMPUTER_VISION_KEY) {
      console.log('Demo mode: OCR processing would be performed on:', pdfUrl);
      return `【デモモード - OCR結果】

契約書

第1条（目的）
この契約は、甲と乙の間における業務委託について定めるものである。

第2条（業務内容）
乙は甲に対し、以下の業務を提供するものとする：
1. システム開発業務
2. 保守・運用業務
3. その他甲が指定する業務

第3条（契約期間）
この契約の有効期間は、2024年1月1日から2024年12月31日までとする。

第4条（報酬）
甲は乙に対し、月額500,000円の報酬を支払うものとする。

第5条（守秘義務）
両当事者は、本契約に関連して知り得た相手方の機密情報を第三者に開示してはならない。

以上

※これはデモモードで生成されたサンプルテキストです。実際のOCR処理を行うには、Azure Computer Vision APIの設定が必要です。`;
    }

    // Initialize Azure Computer Vision client
    const key = process.env.AZURE_COMPUTER_VISION_KEY!;
    const endpoint = process.env.AZURE_COMPUTER_VISION_ENDPOINT!;
    
    const computerVisionClient = new ComputerVisionClient(
      new ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': key } }),
      endpoint
    );

    // Convert PDF to images
    const convert = pdf2pic.fromURL(pdfUrl, {
      density: 200,
      saveFilename: 'page',
      savePath: '/tmp',
      format: 'png',
      width: 2000,
      height: 2000,
    });

    const results = await convert.bulk(-1, { responseType: 'buffer' });
    
    let extractedText = '';

    // Process each page
    for (const result of results) {
      if (result.buffer) {
        // Perform OCR on the image
        const ocrResult = await computerVisionClient.readInStream(
          () => Promise.resolve(result.buffer),
          {
            language: 'ja', // Japanese
          }
        );

        // Get operation ID from the operation URL
        const operationId = ocrResult.operationLocation!.split('/').slice(-1)[0];

        // Poll for the result
        let readResult;
        do {
          readResult = await computerVisionClient.getReadResult(operationId);
          if (readResult.status === 'notStarted' || readResult.status === 'running') {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } while (readResult.status === 'notStarted' || readResult.status === 'running');

        if (readResult.status === 'succeeded') {
          // Extract text from the result
          for (const page of readResult.analyzeResult!.readResults!) {
            for (const line of page.lines!) {
              extractedText += line.text + '\n';
            }
          }
        }
      }
    }

    return extractedText.trim();
  } catch (error) {
    console.error('OCR processing error:', error);
    throw new Error('OCR処理に失敗しました');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pdfUrl, filename } = requestSchema.parse(body);

    console.log(`Starting OCR processing for: ${filename}`);

    const extractedText = await extractTextFromPDF(pdfUrl);

    if (!extractedText) {
      return NextResponse.json(
        { error: 'PDFから文字を抽出できませんでした' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      text: extractedText,
      filename,
      message: 'OCR処理が完了しました',
    });
  } catch (error) {
    console.error('PDF OCR error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'OCR処理に失敗しました',
      },
      { status: 500 }
    );
  }
}