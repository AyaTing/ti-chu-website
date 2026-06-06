import { defineConfig } from "tinacms";
import { R2MediaStore } from "../src/lib/r2MediaStore";

const branch =
  process.env.NEXT_PUBLIC_TINA_BRANCH ||
  process.env.CF_PAGES_BRANCH ||
  process.env.HEAD ||
  "main";

export default defineConfig({
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID,
  token: process.env.TINA_TOKEN,
  branch,
  build: {
    outputFolder: "admin",
    publicFolder: "public",
  },
  media: {
    loadCustomStore: async () => R2MediaStore,
  },
  schema: {
    collections: [
      {
        name: "projects",
        label: "作品集",
        path: "src/content/projects",
        format: "md",
        fields: [
          {
            type: "string",
            name: "title",
            label: "標題",
            required: true,
          },
          {
            type: "string",
            name: "category",
            label: "分類",
            options: ["住宅", "商業空間", "設計作品", "其他"],
          },
          {
            type: "image",
            name: "heroImage",
            label: "主圖",
          },
          {
            type: "image",
            name: "images",
            label: "其他圖片",
            list: true,
          },
          {
            type: "number",
            name: "order",
            label: "排序",
          },
          {
            type: "boolean",
            name: "featured",
            label: "精選",
          },
          {
            type: "rich-text",
            name: "body",
            label: "內容",
            isBody: true,
          },
        ],
      },
    ],
  },
});
