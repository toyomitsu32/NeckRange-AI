# Cloudflare Pages ビルド設定

## ビルド設定

### フレームワークプリセット
- **なし** または **Vite**

### ビルドコマンド
```bash
npm run build
```

### ビルド出力ディレクトリ
```
dist
```

### Node.js バージョン
```
18
```

---

## 環境変数

現時点では環境変数は不要です（すべてクライアントサイド処理）

---

## デプロイ後の確認事項

1. ✅ ページが正常に表示される
2. ✅ カメラアクセスが動作する（HTTPSが必要）
3. ✅ MediaPipe Pose が正常にロードされる
4. ✅ ルーティングが正しく動作する（_redirects ファイル）

---

## トラブルシューティング

### 真っ白なページが表示される場合

1. **ブラウザのコンソールを確認**
   - F12を押してDeveloper Toolsを開く
   - Consoleタブでエラーを確認

2. **よくある原因**
   - ビルド出力ディレクトリが間違っている → `dist` を指定
   - ビルドコマンドが間違っている → `npm run build` を使用
   - Node.jsバージョンが古い → Node.js 18以上を使用

3. **_redirects ファイルが含まれているか確認**
   ```bash
   ls dist/_redirects
   ```

4. **MediaPipe CDN へのアクセス確認**
   - CDN: `https://cdn.jsdelivr.net/npm/@mediapipe/pose/`
   - ネットワークタブでリクエストを確認

---

## ビルドログ例

```
> neckrange-ai@1.0.0 build
> tsc && vite build

vite v5.4.21 building for production...
✓ 42 modules transformed.
dist/index.html                   0.55 kB │ gzip:  0.41 kB
dist/assets/index-_S3G8yAk.css   14.39 kB │ gzip:  3.50 kB
dist/assets/index-CPFt5LlP.js   210.61 kB │ gzip: 70.97 kB
✓ built in 2.35s
```

---

## 確認URL

デプロイ後、以下をテストしてください：

1. トップページ（イントロ画面）
2. カメラ撮影機能
3. ファイルアップロード機能
4. 画像解析機能
5. 診断結果表示

---

## サポート

問題が解決しない場合は、GitHubのIssuesで報告してください。
