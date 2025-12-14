# NeckRange AI - デプロイメントガイド

## 🚀 デプロイ方法

### ローカル開発環境

#### 1. 依存関係のインストール
```bash
npm install
```

#### 2. 開発サーバーの起動
```bash
npm run dev
```

サーバーは `http://localhost:5173` で起動します。

#### 3. ビルド
```bash
npm run build
```

ビルド成果物は `dist/` ディレクトリに生成されます。

---

## 🌐 本番デプロイ

### Vercel へのデプロイ（推奨）

1. **Vercel CLIのインストール**
```bash
npm install -g vercel
```

2. **デプロイ実行**
```bash
vercel
```

3. **本番デプロイ**
```bash
vercel --prod
```

### Netlify へのデプロイ

1. **Netlify CLIのインストール**
```bash
npm install -g netlify-cli
```

2. **ビルド**
```bash
npm run build
```

3. **デプロイ**
```bash
netlify deploy --prod --dir=dist
```

### GitHub Pages へのデプロイ

1. **vite.config.ts を編集**
```typescript
export default defineConfig({
  base: '/repository-name/',
  // ... その他の設定
})
```

2. **ビルドとデプロイ**
```bash
npm run build
npm run deploy
```

---

## ⚙️ 環境設定

### 必須要件
- Node.js 18.x 以上
- npm または yarn
- モダンブラウザ（Chrome, Safari, Firefox, Edge）

### ブラウザ要件
- **カメラアクセス**: HTTPS環境が必要
- **MediaPipe**: WebAssembly対応ブラウザ

---

## 🔒 セキュリティ

### HTTPS必須
カメラアクセスのため、本番環境では必ずHTTPSを使用してください。

### CORS設定
MediaPipeのCDNリソースへのアクセスを許可：
```
https://cdn.jsdelivr.net/npm/@mediapipe/pose/
```

---

## 📊 パフォーマンス最適化

### 推奨設定
- **画像最適化**: 撮影画像は自動的に圧縮
- **遅延ロード**: MediaPipeは初回アクセス時にロード
- **キャッシュ**: 静的アセットのブラウザキャッシュ

---

## 🐛 トラブルシューティング

### カメラが起動しない
- HTTPS環境か確認
- ブラウザのカメラ許可設定を確認
- 他のアプリがカメラを使用していないか確認

### MediaPipe読み込みエラー
- ネットワーク接続を確認
- CDNへのアクセスが可能か確認
- ブラウザコンソールでエラー詳細を確認

---

## 📝 ライセンス
MIT License
