import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const projects = defineCollection({
  loader: glob({
    pattern: "*.md",
    base: "./src/content/projects",
  }),
  schema: z.object({
    title: z.string(),
    category: z.enum(["住宅", "商業空間", "設計作品", "其他"]),
    heroImage: z.string(),
    images: z.array(z.string()).optional(),
    order: z.number().default(0),
    featured: z.boolean().default(false),
  }),
});

export const collections = { projects };
