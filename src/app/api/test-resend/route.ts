import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function GET() {
  try {
    console.log('=== Resend Test API ===');
    console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
    console.log('RESEND_API_KEY length:', process.env.RESEND_API_KEY?.length || 0);
    console.log('RESEND_API_KEY starts with:', process.env.RESEND_API_KEY?.substring(0, 5) || 'N/A');
    
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'RESEND_API_KEY not found',
        env: {
          NODE_ENV: process.env.NODE_ENV,
          VERCEL_ENV: process.env.VERCEL_ENV,
        }
      }, { status: 400 });
    }

    // Simple test with minimal data
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: ['test@example.com'], // This won't actually send due to invalid email
      subject: 'Test Email',
      text: 'This is a test email.',
    });

    console.log('Resend response data:', data);
    console.log('Resend response error:', error);

    return NextResponse.json({
      success: !error,
      data: data,
      error: error,
      apiKeyConfigured: true,
    });

  } catch (err) {
    console.error('Test Resend error:', err);
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
      apiKeyConfigured: !!process.env.RESEND_API_KEY,
    }, { status: 500 });
  }
}