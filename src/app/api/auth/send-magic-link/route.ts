import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { z } from 'zod';
import crypto from 'crypto';
import { AccessToken } from '@/types/auth';

const requestSchema = z.object({
  contractId: z.string(),
  partyId: z.string(),
  email: z.string().email(),
  name: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contractId, partyId, email, name } = requestSchema.parse(body);

    // Demo mode
    if (!process.env.MONGODB_URI) {
      console.log('Demo mode: Magic link would be sent to', email);
      return NextResponse.json({
        success: true,
        message: 'メールを送信しました（デモモード）',
        demoLink: `/contracts/view?token=demo-token-${contractId}-${partyId}`,
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

    // Here you would send the actual email
    // await sendEmail({
    //   to: email,
    //   subject: `契約書「${contract?.title}」の確認`,
    //   html: `
    //     <p>${name}様</p>
    //     <p>契約書の確認依頼が届いています。</p>
    //     <p>以下のリンクから契約書を確認できます：</p>
    //     <a href="${magicLink}">契約書を確認する</a>
    //     <p>このリンクは24時間有効です。</p>
    //   `
    // });

    return NextResponse.json({
      success: true,
      message: 'アクセスリンクをメールで送信しました',
    });
  } catch (error) {
    console.error('Send magic link error:', error);
    return NextResponse.json(
      { error: 'リンクの送信に失敗しました' },
      { status: 500 }
    );
  }
}