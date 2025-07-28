import Header from '@/components/layout/Header';
import ContractCreator from '@/components/contracts/ContractCreator';

export const metadata = {
  title: '新規契約書作成 | 電子契約システム',
  description: '新しい契約書を作成',
};

export default function NewContractPage() {
  return (
    <>
      <link rel="stylesheet" href="/css/styles.css" />
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <ContractCreator />
      </div>
    </div>
    </>
  );
}