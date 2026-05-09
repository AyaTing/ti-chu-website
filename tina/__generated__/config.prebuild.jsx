// tina/config.ts
import { defineConfig } from "tinacms";
var config_default = defineConfig({
  clientId: process.env.PUBLIC_TINA_CLIENT_ID,
  token: process.env.TINA_TOKEN,
  branch: "main",
  build: {
    outputFolder: "admin",
    publicFolder: "public"
  },
  media: {
    tina: {
      mediaRoot: "images/projects",
      publicFolder: "public"
    }
  },
  schema: {
    collections: [
      {
        name: "projects",
        label: "\u4F5C\u54C1\u96C6",
        path: "src/content/projects",
        format: "md",
        fields: [
          {
            type: "string",
            name: "title",
            label: "\u6A19\u984C",
            required: true
          },
          {
            type: "string",
            name: "category",
            label: "\u5206\u985E",
            options: ["\u4F4F\u5B85", "\u5546\u696D\u7A7A\u9593", "\u8A2D\u8A08\u4F5C\u54C1", "\u5176\u4ED6"]
          },
          {
            type: "image",
            name: "heroImage",
            label: "\u4E3B\u5716"
          },
          {
            type: "image",
            name: "images",
            label: "\u5176\u4ED6\u5716\u7247",
            list: true
          },
          {
            type: "number",
            name: "order",
            label: "\u6392\u5E8F"
          },
          {
            type: "boolean",
            name: "featured",
            label: "\u7CBE\u9078"
          },
          {
            type: "rich-text",
            name: "body",
            label: "\u5167\u5BB9",
            isBody: true
          }
        ]
      }
    ]
  }
});
export {
  config_default as default
};
