// Application constants
export const APP_NAME = '電子契約システム';
export const APP_VERSION = '1.0.0';

// Contract constants
export const CONTRACT_STATUS = {
  DRAFT: 'draft',
  PENDING_REVIEW: 'pending_review',
  PENDING_SIGNATURE: 'pending_signature',
  PARTIALLY_SIGNED: 'partially_signed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
} as const;

export const CONTRACT_TYPES = {
  SERVICE_AGREEMENT: 'service_agreement',
  NDA: 'nda',
  EMPLOYMENT: 'employment',
  SALES: 'sales',
  LEASE: 'lease',
  PARTNERSHIP: 'partnership',
  OTHER: 'other',
} as const;

// Status labels (Japanese)
export const CONTRACT_STATUS_LABELS = {
  [CONTRACT_STATUS.DRAFT]: '下書き',
  [CONTRACT_STATUS.PENDING_REVIEW]: 'レビュー待ち',
  [CONTRACT_STATUS.PENDING_SIGNATURE]: '署名待ち',
  [CONTRACT_STATUS.PARTIALLY_SIGNED]: '一部署名済み',
  [CONTRACT_STATUS.COMPLETED]: '完了',
  [CONTRACT_STATUS.CANCELLED]: 'キャンセル',
  [CONTRACT_STATUS.EXPIRED]: '期限切れ',
} as const;

// Type labels (Japanese)
export const CONTRACT_TYPE_LABELS = {
  [CONTRACT_TYPES.SERVICE_AGREEMENT]: '業務委託契約',
  [CONTRACT_TYPES.NDA]: '秘密保持契約',
  [CONTRACT_TYPES.EMPLOYMENT]: '雇用契約',
  [CONTRACT_TYPES.SALES]: '売買契約',
  [CONTRACT_TYPES.LEASE]: '賃貸借契約',
  [CONTRACT_TYPES.PARTNERSHIP]: 'パートナーシップ契約',
  [CONTRACT_TYPES.OTHER]: 'その他',
} as const;

// Legal compliance constants
export const RETENTION_PERIOD_YEARS = 7; // 電子帳簿保存法要件
export const SIGNATURE_EXPIRY_HOURS = 48; // 署名リンクの有効期限

// File upload limits
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

// API rate limits
export const RATE_LIMITS = {
  API_REQUESTS: {
    limit: 100,
    window: 60, // seconds
  },
  FILE_UPLOADS: {
    limit: 10,
    window: 300, // seconds
  },
  AI_REQUESTS: {
    limit: 20,
    window: 60, // seconds
  },
} as const;

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Date formats
export const DATE_FORMAT = {
  DISPLAY: 'YYYY年MM月DD日',
  DISPLAY_WITH_TIME: 'YYYY年MM月DD日 HH:mm',
  ISO: 'YYYY-MM-DD',
  ISO_WITH_TIME: 'YYYY-MM-DDTHH:mm:ss',
} as const;

// Error messages (Japanese)
export const ERROR_MESSAGES = {
  GENERIC: 'エラーが発生しました。もう一度お試しください。',
  NOT_FOUND: '指定されたリソースが見つかりませんでした。',
  UNAUTHORIZED: '認証が必要です。ログインしてください。',
  FORBIDDEN: 'このリソースへのアクセス権限がありません。',
  VALIDATION: '入力内容に誤りがあります。',
  FILE_TOO_LARGE: 'ファイルサイズが制限を超えています。',
  INVALID_FILE_TYPE: 'サポートされていないファイル形式です。',
  RATE_LIMIT: 'リクエスト数が制限を超えました。しばらくお待ちください。',
  SESSION_EXPIRED: 'セッションの有効期限が切れました。再度ログインしてください。',
  CONTRACT_NOT_FOUND: '契約書が見つかりませんでした。',
  SIGNATURE_EXPIRED: '署名リンクの有効期限が切れました。',
  AI_SERVICE_ERROR: 'AI分析サービスでエラーが発生しました。',
  OCR_SERVICE_ERROR: 'OCR処理でエラーが発生しました。',
} as const;

// Success messages (Japanese)
export const SUCCESS_MESSAGES = {
  CONTRACT_CREATED: '契約書が作成されました。',
  CONTRACT_UPDATED: '契約書が更新されました。',
  CONTRACT_SIGNED: '署名が完了しました。',
  CONTRACT_SENT: '署名依頼を送信しました。',
  FILE_UPLOADED: 'ファイルがアップロードされました。',
  AI_ANALYSIS_COMPLETE: 'AI分析が完了しました。',
  OCR_COMPLETE: 'OCR処理が完了しました。',
} as const;

// Regular expressions
export const REGEX = {
  EMAIL: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  PHONE_JP: /^0\d{1,4}-?\d{1,4}-?\d{4}$/,
  POSTAL_CODE_JP: /^\d{3}-?\d{4}$/,
  TAX_ID_JP: /^\d{13}$/, // 法人番号
} as const;

// Colors for status
export const STATUS_COLORS = {
  [CONTRACT_STATUS.DRAFT]: '#6B7280',
  [CONTRACT_STATUS.PENDING_REVIEW]: '#F59E0B',
  [CONTRACT_STATUS.PENDING_SIGNATURE]: '#3B82F6',
  [CONTRACT_STATUS.PARTIALLY_SIGNED]: '#8B5CF6',
  [CONTRACT_STATUS.COMPLETED]: '#10B981',
  [CONTRACT_STATUS.CANCELLED]: '#EF4444',
  [CONTRACT_STATUS.EXPIRED]: '#991B1B',
} as const;

// Contract templates
export const DEFAULT_TEMPLATES = {
  SERVICE_AGREEMENT: {
    title: '業務委託契約書',
    fields: ['業務内容', '契約期間', '報酬', '支払条件'],
  },
  NDA: {
    title: '秘密保持契約書',
    fields: ['秘密情報の定義', '守秘義務期間', '例外事項'],
  },
  EMPLOYMENT: {
    title: '雇用契約書',
    fields: ['職種', '勤務地', '給与', '勤務時間', '休日'],
  },
} as const;