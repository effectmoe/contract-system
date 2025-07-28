# API認証情報設定ガイド

## 必要なサービスと設定手順

### 1. MongoDB Atlas（必須）
1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) にアクセス
2. 無料アカウントを作成
3. 新しいクラスターを作成（M0 Free Tierで十分）
4. Database Accessでユーザーを作成
5. Network AccessでIPアドレスを許可（0.0.0.0/0 for all）
6. 接続文字列を取得

```bash
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/contract_system?retryWrites=true&w=majority
```

### 2. Vercel KV（オプション - キャッシュ用）
1. Vercelダッシュボードで「Storage」タブを選択
2. 「Create Database」→「KV」を選択
3. 環境変数を自動的に追加

### 3. Vercel Blob（オプション - ファイル保存用）
1. Vercelダッシュボードで「Storage」タブを選択
2. 「Create Database」→「Blob」を選択
3. 環境変数を自動的に追加

### 4. DeepSeek API（AI分析機能）
1. [DeepSeek](https://platform.deepseek.com/) にアクセス
2. アカウントを作成してAPIキーを取得
3. 料金は使用量に応じて（1Mトークンあたり約$2）

```bash
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
```

### 5. Azure Computer Vision（OCR機能）
1. [Azure Portal](https://portal.azure.com/) にアクセス
2. Computer Visionリソースを作成（F0 Free Tierあり）
3. キーとエンドポイントを取得

```bash
AZURE_COMPUTER_VISION_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
AZURE_COMPUTER_VISION_KEY=xxxxxxxxxxxxxxxx
```

### 6. セキュリティ設定
```bash
# 32文字以上のランダム文字列を生成
CONTRACT_SIGNING_SECRET=$(openssl rand -base64 32)
NEXTAUTH_SECRET=$(openssl rand -base64 32)
```

## Vercelでの環境変数設定

1. Vercelダッシュボードで「Settings」→「Environment Variables」
2. 各環境変数を追加（Production、Preview、Development）
3. 保存後、再デプロイ

## ローカル開発用の設定

`.env.local`ファイルを作成：

```bash
cp .env.example .env.local
# エディタで.env.localを開いて各値を設定
```

## 月額コスト見積もり

- MongoDB Atlas M0: 無料
- Vercel Hobby: 無料
- DeepSeek API: 使用量次第（約1000円/月）
- Azure Computer Vision F0: 無料（月5000トランザクションまで）
- **合計: 約1000円/月（5000円以下）**