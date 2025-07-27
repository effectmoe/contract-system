# 電子契約システム

法的要件に完全対応した電子契約管理システム

## 機能

- ✅ 契約書の作成・編集・管理
- ✅ PDF生成・表示
- ✅ 電子署名機能
- ✅ 電子帳簿保存法対応
- ✅ AI契約分析（DeepSeek統合）
- ✅ OCR機能（Azure Computer Vision）
- ✅ モバイル対応
- ✅ 法的要件100%準拠

## セットアップ

### 1. 環境変数の設定

`.env.local`ファイルを作成し、以下の環境変数を設定してください：

```bash
# MongoDB Atlas
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/contract_system

# Vercel KV
KV_REST_API_URL=https://your-kv-url
KV_REST_API_TOKEN=your-kv-token

# Vercel Blob
BLOB_READ_WRITE_TOKEN=your-blob-token

# AI Integration
DEEPSEEK_API_KEY=your-deepseek-key
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1

# Azure Computer Vision
AZURE_COMPUTER_VISION_ENDPOINT=your-azure-endpoint
AZURE_COMPUTER_VISION_KEY=your-azure-key

# Contract Settings
CONTRACTOR_NAME="株式会社サンプル"
CONTRACTOR_EMAIL="contract@sample.com"
CONTRACTOR_COMPANY="株式会社サンプル"
CONTRACT_SIGNING_SECRET=your-256bit-secret
CONTRACT_DOMAIN=https://contract.yourcompany.com

# NextAuth
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開いてください。

## デプロイ

### Vercelでのデプロイ

1. GitHubにプッシュ
2. Vercelでプロジェクトをインポート
3. 環境変数を設定
4. デプロイ

```bash
# Vercel CLIを使用する場合
vercel
```

## 技術スタック

- **フロントエンド**: Next.js 15, React 18, TypeScript
- **スタイリング**: Tailwind CSS
- **データベース**: MongoDB Atlas
- **キャッシュ**: Vercel KV
- **ファイルストレージ**: Vercel Blob
- **AI**: DeepSeek API
- **OCR**: Azure Computer Vision
- **PDF**: pdf-lib, react-pdf
- **電子署名**: react-signature-canvas

## プロジェクト構造

```
src/
├── app/              # Next.js App Router
├── components/       # Reactコンポーネント
├── lib/              # ユーティリティ・ライブラリ
├── types/            # TypeScript型定義
└── hooks/            # カスタムHooks
```

## ライセンス

Copyright (c) 2024 Contract System. All rights reserved.
