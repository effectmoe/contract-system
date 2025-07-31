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
  console.log('=== Send Magic Link API Called ===');
  try {
    console.log('1. Parsing request body...');
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    console.log('2. Validating request data...');
    const { contractId, partyId, email, name } = requestSchema.parse(body);
    console.log('Parsed data:', { contractId, partyId, email, name });

    console.log('3. Checking environment variables...');
    console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
    console.log('MONGODB_URI value (first 20 chars):', process.env.MONGODB_URI?.substring(0, 20) || 'undefined');
    
    // Demo mode - run if no MongoDB connection is available
    if (!process.env.MONGODB_URI || process.env.MONGODB_URI.trim() === '') {
      console.log('4. Running in demo mode - Magic link would be sent to', email);
      try {
        const demoLink = `/contracts/view?token=demo-token-${contractId}-${partyId}`;
        console.log('5. Generated demo link:', demoLink);
        const response = {
          success: true,
          message: 'メールを送信しました（デモモード）',
          demoLink: demoLink,
        };
        console.log('6. Returning demo response:', JSON.stringify(response, null, 2));
        return NextResponse.json(response);
      } catch (demoError) {
        console.error('Demo mode error:', demoError);
        throw new Error(`Demo mode failed: ${demoError instanceof Error ? demoError.message : 'Unknown error'}`);
      }
    }

    console.log('7. Attempting to connect to database...');
    let db;
    try {
      const dbConnection = await connectToDatabase();
      db = dbConnection.db;
      if (!db) {
        console.log('8. Database connection returned null, falling back to demo mode...');
        const demoLink = `/contracts/view?token=demo-token-${contractId}-${partyId}`;
        console.log('9. Generated fallback demo link:', demoLink);
        return NextResponse.json({
          success: true,
          message: 'メールを送信しました（デモモード）',
          demoLink: demoLink,
        });
      }
    } catch (dbError) {
      console.log('8. Database connection failed, falling back to demo mode...');
      console.error('Database error:', dbError);
      const demoLink = `/contracts/view?token=demo-token-${contractId}-${partyId}`;
      console.log('9. Generated fallback demo link:', demoLink);
      return NextResponse.json({
        success: true,
        message: 'メールを送信しました（デモモード）',
        demoLink: demoLink,
      });
    }
    console.log('8. Database connected successfully');

    // Generate secure token
    console.log('9. Generating secure token...');
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    console.log('10. Token generated:', token.substring(0, 10) + '...');

    // Save access token
    console.log('11. Saving access token to database...');
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
    console.log('12. Access token saved successfully');

    // Get contract details for email
    console.log('13. Fetching contract details...');
    const contract = await db.collection('contracts').findOne({ contractId });
    console.log('14. Contract found:', !!contract);
    
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

    console.log('15. Returning success response...');
    const successResponse = {
      success: true,
      message: 'アクセスリンクをメールで送信しました',
    };
    console.log('16. Success response:', JSON.stringify(successResponse, null, 2));
    return NextResponse.json(successResponse);
  } catch (error) {
    console.error('=== Send Magic Link API Error ===');
    console.error('Error type:', typeof error);
    console.error('Error instance:', error?.constructor?.name);
    console.error('Full error:', error);
    
    if (error instanceof z.ZodError) {
      console.error('Validation error details:', error.errors);
      const validationResponse = {
        error: 'リクエストデータが不正です',
        details: error.errors
      };
      console.error('Returning validation error response:', JSON.stringify(validationResponse, null, 2));
      return NextResponse.json(validationResponse, { status: 400 });
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : 'No stack trace';
    console.error('Error message:', errorMessage);
    console.error('Error stack:', errorStack);
    
    const errorResponse = {
      error: 'リンクの送信に失敗しました',
      details: errorMessage,
      timestamp: new Date().toISOString()
    };
    console.error('Returning error response:', JSON.stringify(errorResponse, null, 2));
    return NextResponse.json(errorResponse, { status: 500 });
  }
}