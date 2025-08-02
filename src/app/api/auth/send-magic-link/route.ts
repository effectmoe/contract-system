import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
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

    console.log('3. Checking Resend API key...');
    console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
    
    if (!process.env.RESEND_API_KEY) {
      console.log('4. Running in demo mode - No Resend API key found');
      const demoLink = `/contracts/view?token=demo-token-${contractId}-${partyId}`;
      console.log('5. Generated demo link:', demoLink);
      return NextResponse.json({
        success: true,
        message: 'メールを送信しました（デモモード）',
        demoLink: demoLink,
      });
    }

    // Generate secure token
    console.log('4. Generating secure token...');
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    console.log('5. Token generated:', token.substring(0, 10) + '...');

    // Save access token to Vercel KV
    console.log('6. Saving access token to Vercel KV...');
    const accessToken: AccessToken = {
      token,
      email,
      contractId,
      partyId,
      expiresAt,
      used: false,
      createdAt: new Date(),
    };

    await kv.set(`access_token:${token}`, accessToken, { ex: 24 * 60 * 60 }); // 24 hours expiry
    console.log('7. Access token saved successfully');

    // Get contract details from KV for email
    console.log('8. Fetching contract details from KV...');
    const contract = await kv.get(`contract:${contractId}`);
    console.log('9. Contract found:', !!contract);
    
    // Generate magic link
    const magicLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/contracts/view?token=${token}`;
    
    console.log('10. Magic link generated:', magicLink);

    // Resendを使用してメール送信
    try {
      console.log('10. Initializing Resend client...');
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      const emailData = {
        from: 'onboarding@resend.dev',
        to: [email],
        subject: `契約書「${(contract as any)?.title || 'タイトル未設定'}」の確認依頼`,
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
                <p>契約書「<strong>${(contract as any)?.title || 'タイトル未設定'}</strong>」の確認依頼が届いています。</p>
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
      };
      
      console.log('11. Sending email with data:', JSON.stringify({
        from: emailData.from,
        to: emailData.to,
        subject: emailData.subject,
        htmlLength: emailData.html.length
      }, null, 2));
      
      const { data, error: resendError } = await resend.emails.send(emailData);

      if (resendError) {
        console.error('Resend error details:', JSON.stringify(resendError, null, 2));
        const errorMessage = resendError.message || 
                           (typeof resendError === 'string' ? resendError : 'Unknown Resend error');
        throw new Error(`Resend API error: ${errorMessage}`);
      } else {
        console.log('12. Email sent successfully:', data);
      }
    } catch (emailError) {
      console.error('Email sending error details:', emailError);
      if (emailError instanceof Error) {
        throw new Error(`Email sending failed: ${emailError.message}`);
      } else {
        console.error('Unknown email error type:', typeof emailError, emailError);
        throw new Error('Email sending failed: Unknown error occurred');
      }
    }

    console.log('13. Returning success response...');
    const successResponse = {
      success: true,
      message: 'アクセスリンクをメールで送信しました',
    };
    console.log('13. Success response:', JSON.stringify(successResponse, null, 2));
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