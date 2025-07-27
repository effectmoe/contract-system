import Header from '@/components/layout/Header';
import ContractDashboard from '@/components/contracts/ContractDashboard';

export const metadata = {
  title: '契約書一覧 | 電子契約システム',
  description: '契約書の一覧と管理',
};

export default function ContractsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <ContractDashboard />
    </div>
  );
}