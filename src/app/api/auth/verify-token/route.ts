import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { z } from 'zod';
import { AccessToken } from '@/types/auth';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const requestSchema = z.object({
  token: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = requestSchema.parse(body);

    // Demo mode
    if (!process.env.MONGODB_URI) {
      if (token.startsWith('demo-token-')) {
        const [, , contractId, partyId] = token.split('-');
        
        // Create demo session
        const sessionToken = jwt.sign(
          {
            contractId,
            partyId,
            email: 'demo@example.com',
            name: 'デモユーザー',
          },
          process.env.CONTRACT_SIGNING_SECRET || 'demo-secret',
          { expiresIn: '24h' }
        );

        const cookieStore = await cookies();
        cookieStore.set('contract-viewer-session', sessionToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 24 * 60 * 60, // 24 hours
        });

        return NextResponse.json({
          success: true,
          contractId,
          redirect: `/contracts/view/${contractId}`,
        });
      }
    }

    const { db } = await connectToDatabase();

    // Find and validate token
    const accessToken = await db.collection<AccessToken>('access_tokens').findOne({
      token,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!accessToken) {
      return NextResponse.json(
        { error: '無効または期限切れのリンクです' },
        { status: 401 }
      );
    }

    // Mark token as used
    await db.collection<AccessToken>('access_tokens').updateOne(
      { token },
      { 
        $set: { 
          used: true,
          lastAccessedAt: new Date(),
        },
      }
    );

    // Get contract and party details
    const contract = await db.collection('contracts').findOne({ 
      contractId: accessToken.contractId 
    });
    
    const party = contract?.parties.find((p: any) => p.id === accessToken.partyId);

    if (!contract || !party) {
      return NextResponse.json(
        { error: '契約書が見つかりません' },
        { status: 404 }
      );
    }

    // Create session token
    const sessionToken = jwt.sign(
      {
        contractId: accessToken.contractId,
        partyId: accessToken.partyId,
        email: party.email,
        name: party.name,
        company: party.company,
        role: party.role,
      },
      process.env.CONTRACT_SIGNING_SECRET || 'secret',
      { expiresIn: '24h' }
    );

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set('contract-viewer-session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
    });

    return NextResponse.json({
      success: true,
      contractId: accessToken.contractId,
      redirect: `/contracts/view/${accessToken.contractId}`,
    });
  } catch (error) {
    console.error('Verify token error:', error);
    return NextResponse.json(
      { error: 'トークンの検証に失敗しました' },
      { status: 500 }
    );
  }
}