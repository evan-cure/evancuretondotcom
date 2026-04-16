import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    description: z.string().optional(),
  }),
});

const pictures = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/pictures" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    images: z.array(
      z.object({
        src: z.string(),
        alt: z.string(),
        caption: z.string().optional(),
      }),
    ),
  }),
});

export const collections = { blog, pictures };
