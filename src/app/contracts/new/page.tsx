import ContractCreator from '@/components/contracts/ContractCreator';
import PDFImporter from '@/components/contracts/PDFImporter';

export const metadata = {
  title: '新規契約書作成 | 電子契約システム',
  description: '新しい契約書を作成',
};

export default function NewContractPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <ContractCreator />
    </div>
  );
}