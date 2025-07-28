export interface CompletionCertificate {
  _id?: string;
  certificateId: string;
  contractId: string;
  contractTitle: string;
  contractManagementNumber: string;
  
  // 証明書基本情報
  signatureType: 'electronic_signature' | 'electronic_sign';
  authType: 'email_auth' | 'magic_link_auth';
  timestampDate: Date;
  
  // 合意締結当事者情報
  parties: CertificateParty[];
  
  // 証明書発行情報
  issuedAt: Date;
  issuedBy: string; // システム名
  issuerCompany: string; // 運営会社名
  
  // セキュリティ
  certificateHash: string;
  qrCodeUrl?: string;
  
  // メタデータ
  createdAt: Date;
  updatedAt: Date;
}

export interface CertificateParty {
  id: string;
  type: 'sender' | 'receiver';
  
  // 契約者基本情報
  name: string;
  email: string;
  company?: string;
  
  // 認証情報
  authMethod: string;
  signedAt: Date;
  
  // 合意者入力情報（受信者のみ）
  inputInfo?: {
    name?: string;
    address?: string;
    company?: string;
  };
}

export interface CertificateGenerationRequest {
  contractId: string;
}

export interface CertificateResponse {
  success: boolean;
  certificate?: CompletionCertificate;
  pdfUrl?: string;
  error?: string;
}

// PDF生成用のデータ構造
export interface CertificatePDFData {
  certificate: CompletionCertificate;
  contractDetails: {
    title: string;
    managementNumber: string;
    completedAt: Date;
  };
  systemInfo: {
    name: string;
    company: string;
    website?: string;
  };
}