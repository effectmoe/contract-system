import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { z } from 'zod';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'ファイルが選択されていません' },
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'PDFファイルのみアップロード可能です' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'ファイルサイズは10MB以下にしてください' },
        { status: 400 }
      );
    }

    // Demo mode
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.log('Demo mode: PDF upload would be processed');
      return NextResponse.json({
        success: true,
        url: '/demo-pdf-url',
        filename: file.name,
        size: file.size,
        message: 'PDFをアップロードしました（デモモード）',
      });
    }

    // Upload to Vercel Blob
    const blob = await put(
      `contracts/uploads/${Date.now()}-${file.name}`,
      file,
      {
        access: 'public',
        handleUploadUrl: '/api/upload/pdf',
      }
    );

    return NextResponse.json({
      success: true,
      url: blob.url,
      filename: file.name,
      size: file.size,
      message: 'PDFをアップロードしました',
    });
  } catch (error) {
    console.error('PDF upload error:', error);
    return NextResponse.json(
      { error: 'ファイルのアップロードに失敗しました' },
      { status: 500 }
    );
  }
}