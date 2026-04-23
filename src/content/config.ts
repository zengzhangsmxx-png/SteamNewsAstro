import { defineCollection, z } from 'astro:content';

const authorSchema = z.object({
  name: z.string(),
  bio: z.string(),
  avatar: z.string().optional(),
});

const faqSchema = z.array(z.object({
  question: z.string(),
  answer: z.string(),
})).optional();

const newsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().max(70),
    description: z.string().max(160),
    publishDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    heroImage: z.string(),
    heroImageAlt: z.string(),
    category: z.enum(['news', 'update', 'release', 'event', 'esports']),
    tags: z.array(z.string()).min(1).max(8),
    gameTitle: z.string(),
    steamAppId: z.number().optional(),
    author: authorSchema,
    readingTime: z.number(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    tldr: z.string().optional(),
    faq: faqSchema,
  }),
});

const reviewsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().max(70),
    description: z.string().max(160),
    publishDate: z.coerce.date(),
    heroImage: z.string(),
    heroImageAlt: z.string(),
    gameTitle: z.string(),
    steamAppId: z.number().optional(),
    category: z.literal('review'),
    tags: z.array(z.string()),
    author: authorSchema,
    rating: z.number().min(1).max(10),
    pros: z.array(z.string()),
    cons: z.array(z.string()),
    readingTime: z.number(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    tldr: z.string().optional(),
    faq: faqSchema,
  }),
});

const guidesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().max(70),
    description: z.string().max(160),
    publishDate: z.coerce.date(),
    heroImage: z.string(),
    heroImageAlt: z.string(),
    gameTitle: z.string(),
    steamAppId: z.number().optional(),
    category: z.enum(['guide', 'tutorial', 'tips']),
    tags: z.array(z.string()),
    author: authorSchema,
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    readingTime: z.number(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    tldr: z.string().optional(),
    faq: faqSchema,
  }),
});

export const collections = {
  news: newsCollection,
  reviews: reviewsCollection,
  guides: guidesCollection,
};
