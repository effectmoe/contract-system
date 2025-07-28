import { NextRequest, NextResponse } from 'next/server';
import { getContractService } from '@/lib/db/mongodb';
import { electronicSignature } from '@/lib/crypto/signature';
import { kvCache, CacheKeys, CacheDurations } from '@/lib/db/kv';
import { rateLimiter } from '@/lib/db/kv';
import { ERROR_MESSAGES, SUCCESS_MESSAGES, SIGNATURE_EXPIRY_HOURS } from '@/lib/utils/constants';

// POST /api/contracts/[id]/sign - Create signature request
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const { allowed } = await rateLimiter.checkLimit(`api:${ip}`, 20, 60);
    
    if (!allowed) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.RATE_LIMIT },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { partyId } = body;

    if (!partyId) {
      return NextResponse.json(
        { error: '署名者IDが必要です' },
        { status: 400 }
      );
    }

    const { id } = await params;
    
    const contractService = await getContractService();
    const contract = await contractService['contracts'].findOne({ 
      contractId: id 
    });

    if (!contract) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.CONTRACT_NOT_FOUND },
        { status: 404 }
      );
    }

    // Check if party exists in contract
    const party = contract.parties.find(p => p.id === partyId);
    if (!party) {
      return NextResponse.json(
        { error: '指定された署名者が契約に含まれていません' },
        { status: 400 }
      );
    }

    // Check if already signed
    const existingSignature = contract.signatures.find(s => s.partyId === partyId);
    if (existingSignature) {
      return NextResponse.json(
        { error: 'この署名者は既に署名済みです' },
        { status: 400 }
      );
    }

    // Generate signature token
    const token = electronicSignature.generateSignatureToken(id, partyId);
    
    // Store token in cache
    await kvCache.set(
      CacheKeys.signatureToken(token),
      { contractId: id, partyId },
      { ex: CacheDurations.signatureToken }
    );

    // Update contract with signature request
    const expiresAt = new Date(Date.now() + SIGNATURE_EXPIRY_HOURS * 60 * 60 * 1000);
    
    await contractService['contracts'].update(
      { contractId: id },
      { 
        $set: { 
          signatureRequestToken: token,
          signatureExpiresAt: expiresAt,
          status: 'pending_signature',
          updatedAt: new Date()
        } 
      }
    );

    // Log action
    await contractService['auditLogs'].create({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      action: 'sent_for_signature',
      performedBy: 'system', // TODO: Get from auth
      performedAt: new Date(),
      details: { 
        contractId: id,
        partyId,
        expiresAt
      },
    });

    // TODO: Send email notification to party
    const signatureUrl = `${process.env.CONTRACT_DOMAIN}/contracts/${id}/sign/${token}`;

    return NextResponse.json({
      message: SUCCESS_MESSAGES.CONTRACT_SENT,
      signatureUrl,
      token,
      expiresAt,
    });
  } catch (error) {
    console.error('Failed to create signature request:', error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.GENERIC },
      { status: 500 }
    );
  }
}

// PUT /api/contracts/[id]/sign - Submit signature
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const { allowed } = await rateLimiter.checkLimit(`api:${ip}`, 10, 60);
    
    if (!allowed) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.RATE_LIMIT },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { token, signatureDataUrl } = body;

    if (!token) {
      return NextResponse.json(
        { error: '署名トークンが必要です' },
        { status: 400 }
      );
    }

    // Verify token
    const tokenData = await kvCache.get(CacheKeys.signatureToken(token));
    if (!tokenData) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.SIGNATURE_EXPIRED },
        { status: 400 }
      );
    }

    const { id } = await params;
    const { contractId, partyId } = tokenData as any;
    
    if (contractId !== id) {
      return NextResponse.json(
        { error: '無効な署名トークンです' },
        { status: 400 }
      );
    }

    const contractService = await getContractService();
    const contract = await contractService['contracts'].findOne({ 
      contractId: id 
    });

    if (!contract) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.CONTRACT_NOT_FOUND },
        { status: 404 }
      );
    }

    // Create signature
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const signature = await electronicSignature.createSignature({
      contractId: id,
      partyId,
      signatureDataUrl,
      ipAddress: ip,
      userAgent,
    });

    // Add signature to contract
    const signatures = [...(contract.signatures || []), signature];
    
    // Check if all required signatures are collected
    const allParties = contract.parties.filter(p => p.signatureRequired);
    const signedParties = signatures.map(s => s.partyId);
    const allSigned = allParties.every(p => signedParties.includes(p.id));

    const newStatus = allSigned ? 'completed' : 'partially_signed';

    // Update contract
    await contractService['contracts'].update(
      { contractId: id },
      { 
        $set: { 
          signatures,
          status: newStatus,
          updatedAt: new Date(),
          ...(allSigned ? { completedAt: new Date() } : {})
        },
        $unset: {
          signatureRequestToken: '',
          signatureExpiresAt: '',
        }
      }
    );

    // Delete token from cache
    await kvCache.del(CacheKeys.signatureToken(token));

    // Log action
    await contractService['auditLogs'].create({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      action: 'signed',
      performedBy: partyId,
      performedAt: new Date(),
      details: { 
        contractId: id,
        certificateId: signature.certificateId,
        ipAddress: ip,
        userAgent,
      },
    });

    // Auto-generate completion certificate if all signatures are collected
    let certificateGenerated = false;
    if (allSigned) {
      try {
        const certificateResponse = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/contracts/${id}/certificate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (certificateResponse.ok) {
          certificateGenerated = true;
          console.log('Completion certificate generated for contract:', id);
        }
      } catch (error) {
        console.error('Failed to auto-generate certificate:', error);
        // Don't fail the signature process if certificate generation fails
      }
    }

    // Generate QR code for verification
    const qrCodeData = electronicSignature.generateQRCodeData(contract, signature);
    
    // TODO: Generate actual QR code image
    const qrCodeUrl = '/api/qr/generate?data=' + encodeURIComponent(qrCodeData);

    return NextResponse.json({
      message: SUCCESS_MESSAGES.CONTRACT_SIGNED,
      signature: {
        certificateId: signature.certificateId,
        signedAt: signature.signedAt,
        qrCodeUrl,
      },
      contractStatus: newStatus,
      allSigned,
      certificateGenerated,
    });
  } catch (error) {
    console.error('Failed to submit signature:', error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.GENERIC },
      { status: 500 }
    );
  }
}