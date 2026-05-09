# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server at localhost:4321
npm run build        # Build to ./dist/
npm run preview      # Build + preview via Wrangler Pages (simulates Cloudflare)
npm run deploy       # Build + deploy to Cloudflare Pages
npm run cf-typegen   # Regenerate Cloudflare worker types into worker-configuration.d.ts
```

There are no tests or linters configured.

## Architecture

This is an **Astro 5 static site** for Ti Chu Interior Design (帝筑室內設計), deployed to **Cloudflare Pages**. The site is in Traditional Chinese (zh-TW).

**Key integrations:**
- `@astrojs/react` — React 19 components are in `src/components/react/`, Astro components in `src/components/astro/`
- `@tailwindcss/vite` (Tailwind v4) — imported via `@import "tailwindcss"` in `src/styles/global.css`, not a PostCSS plugin
- `@astrojs/cloudflare` — adapter with `platformProxy` enabled for local Wrangler emulation; image service set to `"cloudflare"`
- `@astrojs/sitemap` — auto-generates sitemap; `site` URL is configured in `astro.config.mjs`

**Path alias:** `@/` maps to `src/` (configured in `tsconfig.json`).

**Content Collections (Astro 5 loader API):**
- `projects` collection in `src/content/projects/*.md`
- Schema: `title`, `category` (enum: 住宅/商業空間/設計作品/其他), `heroImage`, `images?`, `order`, `featured`
- Uses `glob` loader — no `src/content/config.ts` subfolder nesting needed
- Access via `getCollection('projects')` in pages; detail pages at `/projects/[slug]`

**Navigation:**
- Nav items are defined once in `src/config/navigation.ts` as a typed const array
- Active-state logic lives in `src/utils/navigation.ts` (exact vs. prefix matching)
- Mobile menu toggle is handled by `src/scripts/mobileMenu.ts`, which is a plain TS module initialized client-side in `Navigation.astro`

**Page structure:** All pages use `src/layouts/Layout.astro` which injects `<Navigation>` and the global stylesheet. The `<html lang="zh-TW">` attribute is set there.

**Cloudflare-specific:** `wrangler.jsonc` configures the Pages project. `worker-configuration.d.ts` holds generated Cloudflare env types — regenerate with `npm run cf-typegen` after adding bindings.
