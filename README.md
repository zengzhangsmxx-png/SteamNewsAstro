# SteamNewsAstro

A production-ready Astro template for Steam gaming news websites, optimized for SEO and GEO (Generative Engine Optimization). Designed to be replicated 1000+ times with different configurations.

## Features

- **Astro 5 SSG** — Pure static site generation for maximum performance
- **Dark Gaming Theme** — Custom Steam-inspired design with distinctive typography
- **SEO/GEO Optimized** — Built-in JSON-LD schema, Open Graph, RSS, sitemap
- **Content Collections** — Type-safe content with Zod validation
- **AI Content Pipeline** — Claude API integration for automated article generation
- **Responsive Design** — Mobile-first with Tailwind CSS
- **Zero JS by Default** — Only loads JavaScript for interactive components

## Tech Stack

- **Framework**: Astro 5.7
- **Styling**: Tailwind CSS 3.4 + Custom Design System
- **Content**: Markdown + MDX with Content Collections
- **AI**: Claude API (Anthropic SDK)
- **Deployment**: Static output (Cloudflare Pages / Vercel / Netlify)

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
SteamNewsAstro/
├── src/
│   ├── content/          # Content Collections
│   │   ├── news/         # News articles
│   │   ├── reviews/      # Game reviews
│   │   └── guides/       # Game guides
│   ├── layouts/          # Page layouts
│   ├── components/
│   │   ├── seo/          # SEO components (Schema, OG, Breadcrumbs)
│   │   └── ui/           # UI components
│   ├── pages/            # Routes
│   └── styles/           # Global styles
├── scripts/              # Content generation scripts
├── public/               # Static assets
└── site.config.ts        # Site configuration
```

## Configuration

Edit `site.config.ts` to customize your site:

```typescript
export const siteConfig = {
  name: 'SteamPulse',
  url: 'https://steamnewsdaily.com',
  description: 'Your daily source for Steam gaming news...',
  
  steam: {
    appIds: [730, 570, 440],  // Games to cover
    categories: ['fps', 'rpg', 'strategy'],
    articlesPerBuild: 10,
  },
  
  theme: {
    accentColor: '#66c0f4',  // Steam blue
  },
  
  // ... more config
};
```

## AI Content Generation

The template includes a Claude API-powered content generation pipeline:

```bash
# Set API key
echo "ANTHROPIC_API_KEY=sk-ant-xxx" > .env

# Generate articles
npm run generate

# Generate + build
npm run generate:build
```

The generator creates SEO/GEO optimized articles following CORE-EEAT standards:
- Direct answers in first 150 words (C02)
- FAQ sections with schema markup (C09)
- Data tables for comparisons (O03)
- Precise statistics with sources (R01)
- Citation density (R02)

## SEO/GEO Features

### Automatic Schema Markup
- `NewsArticle` for news posts
- `Review` for game reviews
- `FAQPage` for FAQ sections
- `BreadcrumbList` for navigation
- `Organization` for brand identity

### Meta Tags
- Open Graph for social sharing
- Twitter Cards
- Canonical URLs
- RSS feed

### Performance
- Static HTML (no hydration)
- Self-hosted fonts with preload
- Optimized images with Astro Image
- Minimal JavaScript

## Content Types

### News Articles
```yaml
---
title: "Article Title"
description: "Meta description"
publishDate: 2024-03-15
category: "news" | "update" | "release" | "event" | "esports"
tags: ["tag1", "tag2"]
gameTitle: "Game Name"
steamAppId: 12345
tldr: "Quick summary"
faq:
  - question: "..."
    answer: "..."
---
```

### Reviews
```yaml
---
title: "Game Review"
category: "review"
rating: 8
pros: ["Pro 1", "Pro 2"]
cons: ["Con 1", "Con 2"]
---
```

### Guides
```yaml
---
title: "How to Guide"
category: "guide" | "tutorial" | "tips"
difficulty: "beginner" | "intermediate" | "advanced"
---
```

## Deployment

### Cloudflare Pages
```bash
npm run build
# Deploy dist/ folder
```

### Vercel
```bash
vercel --prod
```

### Netlify
```bash
netlify deploy --prod --dir=dist
```

## Replication for 1000+ Sites

1. **Clone the template**
2. **Edit `site.config.ts`** — Change name, URL, colors, game list
3. **Replace branding** — Update logo, favicon, OG image
4. **Generate content** — Run `npm run generate` with your API key
5. **Deploy** — Push to your hosting platform

All site-specific values are centralized in `site.config.ts` for easy replication.

## Design System

### Colors
- **Background**: `#0b0d12` (void), `#12151c` (surface)
- **Accent**: `#66c0f4` (Steam blue)
- **Hot**: `#ff6b35` (trending indicator)

### Typography
- **Display**: Rajdhani (headings)
- **Body**: Exo 2 (content)
- **Mono**: JetBrains Mono (code)

### Components
- Dark gaming aesthetic
- Glass morphism navigation
- Category color coding
- Hover glow effects

## License

MIT

## Credits

Built with:
- [Astro](https://astro.build)
- [Tailwind CSS](https://tailwindcss.com)
- [Anthropic Claude API](https://anthropic.com)
- SEO/GEO framework based on [CORE-EEAT](https://github.com/aaron-he-zhu/core-eeat-content-benchmark)
