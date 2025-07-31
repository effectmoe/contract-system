import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { z } from 'zod';
import crypto from 'crypto';
import { AccessToken } from '@/types/auth';
import { Resend } from 'resend';

const requestSchema = z.object({
  contractId: z.string(),
  partyId: z.string(),
  email: z.string().email(),
  name: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    console.log('Send magic link API called');
    const body = await request.json();
    console.log('Request body:', body);
    const { contractId, partyId, email, name } = requestSchema.parse(body);
    console.log('Parsed data:', { contractId, partyId, email, name });

    // Demo mode
    if (!process.env.MONGODB_URI) {
      console.log('Running in demo mode - Magic link would be sent to', email);
      const demoLink = `/contracts/view?token=demo-token-${contractId}-${partyId}`;
      console.log('Generated demo link:', demoLink);
      return NextResponse.json({
        success: true,
        message: 'メールを送信しました（デモモード）',
        demoLink: demoLink,
      });
    }

    const { db } = await connectToDatabase();

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Save access token
    const accessToken: AccessToken = {
      token,
      email,
      contractId,
      partyId,
      expiresAt,
      used: false,
      createdAt: new Date(),
    };

    await db.collection<AccessToken>('access_tokens').insertOne(accessToken);

    // Get contract details for email
    const contract = await db.collection('contracts').findOne({ contractId });
    
    // In production, send email via service like SendGrid/AWS SES
    const magicLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/contracts/view?token=${token}`;
    
    console.log('Magic link generated:', magicLink);

    // Resendを使用してメール送信
    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        
        const { data, error: resendError } = await resend.emails.send({
          from: 'Contract System <onboarding@resend.dev>',
          to: [email],
          subject: `契約書「${contract?.title || 'タイトル未設定'}」の確認依頼`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f8f9fa; }
                .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>契約書の確認依頼</h1>
                </div>
                <div class="content">
                  <p>${name}様</p>
                  <p>契約書「<strong>${contract?.title || 'タイトル未設定'}</strong>」の確認依頼が届いています。</p>
                  <p>以下のボタンをクリックして、契約書の内容を確認し、電子署名を行ってください。</p>
                  <p style="text-align: center;">
                    <a href="${magicLink}" class="button">契約書を確認する</a>
                  </p>
                  <p><small>このリンクは24時間有効です。期限を過ぎた場合は、送信者に再送を依頼してください。</small></p>
                </div>
                <div class="footer">
                  <p>このメールは電子契約システムから自動送信されています。</p>
                  <p>© 2025 Contract System by tonychustudio</p>
                </div>
              </div>
            </body>
            </html>
          `,
        });

        if (resendError) {
          console.error('Resend error:', resendError);
          // Resendエラーでもデモモードとして継続
        } else {
          console.log('Email sent successfully:', data);
        }
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        // メール送信エラーでもシステムは継続
      }
    }

    return NextResponse.json({
      success: true,
      message: 'アクセスリンクをメールで送信しました',
    });
  } catch (error) {
    console.error('Send magic link error:', error);
    
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors);
      return NextResponse.json(
        { error: 'リクエストデータが不正です', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'リンクの送信に失敗しました', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}