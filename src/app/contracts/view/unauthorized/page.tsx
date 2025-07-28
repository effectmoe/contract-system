import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'アクセス権限がありません | 電子契約システム',
};

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          アクセス権限がありません
        </h1>
        <p className="text-gray-600 mb-8">
          この契約書を閲覧する権限がないか、<br />
          セッションの有効期限が切れています。
        </p>
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            契約書の確認リンクをメールで受け取っている場合は、<br />
            そちらのリンクから再度アクセスしてください。
          </p>
          <Link href="/" className="btn-primary inline-block">
            トップページに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}