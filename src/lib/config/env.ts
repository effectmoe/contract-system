// Environment configuration with fallbacks for demo mode

export const config = {
  // MongoDB
  mongodb: {
    uri: process.env.MONGODB_URI || 'demo-mode',
    isDemo: !process.env.MONGODB_URI || process.env.MONGODB_URI === 'demo-mode' || process.env.MONGODB_URI.includes('your-cluster'),
  },
  
  // Vercel KV
  kv: {
    url: process.env.KV_REST_API_URL || 'demo-mode',
    token: process.env.KV_REST_API_TOKEN || 'demo-mode',
    isDemo: !process.env.KV_REST_API_URL || 
            process.env.KV_REST_API_URL === 'demo-mode' ||
            process.env.KV_REST_API_URL?.includes('your-kv-instance') ||
            !process.env.KV_REST_API_TOKEN ||
            process.env.KV_REST_API_TOKEN === 'demo-mode',
  },
  
  // Vercel Blob
  blob: {
    token: process.env.BLOB_READ_WRITE_TOKEN || 'demo-mode',
    isDemo: !process.env.BLOB_READ_WRITE_TOKEN,
  },
  
  // AI Integration
  ai: {
    deepseek: {
      apiKey: process.env.DEEPSEEK_API_KEY || 'demo-mode',
      baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
      isDemo: !process.env.DEEPSEEK_API_KEY,
    },
    azure: {
      endpoint: process.env.AZURE_COMPUTER_VISION_ENDPOINT || 'demo-mode',
      key: process.env.AZURE_COMPUTER_VISION_KEY || 'demo-mode',
      isDemo: !process.env.AZURE_COMPUTER_VISION_KEY,
    },
  },
  
  // Contract Settings
  contract: {
    contractorName: process.env.CONTRACTOR_NAME || process.env.NEXT_PUBLIC_CONTRACTOR_NAME || '株式会社サンプル',
    contractorEmail: process.env.CONTRACTOR_EMAIL || process.env.NEXT_PUBLIC_CONTRACTOR_EMAIL || 'contract@sample.com',
    contractorCompany: process.env.CONTRACTOR_COMPANY || process.env.NEXT_PUBLIC_CONTRACTOR_COMPANY || '株式会社サンプル',
    signingSecret: process.env.CONTRACT_SIGNING_SECRET || 'demo-secret-do-not-use-in-production',
    domain: process.env.CONTRACT_DOMAIN || process.env.NEXTAUTH_URL || 'http://localhost:3000',
  },
  
  // Auth
  auth: {
    secret: process.env.NEXTAUTH_SECRET || 'demo-secret-do-not-use-in-production',
    url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  },
  
  // Demo mode flag
  isDemo: !process.env.MONGODB_URI || !process.env.KV_REST_API_URL || 
          process.env.MONGODB_URI === 'demo-mode' || 
          process.env.MONGODB_URI?.includes('your-cluster') ||
          process.env.KV_REST_API_URL?.includes('your-kv-instance') ||
          process.env.KV_REST_API_URL?.includes('demo-mode'),
};

// Helper to check if running in demo mode
export const isDemoMode = () => config.isDemo;

// Helper to get demo warning message
export const getDemoWarning = () => {
  if (!isDemoMode()) return null;
  
  return {
    message: 'デモモードで実行中です。データはメモリ内に一時保存されます。',
    details: 'ページを再読み込みするとデータは初期状態に戻ります。本番環境では適切な環境変数を設定してください。',
  };
};