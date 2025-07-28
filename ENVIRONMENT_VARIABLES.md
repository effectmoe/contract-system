# 環境変数設定ガイド

## Vercelダッシュボードでの設定方法

1. [Vercelダッシュボード](https://vercel.com/dashboard)にアクセス
2. `contract-system`プロジェクトを選択
3. Settings → Environment Variables に移動
4. 以下の環境変数を追加

## 必須環境変数

### MongoDB Atlas
```
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
MONGODB_DB_NAME=contract-system
```

### Vercel KV (Redis)
```
KV_URL=<your-kv-url>
KV_REST_API_URL=<your-kv-rest-api-url>
KV_REST_API_TOKEN=<your-kv-rest-api-token>
KV_REST_API_READ_ONLY_TOKEN=<your-kv-rest-api-read-only-token>
```

### Vercel Blob Storage
```
BLOB_READ_WRITE_TOKEN=<your-blob-read-write-token>
```

### AI Services
```
DEEPSEEK_API_KEY=<your-deepseek-api-key>
AZURE_CV_ENDPOINT=<your-azure-computer-vision-endpoint>
AZURE_CV_KEY=<your-azure-computer-vision-key>
```

### アプリケーション設定
```
NEXT_PUBLIC_APP_URL=https://contract-system-4dbbo2pqu-effectmoes-projects.vercel.app
CONTRACT_DOMAIN=https://contract-system-4dbbo2pqu-effectmoes-projects.vercel.app
SESSION_SECRET=<generate-a-strong-random-string>
```

## セットアップ手順

### 1. MongoDB Atlas
1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)にアクセス
2. 無料クラスターを作成
3. データベースユーザーを作成
4. ネットワークアクセスで`0.0.0.0/0`を許可（または特定のIPを設定）
5. 接続文字列をコピー

### 2. Vercel KV
1. Vercelダッシュボードで Storage → Create Database
2. KV (Redis) を選択
3. データベースを作成
4. 環境変数が自動的に追加される

### 3. Vercel Blob
1. Vercelダッシュボードで Storage → Create Database
2. Blob を選択
3. ストレージを作成
4. トークンをコピー

### 4. DeepSeek API
1. [DeepSeek](https://platform.deepseek.com/)でアカウント作成
2. APIキーを生成

### 5. Azure Computer Vision
1. [Azure Portal](https://portal.azure.com)でComputer Visionリソースを作成
2. キーとエンドポイントをコピー

## セキュリティに関する注意事項

- 環境変数は本番環境（Production）に設定
- APIキーやトークンは絶対に公開しない
- SESSION_SECRETは32文字以上のランダムな文字列を使用

## 動作確認

環境変数設定後、以下を確認：
1. Vercelで再デプロイ（Settings → Git → Redeploy）
2. アプリケーションにアクセスして動作確認
3. エラーログを確認（Functions → Logs）