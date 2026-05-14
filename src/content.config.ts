import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const postSchema = z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
});

const posts = defineCollection({
    loader: glob({ pattern: '*.{md,mdx}', base: './src/content/posts' }),
    schema: postSchema,
});

const projects = defineCollection({
    loader: glob({ pattern: '*.{md,mdx}', base: './src/content/projects' }),
    schema: postSchema,
});

const travel = defineCollection({
    loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/travel' }),
    schema: z.object({
        title: z.string(),
        tags: z.array(z.string()),
        pubDate: z.coerce.date(),
    }),
});

export const collections = { posts, projects, travel };
