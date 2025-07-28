# Vercel環境変数設定ガイド

## デプロイ情報
- **本番URL**: https://contract-system-6nfre58sp-effectmoes-projects.vercel.app
- **プロジェクト**: effectmoes-projects/contract-system

## 環境変数の設定方法

### 方法1: Vercel ダッシュボードから設定（推奨）

1. [Vercel Dashboard](https://vercel.com/dashboard) にログイン
2. プロジェクト `contract-system` を選択
3. Settings → Environment Variables に移動
4. 以下の環境変数を追加:

#### 必須環境変数（デモモード用）

| 変数名 | 値 | 環境 |
|--------|-----|------|
| MONGODB_URI | demo-mode | Production |
| KV_REST_API_URL | https://demo-kv-url | Production |
| KV_REST_API_TOKEN | demo-token | Production |
| BLOB_READ_WRITE_TOKEN | demo-blob-token | Production |
| CONTRACTOR_NAME | あなたの会社名 | Production |
| CONTRACTOR_EMAIL | your-email@company.com | Production |
| CONTRACTOR_COMPANY | あなたの会社名 | Production |
| CONTRACT_SIGNING_SECRET | your-secret-key-here | Production |
| CONTRACT_DOMAIN | https://contract-system-6nfre58sp-effectmoes-projects.vercel.app | Production |
| NEXTAUTH_SECRET | your-nextauth-secret-here | Production |
| NEXTAUTH_URL | https://contract-system-6nfre58sp-effectmoes-projects.vercel.app | Production |

### 方法2: Vercel CLIから設定

```bash
# 各環境変数を個別に設定
vercel env add MONGODB_URI production
# 値: demo-mode

vercel env add CONTRACTOR_NAME production
# 値: あなたの会社名

# ... 他の環境変数も同様に設定
```

## 本番環境への移行

デモモードから本番環境に移行する場合：

### 1. MongoDB Atlas設定
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/contract_system?retryWrites=true&w=majority
```

### 2. Vercel KV設定
1. Vercel Dashboard → Storage → Create Database → KV
2. 作成後、自動的に環境変数が設定されます

### 3. 秘密鍵の生成
```bash
# CONTRACT_SIGNING_SECRET
openssl rand -base64 32

# NEXTAUTH_SECRET
openssl rand -base64 32
```

## デプロイの確認

1. 環境変数設定後、再デプロイ:
```bash
vercel --prod
```

2. サイトにアクセス:
https://contract-system-6nfre58sp-effectmoes-projects.vercel.app

## トラブルシューティング

### 500エラーが出る場合
- 環境変数が正しく設定されているか確認
- Vercel Functions のログを確認

### PDFダウンロードができない場合
- デモモードではpdf-libを使用した簡易PDF生成
- 本番環境ではPuppeteerが必要

## 現在の状態
- ✅ デプロイ完了
- ⏳ 環境変数設定待ち
- 📝 デモモードで動作予定