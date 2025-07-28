import Link from 'next/link';
import { FileText, PenTool, Shield, Search, BarChart3, Clock } from 'lucide-react';

export default function Home() {
  return (
    <>
      <link rel="stylesheet" href="/css/styles.css" />
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            電子契約システム
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            法的要件に完全対応した、安全で効率的な契約管理を実現
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/contracts" className="btn-primary">
              契約書を管理する
            </Link>
            <Link href="/contracts/new" className="btn-secondary">
              新規契約書を作成
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="card text-center">
            <div className="flex justify-center mb-4">
              <FileText className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">スマート契約管理</h3>
            <p className="text-gray-600">
              契約書の作成から署名、保管まで一元管理。検索も簡単に。
            </p>
          </div>

          <div className="card text-center">
            <div className="flex justify-center mb-4">
              <PenTool className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">電子署名対応</h3>
            <p className="text-gray-600">
              法的に有効な電子署名機能。モバイルからの署名にも対応。
            </p>
          </div>

          <div className="card text-center">
            <div className="flex justify-center mb-4">
              <Shield className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">法令完全準拠</h3>
            <p className="text-gray-600">
              電子帳簿保存法・電子署名法に完全対応。7年間の保存も安心。
            </p>
          </div>

          <div className="card text-center">
            <div className="flex justify-center mb-4">
              <Search className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">AI検索・分析</h3>
            <p className="text-gray-600">
              AIによる高度な検索と契約内容の自動分析・リスク評価。
            </p>
          </div>

          <div className="card text-center">
            <div className="flex justify-center mb-4">
              <BarChart3 className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">分析ダッシュボード</h3>
            <p className="text-gray-600">
              契約状況を可視化。締結率や期限管理も一目で把握。
            </p>
          </div>

          <div className="card text-center">
            <div className="flex justify-center mb-4">
              <Clock className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">効率化</h3>
            <p className="text-gray-600">
              契約プロセスを最大80%短縮。テンプレート機能で更に効率化。
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center bg-blue-600 text-white rounded-lg p-8">
          <h2 className="text-3xl font-bold mb-4">
            今すぐ電子契約を始めましょう
          </h2>
          <p className="text-lg mb-6">
            無料でアカウントを作成して、効率的な契約管理を体験してください
          </p>
          <Link
            href="/contracts/new"
            className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block"
          >
            無料で始める
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-16 grid md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-blue-600">99.9%</div>
            <div className="text-gray-600">稼働率</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-blue-600">256bit</div>
            <div className="text-gray-600">暗号化</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-blue-600">24時間</div>
            <div className="text-gray-600">サポート</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-blue-600">100%</div>
            <div className="text-gray-600">法令準拠</div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}