import { z, defineCollection } from 'astro:content'

const travelCollection = defineCollection({
    type: 'content',
    schema: z.object({
        title: z.string(),
        tags: z.array(z.string()),
        image: z.string().optional(),
        pubDate: z.date(),
    })
})


export const collections = {
    'travel': travelCollection,
};
