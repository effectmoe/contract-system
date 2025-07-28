import ContractViewer from '@/components/contracts/ContractViewer';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { redirect } from 'next/navigation';

export const metadata = {
  title: '契約書確認 | 電子契約システム',
  description: '契約書の内容を確認',
};

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ContractViewPage({ params }: PageProps) {
  const { id } = await params;
  
  // Check session
  const cookieStore = cookies();
  const sessionToken = cookieStore.get('contract-viewer-session');

  if (!sessionToken) {
    redirect('/contracts/view/unauthorized');
  }

  try {
    // Verify session token
    const decoded = jwt.verify(
      sessionToken.value,
      process.env.CONTRACT_SIGNING_SECRET || 'secret'
    ) as any;

    // Check if user has access to this contract
    if (decoded.contractId !== id) {
      redirect('/contracts/view/unauthorized');
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <ContractViewer
          contractId={id}
          viewerInfo={{
            partyId: decoded.partyId,
            email: decoded.email,
            name: decoded.name,
            company: decoded.company,
            role: decoded.role,
          }}
        />
      </div>
    );
  } catch (error) {
    redirect('/contracts/view/unauthorized');
  }
}