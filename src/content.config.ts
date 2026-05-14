import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const travelCollection = defineCollection({
    loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/travel' }),
    schema: z.object({
        title: z.string(),
        tags: z.array(z.string()),
        pubDate: z.date(),
    }),
});

export const collections = {
    'travel': travelCollection,
};
