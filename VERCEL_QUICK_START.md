# ⚡ Vercel クイックスタートガイド - NeckRange AI

## 🎯 このガイドの目的

**Cloudflare Pagesで発生したMIMEタイプエラーを解決するため、ホスティング先をVercelに変更します。**

---

## ✅ 完了済み

- ✅ `vercel.json` を作成（ビルド設定、ルーティング、ヘッダー）
- ✅ `VERCEL_DEPLOY.md` を作成（詳細なデプロイガイド）
- ✅ Cloudflare固有ファイルを削除（`functions/`, `public/_mimetypes`）
- ✅ `package.json` のdeployスクリプトを更新
- ✅ GitHubリポジトリにプッシュ完了
  - リポジトリ: https://github.com/toyomitsu32/NeckRange-AI
  - 最新コミット: `a00fe32 feat: Vercel デプロイ対応`

---

## 🚀 Vercelデプロイ手順（5分で完了）

### ステップ1: Vercelアカウント作成

1. **Vercel公式サイトにアクセス**
   - URL: https://vercel.com/

2. **GitHubアカウントでサインアップ**
   - 「Sign Up with GitHub」をクリック
   - GitHubで認証を許可

### ステップ2: プロジェクトをインポート

1. **「Add New Project」をクリック**
   - Vercelダッシュボード右上の「Add New...」→「Project」

2. **GitHubリポジトリを選択**
   - 「Import Git Repository」で `toyomitsu32/NeckRange-AI` を検索
   - 「Import」をクリック

### ステップ3: ビルド設定を確認

Vercelが自動的に以下の設定を検出します：

```
Framework Preset: Vite
Root Directory: ./
Build Command: npm run build
Output Directory: dist
Install Command: npm install
Development Command: npm run dev
```

**✅ これらの設定は自動検出されるので、変更不要です！**

### ステップ4: 環境変数を設定（オプション）

「Environment Variables」セクションで以下を追加（推奨）：

```
NODE_VERSION = 18
```

### ステップ5: デプロイを実行

1. **「Deploy」ボタンをクリック**
2. **デプロイログを確認**（1-2分で完了）

---

## 🎉 デプロイ成功の確認方法

### 1. デプロイログを確認

```
✓ Building...
✓ npm install
✓ npm run build
✓ Deployment ready
```

### 2. 公開URLを取得

デプロイ完了後、以下のようなURLが自動生成されます：

```
https://neckrange-ai.vercel.app
```

または

```
https://neckrange-ai-<random-hash>.vercel.app
```

### 3. アプリケーション動作確認

URLにアクセスして以下を確認：

1. **ページ表示**
   - ✅ 「NeckRange AI へようこそ」が表示される
   - ✅ 「測定を開始する」ボタンが表示される
   - ✅ 背景グラデーションが表示される

2. **ブラウザコンソール確認（F12）**
   - **Consoleタブ**: ❌ **MIMEタイプエラーが表示されない**
   - **Networkタブ**: `index-xxx.js` のContent-Typeが `text/javascript` ✅

3. **機能テスト**
   - 「測定を開始する」ボタンをクリック
   - カメラアクセス許可が正常に動作する
   - 画像撮影・アップロードが正常に動作する

---

## 🆚 Vercel vs Cloudflare Pages

| 項目 | Vercel | Cloudflare Pages |
|------|--------|------------------|
| **MIMEタイプ設定** | ✅ 自動設定、問題なし | ❌ 手動設定が必要、エラー多発 |
| **デプロイ速度** | ✅ 1-2分 | 2-5分 |
| **設定の簡潔さ** | ✅ 非常にシンプル | ❌ wrangler.toml、Functionsなど複雑 |
| **エラーハンドリング** | ✅ わかりやすいログ | 不明瞭なエラーメッセージ |
| **無料枠** | 月100GB転送量 | 無制限 |
| **SPAルーティング** | ✅ 自動対応 | 手動で`_redirects`が必要 |

**結論**: Vercelの方がシンプルで、MIMEタイプエラーも発生しません！

---

## 🛠️ トラブルシューティング

### ❌ ビルドエラーが発生した場合

#### エラー例: `npm install` 失敗

**解決方法**: 
- Vercelダッシュボードで「Redeploy」をクリック
- 環境変数 `NODE_VERSION = 18` が設定されているか確認

#### エラー例: `vite build` 失敗

**解決方法**:
- ローカルで `npm run build` を実行して、エラーがないか確認
- TypeScriptエラーがあれば修正してGitHubにプッシュ

### ❌ デプロイ後に真っ白なページが表示される

**解決方法**:
1. **ブラウザキャッシュをクリア**（Ctrl + Shift + R）
2. **Vercelダッシュボードで「Domains」を確認**
   - プロジェクトURLが正しく設定されているか確認
3. **`vercel.json` を確認**
   - `"outputDirectory": "dist"` が正しく設定されているか

### ❌ JavaScript/CSSが読み込まれない

**確認項目**:
1. **Networkタブで確認**
   - `index-xxx.js` → Content-Type: `text/javascript` ✅
   - `index-xxx.css` → Content-Type: `text/css` ✅

2. **vercel.jsonのheaders設定を確認**
   - `Content-Type` が正しく設定されているか

---

## 📚 関連ドキュメント

- **VERCEL_DEPLOY.md** - 詳細なデプロイガイド
- **README.md** - プロジェクト概要
- **REQUIREMENTS.md** - 要件定義書
- **BUILD_INSTRUCTIONS.md** - ビルド手順

---

## ✨ 期待される結果

**Vercelへの移行により、以下の問題が解決されます:**

1. ✅ **MIMEタイプエラーが完全に解消**
   - `application/octet-stream` エラーがなくなる
   - `text/javascript` が自動的に設定される

2. ✅ **シンプルな設定**
   - `vercel.json` 1ファイルで完結
   - Cloudflare Functionsのような複雑な設定が不要

3. ✅ **高速なデプロイ**
   - 1-2分で完了
   - 自動ビルド、自動デプロイ

4. ✅ **明確なエラーメッセージ**
   - 問題があればすぐに特定できる

---

## 🎯 次のステップ

1. **上記の手順に従ってVercelにデプロイ**
2. **公開URLを取得**
3. **動作確認を実施**
4. **カスタムドメインを設定（オプション）**

---

**🚀 Vercelで、ストレスフリーなデプロイを体験してください！**
