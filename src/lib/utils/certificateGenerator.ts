import { Contract } from '@/types/contract';
import { CompletionCertificate, CertificateParty } from '@/types/certificate';
import crypto from 'crypto';

export function generateCertificateId(): string {
  // 契約大臣と同様の形式: ランダム文字列-連番
  const randomStr = crypto.randomBytes(8).toString('hex');
  const timestamp = Date.now().toString().slice(-8);
  return `${randomStr}-${timestamp}`;
}

export function generateCertificateHash(certificate: Partial<CompletionCertificate>): string {
  // 証明書の主要データからハッシュ値を生成
  const hashData = {
    certificateId: certificate.certificateId,
    contractId: certificate.contractId,
    timestampDate: certificate.timestampDate,
    parties: certificate.parties?.map(p => ({
      id: p.id,
      email: p.email,
      signedAt: p.signedAt,
    })),
  };
  
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(hashData))
    .digest('hex');
}

export function createCertificateFromContract(contract: Contract): CompletionCertificate {
  const certificateId = generateCertificateId();
  const now = new Date();
  
  // 契約当事者を証明書用パーティに変換
  const certificateParties: CertificateParty[] = contract.parties.map((party, index) => {
    const signature = contract.signatures.find(s => s.partyId === party.id);
    const isFirstParty = index === 0;
    
    return {
      id: party.id,
      type: isFirstParty ? 'sender' : 'receiver',
      name: party.name,
      email: party.email,
      company: party.company,
      authMethod: 'Eメール認証', // 現在はメール認証のみ
      signedAt: signature?.signedAt || now,
      inputInfo: !isFirstParty ? {
        name: party.name,
        address: undefined, // 将来的に住所フィールドを追加
        company: party.company,
      } : undefined,
    };
  });

  // 最後の署名日時をタイムスタンプとして使用
  const lastSignature = contract.signatures
    .sort((a, b) => new Date(b.signedAt).getTime() - new Date(a.signedAt).getTime())[0];
  
  const certificateData: Partial<CompletionCertificate> = {
    certificateId,
    contractId: contract.contractId,
    contractTitle: contract.title,
    contractManagementNumber: contract.contractId, // 同じIDを使用
    signatureType: 'electronic_signature',
    authType: 'email_auth',
    timestampDate: lastSignature?.signedAt || now,
    parties: certificateParties,
    issuedAt: now,
    issuedBy: '電子契約システム',
    issuerCompany: 'tonychustudio',
    createdAt: now,
    updatedAt: now,
  };

  // ハッシュ値を生成
  const certificateHash = generateCertificateHash(certificateData);

  return {
    ...certificateData,
    certificateHash,
  } as CompletionCertificate;
}

export function formatDateForCertificate(date: Date): string {
  // 契約大臣と同じ形式: 2024/05/10 10:59 (JST)
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}/${month}/${day} ${hours}:${minutes} (JST)`;
}

export function getSignatureTypeLabel(type: string): string {
  switch (type) {
    case 'electronic_signature':
      return '電子署名';
    case 'electronic_sign':
      return '電子サイン';
    default:
      return '電子署名';
  }
}

export function getAuthTypeLabel(type: string): string {
  switch (type) {
    case 'email_auth':
      return 'Eメール認証';
    case 'magic_link_auth':
      return 'マジックリンク認証';
    default:
      return 'Eメール認証';
  }
}