import { Contract } from '@/types/contract';
import { getContractService } from '@/lib/db/mongodb';
import { config } from '@/lib/config/env';
import { demoContracts } from '@/lib/db/demo-data';
import { ERROR_MESSAGES } from '@/lib/utils/constants';

/**
 * Fetch contract from database or demo data
 */
export async function fetchContract(contractId: string): Promise<{
  contract: Contract | null;
  error?: string;
}> {
  if (!contractId) {
    return { contract: null, error: '契約IDが必要です' };
  }

  // Demo mode check
  const isActuallyDemo = !process.env.MONGODB_URI || 
    process.env.MONGODB_URI === 'demo-mode' || 
    process.env.MONGODB_URI.includes('your-cluster');
  
  if (config.isDemo || isActuallyDemo) {
    const contract = demoContracts.find(c => c.contractId === contractId);
    
    if (!contract) {
      return { contract: null, error: ERROR_MESSAGES.CONTRACT_NOT_FOUND };
    }
    
    return { contract };
  }
  
  // Fetch from database
  try {
    const contractService = await getContractService();
    const contract = await contractService['contracts'].findOne({ contractId });

    if (!contract) {
      return { contract: null, error: ERROR_MESSAGES.CONTRACT_NOT_FOUND };
    }
    
    return { contract };
  } catch (error) {
    console.error('Database fetch error:', error);
    return { contract: null, error: 'データベースエラーが発生しました' };
  }
}

/**
 * Check if running in demo mode
 */
export function isDemoMode(): boolean {
  return config.isDemo || 
    !process.env.MONGODB_URI || 
    process.env.MONGODB_URI === 'demo-mode' || 
    process.env.MONGODB_URI.includes('your-cluster');
}