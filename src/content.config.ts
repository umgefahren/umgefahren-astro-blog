import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const postSchema = z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    // Stubs are kept in their category listing but hidden from the home page.
    stub: z.boolean().optional().default(false),
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
        summary: z.string().optional(),
        stub: z.boolean().optional().default(false),
    }),
});

export const collections = { posts, projects, travel };
