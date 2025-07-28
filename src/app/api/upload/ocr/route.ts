import { NextRequest, NextResponse } from 'next/server';
import { azureComputerVision } from '@/lib/ocr/azure-cv';
import { rateLimiter } from '@/lib/db/kv';
import { ERROR_MESSAGES, SUCCESS_MESSAGES, MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from '@/lib/utils/constants';

// POST /api/upload/ocr - Upload image and perform OCR
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const { allowed } = await rateLimiter.checkLimit(`upload:${ip}`, 10, 300);
    
    if (!allowed) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.RATE_LIMIT },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'ファイルが選択されていません' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedImageTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/tiff',
      'image/bmp',
    ];

    if (!allowedImageTypes.includes(file.type)) {
      return NextResponse.json(
        { error: '画像ファイル（JPEG、PNG、TIFF、BMP）のみ対応しています' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.FILE_TOO_LARGE },
        { status: 400 }
      );
    }

    // Convert file to base64
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    // Perform OCR
    const ocrResult = await azureComputerVision.extractTextFromBase64(base64);

    // Check if it's likely a contract document
    const isContract = detectContractDocument(ocrResult.text);

    // Extract key information if it's a contract
    let contractInfo = null;
    if (isContract) {
      contractInfo = extractContractInfo(ocrResult.text);
    }

    return NextResponse.json({
      success: true,
      text: ocrResult.text,
      confidence: ocrResult.confidence,
      language: ocrResult.language,
      lineCount: ocrResult.lines.length,
      isContract,
      contractInfo,
      message: SUCCESS_MESSAGES.OCR_COMPLETE,
    });
  } catch (error) {
    console.error('OCR upload error:', error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.OCR_SERVICE_ERROR },
      { status: 500 }
    );
  }
}

// Helper function to detect if text is likely a contract
function detectContractDocument(text: string): boolean {
  const contractKeywords = [
    '契約書',
    '契約',
    '甲',
    '乙',
    '第1条',
    '第一条',
    '契約期間',
    '契約条件',
    '業務委託',
    '秘密保持',
    '売買',
    '賃貸借',
    '雇用',
    'Agreement',
    'Contract',
    'Terms',
  ];

  const lowerText = text.toLowerCase();
  let keywordCount = 0;

  for (const keyword of contractKeywords) {
    if (lowerText.includes(keyword.toLowerCase())) {
      keywordCount++;
    }
  }

  // Consider it a contract if it contains at least 3 contract-related keywords
  return keywordCount >= 3;
}

// Helper function to extract contract information
function extractContractInfo(text: string): {
  title?: string;
  parties?: string[];
  date?: string;
  articles?: string[];
} {
  const info: any = {};

  // Extract title (usually at the beginning)
  const titleMatch = text.match(/^(.{1,100}契約書.*?)[\n\r]/m);
  if (titleMatch) {
    info.title = titleMatch[1].trim();
  }

  // Extract parties (甲/乙 pattern)
  const parties: string[] = [];
  const partyMatches = text.matchAll(/[甲乙]\s*[:：]\s*(.+?)[\n\r]/g);
  for (const match of partyMatches) {
    parties.push(match[1].trim());
  }
  if (parties.length > 0) {
    info.parties = parties;
  }

  // Extract date
  const dateMatch = text.match(/(\d{4}年\d{1,2}月\d{1,2}日)/);
  if (dateMatch) {
    info.date = dateMatch[1];
  }

  // Extract article headers
  const articles: string[] = [];
  const articleMatches = text.matchAll(/第\d+条\s*[（(](.+?)[）)]/g);
  for (const match of articleMatches) {
    articles.push(match[1].trim());
  }
  if (articles.length > 0) {
    info.articles = articles;
  }

  return info;
}