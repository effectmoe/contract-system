// ローカルストレージを使用した削除済み契約書の管理
// Vercel KVが設定されるまでの一時的な解決策

const DELETED_CONTRACTS_KEY = 'deleted_contracts';

export const deletedContractsStorage = {
  // 削除済み契約書のIDを取得
  getDeletedIds(): string[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(DELETED_CONTRACTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  // 契約書IDを削除済みとして記録
  addDeletedId(contractId: string): void {
    if (typeof window === 'undefined') return;
    
    try {
      const deletedIds = this.getDeletedIds();
      if (!deletedIds.includes(contractId)) {
        deletedIds.push(contractId);
        localStorage.setItem(DELETED_CONTRACTS_KEY, JSON.stringify(deletedIds));
      }
    } catch (error) {
      console.error('Failed to save deleted contract ID:', error);
    }
  },

  // 契約書IDを削除済みリストから削除
  removeDeletedId(contractId: string): void {
    if (typeof window === 'undefined') return;
    
    try {
      const deletedIds = this.getDeletedIds();
      const filtered = deletedIds.filter(id => id !== contractId);
      localStorage.setItem(DELETED_CONTRACTS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to remove deleted contract ID:', error);
    }
  },

  // 削除済みリストをクリア
  clearDeletedIds(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(DELETED_CONTRACTS_KEY);
    } catch (error) {
      console.error('Failed to clear deleted contracts:', error);
    }
  },

  // 契約書が削除済みかチェック
  isDeleted(contractId: string): boolean {
    return this.getDeletedIds().includes(contractId);
  }
};