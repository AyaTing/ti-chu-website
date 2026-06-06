// @ts-check
import { defineConfig } from "astro/config";

import cloudflare from "@astrojs/cloudflare";

import react from "@astrojs/react";

import tailwindcss from "@tailwindcss/vite";

import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://ti-chu-website.pages.dev",
  output: "static",
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },

    imageService: "cloudflare",
  }),

  redirects: {
    "/admin": "/admin/index.html",
  },

  integrations: [react(), sitemap()],

  vite: {
    plugins: [tailwindcss()],
  },
});
