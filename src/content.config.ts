import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    status: z.enum(['active', 'paused', 'archived']),
    publishDate: z.coerce.date(),
    updateDate: z.coerce.date().optional(),
    domain: z.string().optional(),
    url: z.string().optional(),
    repo: z.string().optional(),
    statusPage: z.string().optional(),
    featured: z.boolean().default(false),
    order: z.number().default(100),
  }),
});

export const collections = { projects };
