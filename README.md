# exhibitorapi

[AiMeet](https://www.aimeet.jp/) の **出展商管理 OpenAPI** を機械可読な形で維持・検証するためのリポジトリです。`openapi.yaml` に API 定義をまとめ、ローカル用の CORS 回避プロキシとテストを同梱しています。

## 含まれるもの

| ファイル / ディレクトリ | 説明 |
|------------------------|------|
| `openapi.yaml` | OpenAPI 3 定義（AiMeet OpenAPI — 出展商管理 API v2.0） |
| `openapi-new-exhibitor.md` | 仕様の参考ドキュメント（自然言語） |
| `scripts/` | OpenAPI 検証、`npm run dev` 用ランチャー、ローカル CORS プロキシ |
| `tests/` | 定義の妥当性・ルーティング・CLI 引数の自動テスト |

## 前提

- **Node.js 20 以上**（`package.json` の `engines` に準拠）

## セットアップ

```bash
npm install
```

## npm スクリプト

| コマンド | 説明 |
|----------|------|
| `npm test` | OpenAPI 検証・ルーティング・`launch` 引数パースのテストを実行 |
| `npm run validate:openapi` | `openapi.yaml` を Swagger Parser で検証のみ |
| `npm run dev` | 対話モードで、プロキシ起動の有無と（直接接続時の）ベース URL を選択 |
| `npm run proxy:dev` | ローカル CORS プロキシのみ起動（既定ポート `8787`） |

### ローカル開発（プロキシ）

ブラウザや Swagger UI から直接 `aibox*.aimeet.jp` を呼ぶと CORS で失敗することがあるため、`npm run dev` でプロキシ（既定 `http://127.0.0.1:8787`）を立てる運用を想定しています。OpenAPI 上は「プロキシ経由」のパス `/env/{apiEnv}/openapi/...` とサーバー `127.0.0.1:8787` を組み合わせ、`apiEnv` でテスト（`test`）／本番（`prod`）を切り替えます。

非対話でプロキシのみ起動する例:

```bash
node scripts/launch.mjs --proxy --port=8787
```

環境変数 `PROXY_PORT` でプロキシのポートを変えられます（`dev-proxy.mjs`）。

### `launch.mjs` の主なオプション

- `--proxy` / `--no-proxy` — プロキシを起動するかどうか  
- `--base=test|prod` — 直接接続時の表示用ベース（テスト／本番）  
- `--port=8787` — プロキシ待ち受けポート  

## 上流エンドポイント（参考）

| 環境 | ベース（直接接続時のイメージ） |
|------|--------------------------------|
| テスト | `https://aibox-test.aimeet.jp` |
| 本番 | `https://aibox.aimeet.jp` |

詳細なパス・認証・レスポンス形式は `openapi.yaml` および `openapi-new-exhibitor.md` を参照してください。

## セキュリティ

- `apiKey` / `secretKey` やアクセストークンをリポジトリや issue に書かないでください。  
- 本リポジトリの `.gitignore` に `.env` を含めています。クライアント／CI では環境変数やシークレット管理で扱ってください。  
- `getAccessToken` の GET（クエリに鍵が載る）はログに残りやすいため、仕様上 **POST + JSON ボディ** の利用が推奨されています（`openapi.yaml` の説明参照）。

## ライセンス

リポジトリに `LICENSE` が無い場合は、利用・再配布の条件はリポジトリ所有者に確認してください。
