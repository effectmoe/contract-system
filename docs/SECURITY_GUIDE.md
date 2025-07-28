# セキュリティ設定ガイド

## 本番環境のセキュリティチェックリスト

### 1. 環境変数の設定
- [ ] 強力なパスワード・シークレットの生成
- [ ] Vercelダッシュボードで環境変数を設定
- [ ] ローカルの`.env.local`をgitignoreに追加（確認済み）

### 2. HTTPSの強制
- [x] middlewareでHTTPS redirectを実装
- [x] HSTSヘッダーの設定

### 3. セキュリティヘッダー
- [x] X-Frame-Options: DENY（クリックジャッキング対策）
- [x] X-Content-Type-Options: nosniff（MIMEタイプスニッフィング防止）
- [x] X-XSS-Protection: 1; mode=block（XSS対策）
- [x] Content-Security-Policy（CSP）の設定
- [x] Referrer-Policy: strict-origin-when-cross-origin

### 4. 認証・認可
- [ ] NextAuth.jsの本番設定
- [ ] セッション管理の強化
- [ ] ロール別アクセス制御（RBAC）

### 5. データ保護
- [x] 契約書データの暗号化（MongoDB Atlas標準）
- [x] 署名データのハッシュ化
- [ ] バックアップの設定

### 6. 監査ログ
- [ ] 重要な操作のログ記録
- [ ] ログの定期的な確認

### 7. 脆弱性対策
- [ ] 依存関係の定期的な更新
- [ ] セキュリティスキャンの実施

## 推奨される追加のセキュリティ対策

### レート制限
```typescript
// /src/lib/security/rate-limit.ts
import { LRUCache } from 'lru-cache';

const rateLimitCache = new LRUCache<string, number>({
  max: 500,
  ttl: 60000, // 1分
});

export function rateLimit(ip: string, limit: number = 10): boolean {
  const count = rateLimitCache.get(ip) || 0;
  if (count >= limit) {
    return false;
  }
  rateLimitCache.set(ip, count + 1);
  return true;
}
```

### 入力検証の強化
- すべてのAPIエンドポイントでzodスキーマによる検証を実施
- SQLインジェクション対策（MongoDBは基本的に安全）
- XSS対策（React標準で対応）

### 監視・アラート
- Vercel Analyticsの有効化
- エラー監視ツール（Sentry等）の導入
- 異常なアクセスパターンの検知