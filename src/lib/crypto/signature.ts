import * as crypto from 'crypto';
import CryptoJS from 'crypto-js';
import { Contract, Signature } from '@/types/contract';

export class ElectronicSignature {
  private secretKey: string;

  constructor() {
    this.secretKey = process.env.CONTRACT_SIGNING_SECRET || 'default-secret-key';
  }

  /**
   * Generate signature verification hash
   */
  generateVerificationHash(data: {
    contractId: string;
    partyId: string;
    signedAt: Date;
    ipAddress: string;
    userAgent: string;
  }): string {
    const message = `${data.contractId}|${data.partyId}|${data.signedAt.toISOString()}|${data.ipAddress}|${data.userAgent}`;
    const hash = CryptoJS.HmacSHA256(message, this.secretKey);
    return hash.toString(CryptoJS.enc.Hex);
  }

  /**
   * Verify signature hash
   */
  verifySignatureHash(signature: Signature, contractId: string): boolean {
    const expectedHash = this.generateVerificationHash({
      contractId,
      partyId: signature.partyId,
      signedAt: new Date(signature.signedAt),
      ipAddress: signature.ipAddress,
      userAgent: signature.userAgent,
    });

    return signature.verificationHash === expectedHash;
  }

  /**
   * Generate signature token for email links
   */
  generateSignatureToken(contractId: string, partyId: string): string {
    const payload = {
      contractId,
      partyId,
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48 hours
      nonce: crypto.randomBytes(16).toString('hex'),
    };

    const message = JSON.stringify(payload);
    const encrypted = CryptoJS.AES.encrypt(message, this.secretKey).toString();
    
    // URL-safe base64
    return encrypted.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  /**
   * Decode and verify signature token
   */
  verifySignatureToken(token: string): {
    valid: boolean;
    contractId?: string;
    partyId?: string;
    expired?: boolean;
  } {
    try {
      // Restore base64
      const encrypted = token.replace(/-/g, '+').replace(/_/g, '/');
      
      const decrypted = CryptoJS.AES.decrypt(encrypted, this.secretKey);
      const message = decrypted.toString(CryptoJS.enc.Utf8);
      const payload = JSON.parse(message);

      const expiresAt = new Date(payload.expiresAt);
      const now = new Date();

      if (now > expiresAt) {
        return { valid: false, expired: true };
      }

      return {
        valid: true,
        contractId: payload.contractId,
        partyId: payload.partyId,
      };
    } catch (error) {
      return { valid: false };
    }
  }

  /**
   * Generate certificate ID for completed signatures
   */
  generateCertificateId(signature: Signature): string {
    const data = `${signature.partyId}|${signature.signedAt}|${signature.verificationHash}`;
    const hash = crypto.createHash('sha256').update(data).digest('hex');
    return `CERT-${hash.substring(0, 16).toUpperCase()}`;
  }

  /**
   * Calculate contract hash for integrity verification
   */
  calculateContractHash(contract: Contract): string {
    const data = {
      contractId: contract.contractId,
      title: contract.title,
      content: contract.content,
      parties: contract.parties.map(p => ({
        id: p.id,
        name: p.name,
        email: p.email,
      })),
      createdAt: contract.createdAt,
    };

    const message = JSON.stringify(data);
    return crypto.createHash('sha256').update(message).digest('hex');
  }

  /**
   * Generate QR code data for signature verification
   */
  generateQRCodeData(contract: Contract, signature: Signature): string {
    const verificationUrl = `${process.env.CONTRACT_DOMAIN}/verify`;
    const data = {
      url: verificationUrl,
      contractId: contract.contractId,
      certificateId: signature.certificateId,
      hash: signature.verificationHash.substring(0, 8),
    };

    return JSON.stringify(data);
  }

  /**
   * Process signature image (convert to base64)
   */
  async processSignatureImage(dataUrl: string): Promise<{
    imageData: string;
    hash: string;
  }> {
    // Remove data URL prefix
    const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
    
    // Calculate image hash
    const imageHash = crypto
      .createHash('sha256')
      .update(base64Data)
      .digest('hex');

    return {
      imageData: base64Data,
      hash: imageHash,
    };
  }

  /**
   * Create signature object
   */
  async createSignature(params: {
    contractId: string;
    partyId: string;
    signatureDataUrl?: string;
    ipAddress: string;
    userAgent: string;
  }): Promise<Signature> {
    const signedAt = new Date();
    
    let signatureData: string | undefined;
    if (params.signatureDataUrl) {
      const processed = await this.processSignatureImage(params.signatureDataUrl);
      signatureData = processed.imageData;
    }

    const verificationHash = this.generateVerificationHash({
      contractId: params.contractId,
      partyId: params.partyId,
      signedAt,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });

    const signature: Signature = {
      partyId: params.partyId,
      signatureData,
      signedAt,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      verificationHash,
    };

    // Generate certificate ID
    signature.certificateId = this.generateCertificateId(signature);

    return signature;
  }

  /**
   * Verify all signatures in a contract
   */
  verifyContractSignatures(contract: Contract): {
    valid: boolean;
    results: Array<{
      partyId: string;
      valid: boolean;
      error?: string;
    }>;
  } {
    const results = contract.signatures.map(signature => {
      try {
        const valid = this.verifySignatureHash(signature, contract.contractId);
        return {
          partyId: signature.partyId,
          valid,
          error: valid ? undefined : 'Invalid signature hash',
        };
      } catch (error) {
        return {
          partyId: signature.partyId,
          valid: false,
          error: 'Verification failed',
        };
      }
    });

    const allValid = results.every(r => r.valid);
    
    return {
      valid: allValid,
      results,
    };
  }
}

// Export singleton instance
export const electronicSignature = new ElectronicSignature();