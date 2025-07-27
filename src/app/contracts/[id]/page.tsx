import Header from '@/components/layout/Header';
import ContractDetail from '@/components/contracts/ContractDetail';

export const metadata = {
  title: '契約書詳細 | 電子契約システム',
  description: '契約書の詳細表示',
};

interface PageProps {
  params: {
    id: string;
  };
}

export default function ContractDetailPage({ params }: PageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <ContractDetail contractId={params.id} />
    </div>
  );
}