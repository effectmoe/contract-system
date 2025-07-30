export interface Contract {
  _id?: string;
  contractId: string;
  title: string;
  description: string;
  content: string;
  parties: ContractParty[];
  status: ContractStatus;
  type: ContractType;
  
  // Electronic signature fields
  signatures: Signature[];
  signatureRequestToken?: string;
  signatureExpiresAt?: Date;
  
  // PDF and document management
  pdfUrl?: string;
  originalDocumentUrl?: string;
  attachments: Attachment[];
  
  // Legal compliance
  retentionPeriod: number; // Years
  searchableFields: SearchableField[];
  auditLog: AuditEntry[];
  
  // AI analysis
  aiAnalysis?: AIAnalysis;
  aiTags?: string[];
  
  // Tags and classification
  tags?: string[];
  priority?: 'low' | 'medium' | 'high';
  category?: string;
  
  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  
  // Electronic Bookkeeping Law compliance
  transactionDate?: Date;
  transactionAmount?: number;
  counterpartyTaxId?: string;
  
  // AAM Accounting System Integration
  accountingIntegration?: {
    invoiceId?: string;
    invoiceNumber?: string;
    estimateId?: string;
    estimateNumber?: string;
    accountingSystemUrl?: string;
    syncStatus?: 'synced' | 'pending' | 'error';
    lastSyncedAt?: Date;
  };
}

export interface ContractParty {
  id: string;
  type: 'contractor' | 'client';
  name: string;
  email: string;
  company?: string;
  role: string;
  signatureRequired: boolean;
  address?: string; // 住所を追加
  signedAt?: Date;
}

export interface Signature {
  partyId: string;
  signatureImageUrl?: string;
  signatureData?: string;
  signedAt: Date;
  ipAddress: string;
  userAgent: string;
  verificationHash: string;
  certificateId?: string;
  qrCodeUrl?: string;
}

export interface Attachment {
  id: string;
  filename: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface SearchableField {
  fieldName: string;
  fieldValue: string;
  fieldType: 'text' | 'number' | 'date';
  indexed: boolean;
}

export interface AuditEntry {
  id: string;
  action: AuditAction;
  performedBy: string;
  performedAt: Date;
  details: Record<string, any>;
  ipAddress?: string;
}

export interface AIAnalysis {
  summary: string;
  keyTerms: string[];
  risks: Risk[];
  recommendations: string[];
  contractType: string;
  estimatedValue?: number;
  analyzedAt: Date;
}

export interface Risk {
  level: 'low' | 'medium' | 'high';
  description: string;
  mitigation?: string;
}

export type ContractStatus = 
  | 'draft'
  | 'pending_review'
  | 'pending_signature'
  | 'partially_signed'
  | 'completed'
  | 'cancelled'
  | 'expired';

export type ContractType = 
  | 'service_agreement'
  | 'design_agreement'
  | 'nda'
  | 'employment'
  | 'sales'
  | 'lease'
  | 'partnership'
  | 'other';

export type AuditAction = 
  | 'created'
  | 'updated'
  | 'viewed'
  | 'downloaded'
  | 'signed'
  | 'sent_for_signature'
  | 'cancelled'
  | 'completed'
  | 'deleted'
  | 'ai_analyzed'
  | 'enhanced_ai_analyzed'
  | 'legal_chat'
  | 'ocr_processed';

export interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
  type: ContractType;
  fields: TemplateField[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateField {
  id: string;
  name: string;
  placeholder: string;
  type: 'text' | 'number' | 'date' | 'email' | 'select';
  required: boolean;
  options?: string[];
  defaultValue?: string;
}

export interface ContractSearchParams {
  query?: string;
  status?: ContractStatus[];
  type?: ContractType[];
  dateFrom?: Date;
  dateTo?: Date;
  parties?: string[];
  tags?: string[];
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ContractAnalytics {
  totalContracts: number;
  contractsByStatus: Record<ContractStatus, number>;
  contractsByType: Record<ContractType, number>;
  averageCompletionTime: number;
  signingRate: number;
  monthlyTrends: MonthlyTrend[];
  topCounterparties: CounterpartyStats[];
}

export interface MonthlyTrend {
  month: string;
  created: number;
  completed: number;
  value: number;
}

export interface CounterpartyStats {
  name: string;
  company: string;
  contractCount: number;
  totalValue: number;
}