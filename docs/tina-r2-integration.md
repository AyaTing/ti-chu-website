# Tina Cloud CMS + Cloudflare R2 整合計畫

## 架構

```
編輯者瀏覽器
  ├── /admin (TinaCMS SPA)  ←→  Tina Cloud (backend + auth + git commit)
  └── 圖片上傳              ←→  /api/media/* (Pages Function)  ←→  R2 Bucket
                                                                      ↓
                                                                 公開 URL (r2.dev)

GitHub repo ←── Tina Cloud commits ──→ Cloudflare Pages rebuild ──→ 靜態網站
```

- **Tina Cloud**：負責 backend、auth、git 操作
- **Cloudflare R2**：負責圖片存儲
- **Pages Function** (`functions/api/media/`)：橋接 TinaCMS media 與 R2
- **Astro**：維持 `output: "static"`，不改動

---

## 環境變數清單

| 變數 | 來源 | 說明 |
|------|------|------|
| `TINA_CLIENT_ID` | app.tina.io | Tina Cloud project Client ID |
| `TINA_TOKEN` | app.tina.io | Tina Cloud read-only content token |
| `PUBLIC_TINA_CLIENT_ID` | 同上 | 前端 admin UI 連接 Tina Cloud 用 |

> R2 透過 wrangler binding 存取，不需額外 env var。

---

## 需修改的檔案

| 檔案 | 異動 |
|------|------|
| `wrangler.jsonc` | 新增 R2 binding |
| `package.json` | 更新 dev/build scripts |
| `.gitignore` | 新增 `.tina/__generated__` |

## 需新增的檔案

| 檔案 | 說明 |
|------|------|
| `tina/config.ts` | TinaCMS schema + Tina Cloud config |
| `src/lib/r2MediaStore.ts` | Custom media store（呼叫 Pages Function） |
| `functions/api/media/[[path]].ts` | Pages Function，橋接 TinaCMS 與 R2 |
| `.env` | 本地環境變數（不 commit） |
| `.env.example` | 環境變數範本 |

---

## Checklist

### Step 1 — 手動：Tina Cloud 帳號設定

- [ ] 至 [app.tina.io](https://app.tina.io) 建立新 project
- [ ] 連接 GitHub repo（`ti-chu-website`）
- [ ] 複製 **Client ID** 與 **Content Token**
- [ ] 在本地建立 `.env` 並填入：
  ```
  TINA_CLIENT_ID=<your-client-id>
  TINA_TOKEN=<your-token>
  PUBLIC_TINA_CLIENT_ID=<your-client-id>
  ```

---

### Step 2 — 安裝套件

- [ ] 安裝 `tinacms`：
  ```bash
  npm install tinacms
  ```

---

### Step 3 — 建立 R2 Bucket

- [ ] 建立正式 bucket：
  ```bash
  npx wrangler r2 bucket create ti-chu-media
  ```
- [ ] 建立 preview bucket（本地開發用）：
  ```bash
  npx wrangler r2 bucket create ti-chu-media-preview
  ```
- [ ] 在 Cloudflare Dashboard → R2 → `ti-chu-media` → 開啟 **Public Access**
- [ ] 記下公開網域（`https://pub-xxxx.r2.dev`）備用

---

### Step 4 — 修改 `wrangler.jsonc`

- [ ] 新增 R2 binding：
  ```jsonc
  "r2_buckets": [
    {
      "binding": "MEDIA_BUCKET",
      "bucket_name": "ti-chu-media",
      "preview_bucket_name": "ti-chu-media-preview"
    }
  ]
  ```

---

### Step 5 — 新增 `tina/config.ts`

- [ ] 建立 `tina/config.ts`，定義與現有 Astro schema 對應的欄位：
  - `title` (string, required)
  - `category` (string, options: 住宅/商業空間/設計作品/其他)
  - `heroImage` (image)
  - `images` (image, list)
  - `order` (number)
  - `featured` (boolean)
  - `body` (rich-text, isBody: true)
- [ ] 設定 `build.outputFolder: 'admin'`、`build.publicFolder: 'public'`
- [ ] 設定 `media.loadCustomStore` 指向 `src/lib/r2MediaStore`

---

### Step 6 — 新增 `src/lib/r2MediaStore.ts`

TinaCMS custom media store（瀏覽器端），呼叫 Pages Function API：

- [ ] 實作 `persist(files)` → `POST /api/media`（multipart 上傳）
- [ ] 實作 `list(options)` → `GET /api/media?directory=...`
- [ ] 實作 `delete(media)` → `DELETE /api/media?src=...`

---

### Step 7 — 新增 `functions/api/media/[[path]].ts`

Cloudflare Pages Function，R2 操作的伺服器端：

- [ ] `GET /api/media` → `env.MEDIA_BUCKET.list()`，回傳檔案清單
- [ ] `POST /api/media` → 接收 multipart，`env.MEDIA_BUCKET.put()`，回傳 `{ src: 'https://...' }`
- [ ] `DELETE /api/media` → `env.MEDIA_BUCKET.delete(key)`
- [ ] 限制只允許圖片 MIME type（`image/*`）
- [ ] 設定 CORS header（允許 `localhost:4321` 及正式網域）

---

### Step 8 — 更新 `package.json` scripts

- [ ] `"dev"` 改為 `"tinacms dev -c 'astro dev'"`
- [ ] `"build"` 改為 `"tinacms build && astro build"`

---

### Step 9 — 更新 `.gitignore`

- [ ] 新增：`.tina/__generated__`

---

### Step 10 — 新增 `.env.example`

- [ ] 建立 `.env.example`，填入環境變數名稱（值留空）

---

### Step 11 — 驗證

- [ ] `npm run dev` → `localhost:4321` 正常顯示網站
- [ ] `localhost:4321/admin` → TinaCMS 編輯器開啟、可登入
- [ ] 在 admin 編輯一個作品並儲存 → GitHub 收到 commit
- [ ] 在 admin 上傳一張圖片 → R2 bucket 有該檔案，回傳 URL 可在瀏覽器開啟
- [ ] `npm run build` → build 成功，`public/admin/index.html` 存在
- [ ] `npm run preview` → Wrangler 本地環境 `/api/media` 路由正常回應
