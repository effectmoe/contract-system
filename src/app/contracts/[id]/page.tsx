import Header from '@/components/layout/Header';
import ContractDetail from '@/components/contracts/ContractDetail';

export const metadata = {
  title: '契約書詳細 | 電子契約システム',
  description: '契約書の詳細表示',
};

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ContractDetailPage({ params }: PageProps) {
  const { id } = await params;
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <ContractDetail contractId={id} />
    </div>
  );
}