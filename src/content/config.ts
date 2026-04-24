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

// Base schemas with language field
const newsSchema = z.object({
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
  language: z.string().default('en'),
  originalSlug: z.string().optional(),
});

const reviewSchema = z.object({
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
  language: z.string().default('en'),
  originalSlug: z.string().optional(),
});

const guideSchema = z.object({
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
  language: z.string().default('en'),
  originalSlug: z.string().optional(),
});

// English collections (existing)
const newsCollection = defineCollection({ type: 'content', schema: newsSchema });
const reviewsCollection = defineCollection({ type: 'content', schema: reviewSchema });
const guidesCollection = defineCollection({ type: 'content', schema: guideSchema });

// Translated collections (zh, ja, ko, es, fr, de, pt, ru, ar, tr)
const newsZh = defineCollection({ type: 'content', schema: newsSchema });
const newsJa = defineCollection({ type: 'content', schema: newsSchema });
const newsKo = defineCollection({ type: 'content', schema: newsSchema });
const newsEs = defineCollection({ type: 'content', schema: newsSchema });
const newsFr = defineCollection({ type: 'content', schema: newsSchema });
const newsDe = defineCollection({ type: 'content', schema: newsSchema });
const newsPt = defineCollection({ type: 'content', schema: newsSchema });
const newsRu = defineCollection({ type: 'content', schema: newsSchema });
const newsAr = defineCollection({ type: 'content', schema: newsSchema });
const newsTr = defineCollection({ type: 'content', schema: newsSchema });

const reviewsZh = defineCollection({ type: 'content', schema: reviewSchema });
const reviewsJa = defineCollection({ type: 'content', schema: reviewSchema });
const reviewsKo = defineCollection({ type: 'content', schema: reviewSchema });
const reviewsEs = defineCollection({ type: 'content', schema: reviewSchema });
const reviewsFr = defineCollection({ type: 'content', schema: reviewSchema });
const reviewsDe = defineCollection({ type: 'content', schema: reviewSchema });
const reviewsPt = defineCollection({ type: 'content', schema: reviewSchema });
const reviewsRu = defineCollection({ type: 'content', schema: reviewSchema });
const reviewsAr = defineCollection({ type: 'content', schema: reviewSchema });
const reviewsTr = defineCollection({ type: 'content', schema: reviewSchema });

const guidesZh = defineCollection({ type: 'content', schema: guideSchema });
const guidesJa = defineCollection({ type: 'content', schema: guideSchema });
const guidesKo = defineCollection({ type: 'content', schema: guideSchema });
const guidesEs = defineCollection({ type: 'content', schema: guideSchema });
const guidesFr = defineCollection({ type: 'content', schema: guideSchema });
const guidesDe = defineCollection({ type: 'content', schema: guideSchema });
const guidesPt = defineCollection({ type: 'content', schema: guideSchema });
const guidesRu = defineCollection({ type: 'content', schema: guideSchema });
const guidesAr = defineCollection({ type: 'content', schema: guideSchema });
const guidesTr = defineCollection({ type: 'content', schema: guideSchema });

export const collections = {
  news: newsCollection,
  reviews: reviewsCollection,
  guides: guidesCollection,
  'news-zh': newsZh,
  'news-ja': newsJa,
  'news-ko': newsKo,
  'news-es': newsEs,
  'news-fr': newsFr,
  'news-de': newsDe,
  'news-pt': newsPt,
  'news-ru': newsRu,
  'news-ar': newsAr,
  'news-tr': newsTr,
  'reviews-zh': reviewsZh,
  'reviews-ja': reviewsJa,
  'reviews-ko': reviewsKo,
  'reviews-es': reviewsEs,
  'reviews-fr': reviewsFr,
  'reviews-de': reviewsDe,
  'reviews-pt': reviewsPt,
  'reviews-ru': reviewsRu,
  'reviews-ar': reviewsAr,
  'reviews-tr': reviewsTr,
  'guides-zh': guidesZh,
  'guides-ja': guidesJa,
  'guides-ko': guidesKo,
  'guides-es': guidesEs,
  'guides-fr': guidesFr,
  'guides-de': guidesDe,
  'guides-pt': guidesPt,
  'guides-ru': guidesRu,
  'guides-ar': guidesAr,
  'guides-tr': guidesTr,
};
