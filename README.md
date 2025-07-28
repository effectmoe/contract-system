# 電子契約システム (Electronic Contract System)

日本の電子帳簿保存法および電子署名法に完全準拠した電子契約管理システムです。

## 🚀 デモ

[ライブデモ](https://contract-system-4dbbo2pqu-effectmoes-projects.vercel.app)

## 📦 GitHub

[リポジトリ](https://github.com/effectmoe/contract-system)

## ✨ 主な機能

- 📝 **契約書管理**: 作成、編集、削除、ステータス管理
- ✍️ **電子署名**: 法的に有効な電子署名システム
- 📄 **PDF生成**: タイムスタンプ付きPDF出力
- 🤖 **AI契約分析**: DeepSeek APIによるリスク分析
- 📷 **OCR機能**: Azure Computer Visionによる契約書スキャン
- 🔒 **セキュリティ**: 暗号化、アクセス制御、監査ログ
- 📊 **法令遵守**: 7年間保存、検索可能、改ざん防止
- 📱 **レスポンシブ**: モバイル・タブレット対応

## セットアップ

### 1. 前提条件

- Node.js 18.17以上
- npm または yarn
- MongoDB Atlas アカウント
- Vercel アカウント（推奨）

### 2. リポジトリのクローン

```bash
git clone https://github.com/effectmoe/contract-system.git
cd contract-system
```

### 3. 依存関係のインストール

```bash
npm install
```

### 4. 環境変数の設定

`.env.local`ファイルを作成し、以下の環境変数を設定してください：

```bash
# MongoDB
MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/contract-system
MONGODB_DB_NAME=contract-system

# Vercel KV
KV_URL=your-kv-url
KV_REST_API_URL=your-kv-rest-api-url
KV_REST_API_TOKEN=your-kv-rest-api-token
KV_REST_API_READ_ONLY_TOKEN=your-kv-rest-api-read-only-token

# Vercel Blob
BLOB_READ_WRITE_TOKEN=your-blob-token

# AI Services
DEEPSEEK_API_KEY=your-deepseek-api-key
AZURE_CV_ENDPOINT=your-azure-computer-vision-endpoint
AZURE_CV_KEY=your-azure-computer-vision-key

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
CONTRACT_DOMAIN=http://localhost:3000
SESSION_SECRET=your-session-secret
```

詳細な設定方法は[環境変数設定ガイド](./ENVIRONMENT_VARIABLES.md)を参照してください。

### 5. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開いてください。

## 📦 デプロイ

### Vercelへのデプロイ（推奨）

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Feffectmoe%2Fcontract-system)

1. 上記のボタンをクリック
2. GitHubアカウントと連携
3. 環境変数を設定（[設定ガイド](./ENVIRONMENT_VARIABLES.md)参照）
4. デプロイ

### 手動デプロイ

```bash
# Vercel CLIを使用
vercel

# 本番環境へのデプロイ
vercel --prod
```

## 🛠️ 技術スタック

- **フレームワーク**: Next.js 15 (App Router)
- **言語**: TypeScript
- **データベース**: MongoDB Atlas
- **キャッシュ**: Vercel KV (Redis)
- **ファイルストレージ**: Vercel Blob
- **AI**: DeepSeek API
- **OCR**: Azure Computer Vision
- **PDF**: pdf-lib, react-pdf
- **電子署名**: react-signature-canvas
- **スタイリング**: Tailwind CSS
- **フォーム**: React Hook Form + Zod

## プロジェクト構造

```
src/
├── app/              # Next.js App Router
├── components/       # Reactコンポーネント
├── lib/              # ユーティリティ・ライブラリ
├── types/            # TypeScript型定義
└── hooks/            # カスタムHooks
```

## 📱 使い方

### 契約書の作成

1. 「新規作成」ボタンをクリック
2. 契約書情報を入力
3. 契約当事者を追加
4. 内容を入力して保存

### 電子署名

1. 契約書詳細ページで「署名依頼」
2. 署名者にメール通知（実装予定）
3. 署名者が電子署名を実施
4. 全員の署名で契約完了

### AI分析

1. 契約書詳細ページで「AI分析」
2. リスク評価と改善提案を確認
3. 必要に応じて契約内容を修正

## 📝 ライセンス

MIT License

## 🤝 コントリビューション

プルリクエストを歓迎します！大きな変更の場合は、まずissueを作成して変更内容を説明してください。

## 📧 サポート

質問や問題がある場合は、[Issues](https://github.com/effectmoe/contract-system/issues)を作成してください。

---

Built with ❤️ by [effectmoe](https://github.com/effectmoe)
