# 電子契約システム 本番環境セットアップガイド

## 1. MongoDB Atlas セットアップ

### アカウント作成と設定
1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) にアクセス
2. 無料アカウントを作成
3. 新しいクラスタを作成:
   - Provider: AWS
   - Region: Asia Pacific (Tokyo)
   - Cluster Tier: M0 Sandbox (Free)
   - Cluster Name: contract-cluster

### データベース設定
1. Database Access:
   - Add New Database User
   - Username: contractadmin
   - Password: 強力なパスワードを生成
   - Database User Privileges: Read and write to any database

2. Network Access:
   - Add IP Address
   - Allow Access from Anywhere (0.0.0.0/0) ※本番環境では特定のIPに制限推奨

3. 接続文字列の取得:
   - Connect → Drivers
   - Connection String をコピー

## 2. Vercel KV セットアップ

### Vercelアカウントでの設定
1. [Vercel Dashboard](https://vercel.com/dashboard) にログイン
2. Storage → Create Database → KV
3. Database Name: contract-kv
4. Region: Tokyo (iad1)
5. 作成後、環境変数をコピー

## 3. 環境変数の設定

`.env.local` を以下のように更新:

```env
# MongoDB Atlas（実際の値に置き換え）
MONGODB_URI=mongodb+srv://contractadmin:<password>@contract-cluster.xxxxx.mongodb.net/contract_system?retryWrites=true&w=majority

# Vercel KV（Vercelダッシュボードから取得）
KV_REST_API_URL=https://xxxxxxxx.kv.vercel-storage.com
KV_REST_API_TOKEN=xxxxxxxx

# Vercel Blob（必要に応じて設定）
BLOB_READ_WRITE_TOKEN=vercel_blob_xxxxxxxx

# AI Integration（必要に応じて設定）
DEEPSEEK_API_KEY=sk-xxxxxxxx
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1

# Azure Computer Vision（必要に応じて設定）
AZURE_COMPUTER_VISION_ENDPOINT=https://xxxxxxxx.cognitiveservices.azure.com/
AZURE_COMPUTER_VISION_KEY=xxxxxxxx

# Contract Settings
CONTRACTOR_NAME="あなたの会社名"
CONTRACTOR_EMAIL="your-email@company.com"
CONTRACTOR_COMPANY="あなたの会社名"
CONTRACT_SIGNING_SECRET=<32文字以上のランダム文字列>
CONTRACT_DOMAIN=https://your-domain.vercel.app

# NextAuth
NEXTAUTH_SECRET=<32文字以上のランダム文字列>
NEXTAUTH_URL=https://your-domain.vercel.app
```

## 4. 秘密鍵の生成

```bash
# CONTRACT_SIGNING_SECRET の生成
openssl rand -base64 32

# NEXTAUTH_SECRET の生成
openssl rand -base64 32
```

## 5. データベースの初期化

1. MongoDBのコレクション作成:
```javascript
// MongoDB Atlasのコンソールで実行
use contract_system

db.createCollection('contracts')
db.createCollection('signatures')
db.createCollection('auditLogs')
db.createCollection('sessions')

// インデックスの作成
db.contracts.createIndex({ contractId: 1 }, { unique: true })
db.contracts.createIndex({ createdAt: -1 })
db.contracts.createIndex({ status: 1 })
db.signatures.createIndex({ contractId: 1 })
db.auditLogs.createIndex({ contractId: 1, performedAt: -1 })
```

## 6. Vercelへのデプロイ

```bash
# Vercel CLIのインストール
npm i -g vercel

# プロジェクトディレクトリで
vercel

# 環境変数の設定
vercel env add MONGODB_URI
vercel env add KV_REST_API_URL
# ... 他の環境変数も同様に設定

# 本番環境へデプロイ
vercel --prod
```

## 7. 動作確認

1. デプロイされたURLにアクセス
2. 新規契約書を作成
3. PDFダウンロードをテスト
4. 署名機能をテスト

## 8. セキュリティ設定

### MongoDB Atlas
- IP Allowlistを特定のIPアドレスに制限
- Database User権限を最小限に制限

### Vercel
- Environment Variablesを Production only に設定
- Domain設定でカスタムドメインを追加

## トラブルシューティング

### MongoDB接続エラー
- Network Accessの設定を確認
- 接続文字列のパスワードが正しいか確認
- クラスタが起動しているか確認

### Vercel KVエラー
- KV_REST_API_URLとKV_REST_API_TOKENが正しいか確認
- Vercelプロジェクトと同じリージョンか確認

### PDFダウンロードエラー
- Vercel環境でChromiumが正しく動作しているか確認
- Function timeoutを延長（vercel.json で設定）

## サポート

問題が発生した場合は、以下を確認してください：
- Vercel Functions のログ
- MongoDB Atlas のログ
- ブラウザのコンソールエラー