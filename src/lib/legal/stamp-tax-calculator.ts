import { StampTaxResult, STAMP_TAX_TABLE } from './types';

export class StampTaxCalculator {
  /**
   * 印紙税を計算
   */
  static calculate(contractType: string, contractAmount?: number): StampTaxResult {
    switch (contractType) {
      case 'service_agreement':
        return this.calculateServiceAgreementTax(contractAmount);
      
      case 'employment':
        return {
          taxAmount: STAMP_TAX_TABLE.employment.tax,
          explanation: STAMP_TAX_TABLE.employment.explanation,
          legalBasis: STAMP_TAX_TABLE.employment.legalBasis
        };
      
      case 'nda':
        return {
          taxAmount: STAMP_TAX_TABLE.nda.tax,
          explanation: STAMP_TAX_TABLE.nda.explanation,
          legalBasis: STAMP_TAX_TABLE.nda.legalBasis
        };
      
      default:
        return {
          taxAmount: 200,
          explanation: '詳細不明のため、最低額の200円を適用します。詳細は税務署にご確認ください。',
          legalBasis: '印紙税法別表第一'
        };
    }
  }

  private static calculateServiceAgreementTax(contractAmount?: number): StampTaxResult {
    const taxTable = STAMP_TAX_TABLE.service_agreement;
    const legalBasis = '印紙税法別表第一';

    if (!contractAmount || contractAmount === 0) {
      return {
        taxAmount: taxTable[0].tax,
        explanation: taxTable[0].explanation,
        legalBasis
      };
    }

    for (const entry of taxTable) {
      if (contractAmount <= entry.maxAmount) {
        return {
          taxAmount: entry.tax,
          explanation: entry.explanation,
          legalBasis
        };
      }
    }

    // 500万円を超える場合
    const taxAmount = Math.min(200000, Math.floor(contractAmount * 0.0001));
    return {
      taxAmount,
      explanation: `契約金額に応じて${taxAmount}円の印紙税が必要です。`,
      legalBasis
    };
  }
}