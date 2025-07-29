# External Systems

このディレクトリには、契約システムと連携する外部システムが配置されています。

## AAM Orchestration

### 概要
AAM (AI Agent Manager) Orchestrationは、複数の業務自動化システムを統合管理するプラットフォームです。

### 主要機能
- **会計自動化システム**: 仕訳入力、OCR処理、請求書管理
- **リアルタイムバックアップ**: 複数プロジェクトの自動同期
- **MCP (Model Context Protocol)**: Claude Desktopとの連携
- **Obsidian連携**: ドキュメント管理とナレッジベース

### ディレクトリ構造
```
aam-orchestration/
├── accounting-automation/      # 会計自動化システム本体
├── automation/                # 自動化スクリプト群
│   ├── backup-config.sh      # バックアップ設定
│   ├── aam-realtime-sync.sh  # リアルタイム同期
│   └── claude-mcp-manager/   # MCP設定管理
├── mastra-mcp-integration/   # Mastra MCP統合
├── mcp-servers/              # MCPサーバー群
├── webui-dashboard/          # 管理ダッシュボード
└── docs/                     # ドキュメント
```

### パス更新について
2025-07-28に以下のパス変更を実施：
- 旧: `/Users/tonychustudio/Documents/aam-orchestration`
- 新: `/Users/tonychustudio/Desktop/contract-system/external-systems/aam-orchestration`

パス更新済みファイル数: 1300+

### アクセス方法
```bash
# AAM Orchestrationディレクトリへ移動
cd /Users/tonychustudio/Desktop/contract-system/external-systems/aam-orchestration

# 会計自動化システムへアクセス
cd accounting-automation

# バックアップシステムへアクセス
cd automation
```

### 重要な設定ファイル
- `automation/backup-config.sh`: バックアップ設定
- `automation/realtime-sync-config.sh`: リアルタイム同期設定
- `automation/claude-mcp-manager/mcp-configs/`: MCP設定ファイル群

### 注意事項
1. launchdデーモンを使用している場合は、plistファイルの再読み込みが必要
2. シンボリックリンクがある場合は個別に更新が必要
3. node_modulesは除外してパス更新を実施

---
更新日: 2025-07-28