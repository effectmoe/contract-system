#!/bin/bash

echo "電子契約システム 本番環境セットアップスクリプト"
echo "================================================"
echo ""

# 環境変数のバックアップ
if [ -f .env.local ]; then
    cp .env.local .env.local.backup
    echo "✅ 既存の.env.localをバックアップしました"
fi

# 本番用の.env.localテンプレートを作成
cat > .env.production.template << 'EOL'
# MongoDB Atlas（実際の値に置き換えてください）
MONGODB_URI=mongodb+srv://contractadmin:<password>@contract-cluster.xxxxx.mongodb.net/contract_system?retryWrites=true&w=majority

# Vercel KV（Vercelダッシュボードから取得）
KV_REST_API_URL=https://xxxxxxxx.kv.vercel-storage.com
KV_REST_API_TOKEN=xxxxxxxx

# Vercel Blob（必要に応じて設定）
BLOB_READ_WRITE_TOKEN=vercel_blob_xxxxxxxx

# AI Integration（オプション）
DEEPSEEK_API_KEY=sk-xxxxxxxx
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1

# Azure Computer Vision（オプション）
AZURE_COMPUTER_VISION_ENDPOINT=https://xxxxxxxx.cognitiveservices.azure.com/
AZURE_COMPUTER_VISION_KEY=xxxxxxxx

# Contract Settings
CONTRACTOR_NAME="あなたの会社名"
CONTRACTOR_EMAIL="your-email@company.com"
CONTRACTOR_COMPANY="あなたの会社名"
CONTRACT_SIGNING_SECRET=
CONTRACT_DOMAIN=https://your-domain.vercel.app

# NextAuth
NEXTAUTH_SECRET=
NEXTAUTH_URL=https://your-domain.vercel.app
EOL

echo "✅ 本番環境用テンプレートを作成しました: .env.production.template"
echo ""

# 秘密鍵の生成
echo "🔑 秘密鍵を生成しています..."
CONTRACT_SECRET=$(openssl rand -base64 32)
NEXTAUTH_SECRET=$(openssl rand -base64 32)

echo ""
echo "生成された秘密鍵:"
echo "CONTRACT_SIGNING_SECRET=$CONTRACT_SECRET"
echo "NEXTAUTH_SECRET=$NEXTAUTH_SECRET"
echo ""
echo "これらの値を.env.production.templateにコピーしてください"
echo ""

# MongoDBセットアップ手順
echo "📚 MongoDB Atlas セットアップ手順:"
echo "1. https://www.mongodb.com/cloud/atlas にアクセス"
echo "2. 無料アカウントを作成"
echo "3. 新しいクラスタを作成（M0 Sandbox - 無料）"
echo "4. Database Userを作成"
echo "5. Network Access で 0.0.0.0/0 を許可（開発時のみ）"
echo "6. 接続文字列を取得して.env.production.templateのMONGODB_URIに設定"
echo ""

# Vercel KVセットアップ手順
echo "🗄️  Vercel KV セットアップ手順:"
echo "1. https://vercel.com/dashboard にログイン"
echo "2. Storage → Create Database → KV"
echo "3. Tokyo リージョンを選択"
echo "4. 作成後、環境変数をコピー"
echo ""

# デプロイ手順
echo "🚀 デプロイ手順:"
echo "1. .env.production.template を .env.local にリネーム"
echo "2. すべての値を実際の値に置き換え"
echo "3. vercel コマンドでデプロイ"
echo "4. vercel env add で環境変数を設定"
echo "5. vercel --prod で本番環境にデプロイ"
echo ""

echo "詳細な手順は PRODUCTION_SETUP.md を参照してください"