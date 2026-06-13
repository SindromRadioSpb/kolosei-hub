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
    // Startup-positioning fields (all optional → existing entries unaffected)
    tagline: z.string().optional(),
    detailUrl: z.string().optional(),
    productType: z.enum(['product', 'research']).default('product'),
    version: z.string().optional(),
    gcpServices: z.array(z.string()).default([]),
    gcpPlanned: z.array(z.string()).default([]),
    screenshots: z.array(z.object({ src: z.string(), alt: z.string() })).default([]),
    changelog: z.array(z.object({ date: z.string(), text: z.string() })).default([]),
  }),
});

export const collections = { projects };
