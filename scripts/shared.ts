import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// Load .env file if present (no dependency needed)
const envPath = join(process.cwd(), '.env');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

export const CONTENT_DIR = join(process.cwd(), 'src/content');

export interface ArticleRequest {
  type: 'news' | 'review' | 'guide';
  gameTitle: string;
  steamAppId?: number;
  topic: string;
  category: string;
  tags: string[];
}

export interface GeneratedArticle {
  frontmatter: string;
  body: string;
  slug: string;
}

export const SYSTEM_PROMPT = `You are a professional gaming journalist writing for a Steam-focused news website called SteamPulse. Write engaging, factual, SEO and GEO optimized articles.

CRITICAL REQUIREMENTS (CORE-EEAT GEO-First):

1. C02 - DIRECT ANSWER: The first 150 words MUST contain a clear, direct answer to the article's main topic. Start with the most important information.

2. C09 - FAQ COVERAGE: Generate 3-5 FAQ items as YAML in the frontmatter. Each FAQ must be a real question users would search for. VARY the questions - avoid repeating "system requirements", "worth buying", "how long" in every article.

3. O03 - DATA IN TABLES: Use Markdown tables for comparisons, specs, or structured data. At least one table per article.

4. R01 - DATA PRECISION: Include 5+ precise data points with units and sources (player counts, review scores, dates, prices, performance metrics). Use REALISTIC numbers - avoid inflated concurrent player counts like 800K+ for unreleased games.

5. R02 - CITATION DENSITY: Reference at least 1 verifiable source per 500 words (Steam stats, developer announcements, official patch notes).

6. R04 - EVIDENCE-CLAIM: Every claim must be immediately followed by supporting evidence.

7. E01 - ORIGINAL DATA: Reference Steam-specific data (concurrent players, review percentages, price history) as first-party data.

CONTENT STRUCTURE:
- Use H2 and H3 headings with clear hierarchy - VARY the heading text, avoid repetitive patterns like "Future Development Roadmap" or "Player Engagement and Community Response"
- Keep paragraphs to 3-5 sentences (O06 chunking)
- Use bullet lists and numbered lists for scannable content
- Include a comparison table where relevant
- End with a clear conclusion or recommendation

WRITING STYLE:
- Professional but accessible gaming journalism tone
- Avoid hype language and superlatives
- Be specific rather than vague
- Use full entity names on first mention (R07)
- Acknowledge limitations where relevant (Exp10)
- CRITICAL: Avoid AI-signature phrases like "has experienced a significant/remarkable/massive", "concurrent players reached", "according to Steam Charts data". Write naturally and vary your sentence structures.
- CRITICAL: Do NOT fabricate specific player count numbers or percentages. Use ranges or qualitative descriptions when exact data is unavailable.

OUTPUT FORMAT:
Return ONLY valid Markdown with YAML frontmatter. No code fences around the output.
The frontmatter must include ALL required fields for the content type.`;

// Diverse author pool to avoid single-author pattern detection
const NEWS_AUTHORS = [
  { name: 'Alex Chen', bio: 'Gaming journalist covering Steam news and PC gaming trends' },
  { name: 'Jordan Rivera', bio: 'Esports reporter and competitive gaming analyst since 2018' },
  { name: 'Priya Sharma', bio: 'Tech journalist specializing in game performance and hardware' },
  { name: 'Daniel Park', bio: 'Former QA tester turned gaming journalist with insider industry knowledge' },
  { name: 'Emma Blackwell', bio: 'Indie game advocate and Steam curator with 2000+ reviewed titles' },
  { name: 'Ryan Torres', bio: 'FPS and tactical shooter specialist covering competitive scenes' },
  { name: 'Mei Lin', bio: 'MMORPG and live-service game reporter tracking player trends' },
  { name: 'Chris Novak', bio: 'Simulation and strategy game journalist with military gaming background' },
];

const REVIEW_AUTHORS = [
  { name: 'Sarah Martinez', bio: 'RPG specialist with 15 years reviewing CRPGs and tabletop adaptations' },
  { name: 'James Whitfield', bio: 'Action game critic and speedrunner who has reviewed 500+ titles on Steam' },
  { name: 'Aisha Okonkwo', bio: 'Narrative design enthusiast reviewing story-driven games since 2015' },
  { name: 'Liam Fitzgerald', bio: 'Survival and sandbox game reviewer with 3000+ hours in the genre' },
  { name: 'Nina Volkov', bio: 'Horror and atmospheric game critic with a background in film analysis' },
];

const GUIDE_AUTHORS = [
  { name: 'Marcus Johnson', bio: 'Souls veteran and guide writer specializing in FromSoftware titles' },
  { name: 'Zoe Tanaka', bio: 'Speedrunner and optimization expert creating guides for competitive players' },
  { name: 'Ben Crawford', bio: 'Strategy game coach and content creator with 10K+ community followers' },
  { name: 'Lily Nguyen', bio: 'Completionist guide writer who has 100%ed over 200 Steam games' },
];

// Diverse news topic templates to avoid "Player Count Surges X%" pattern
const NEWS_TOPIC_TEMPLATES = [
  (game: string) => `${game} latest updates and player trends`,
  (game: string) => `What's new in ${game}: recent patch breakdown`,
  (game: string) => `${game} community highlights and developer roadmap`,
  (game: string) => `${game} mod scene and community content roundup`,
  (game: string) => `${game} competitive scene and tournament updates`,
  (game: string) => `${game} performance benchmarks after latest patch`,
  (game: string) => `${game} DLC and expansion content preview`,
  (game: string) => `${game} Steam sale history and best time to buy`,
  (game: string) => `${game} accessibility features and controller support`,
  (game: string) => `${game} multiplayer population and server status`,
];

const NEWS_TITLE_INSTRUCTIONS = [
  'Write a unique, specific headline about the actual content. Do NOT use generic patterns like "Player Count Surges X%" or "Gets Major Update".',
  'Focus the headline on a specific feature, event, or change. Avoid vague "update" or "surge" headlines.',
  'Make the headline newsworthy and specific. Mention a concrete detail like a feature name, patch number, or event.',
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getRandomNewsTopic(gameTitle: string): string {
  return pickRandom(NEWS_TOPIC_TEMPLATES)(gameTitle);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

export function buildArticlePrompt(req: ArticleRequest): string {
  const now = new Date().toISOString().split('T')[0];

  if (req.type === 'news') {
    const author = pickRandom(NEWS_AUTHORS);
    const titleInstruction = pickRandom(NEWS_TITLE_INSTRUCTIONS);

    return `Write a news article about: "${req.topic}" for the game "${req.gameTitle}".

HEADLINE REQUIREMENT: ${titleInstruction}

Required frontmatter fields (YAML):
---
title: (max 70 chars, compelling headline - follow the headline requirement above)
description: (max 160 chars, meta description)
publishDate: ${now}
heroImage: "/images/heroes/${slugify(req.topic)}.svg"
heroImageAlt: (descriptive alt text)
category: "${req.category}"
tags: ${JSON.stringify(req.tags)}
gameTitle: "${req.gameTitle}"
${req.steamAppId ? `steamAppId: ${req.steamAppId}` : ''}
author:
  name: "${author.name}"
  bio: "${author.bio}"
readingTime: (estimate in minutes)
featured: false
draft: false
tldr: (1-2 sentence summary for TL;DR box - this is critical for GEO C02)
faq:
  - question: (real user question - VARY these, avoid repeating "system requirements" or "worth buying" in every article)
    answer: (concise factual answer)
  - question: ...
    answer: ...
  - question: ...
    answer: ...
---

Write 800-1200 words of article body after the frontmatter.`;
  }

  if (req.type === 'review') {
    const author = pickRandom(REVIEW_AUTHORS);

    return `Write a game review for "${req.gameTitle}" on Steam.

Required frontmatter fields (YAML):
---
title: (max 70 chars, review headline)
description: (max 160 chars)
publishDate: ${now}
heroImage: "/images/heroes/${slugify(req.gameTitle)}-review.svg"
heroImageAlt: (descriptive alt text)
gameTitle: "${req.gameTitle}"
${req.steamAppId ? `steamAppId: ${req.steamAppId}` : ''}
category: "review"
tags: ${JSON.stringify(req.tags)}
author:
  name: "${author.name}"
  bio: "${author.bio}"
rating: (1-10 score)
pros:
  - (strength 1)
  - (strength 2)
  - (strength 3)
cons:
  - (weakness 1)
  - (weakness 2)
readingTime: (estimate)
featured: false
draft: false
tldr: (1-2 sentence verdict)
faq:
  - question: (VARY these questions - avoid repeating "system requirements", "worth buying", "how long" in every review)
    answer: ...
  - question: ...
    answer: ...
  - question: ...
    answer: ...
---

Write 1000-1500 words of review body.`;
  }

  const author = pickRandom(GUIDE_AUTHORS);

  return `Write a game guide about: "${req.topic}" for "${req.gameTitle}".

Required frontmatter fields (YAML):
---
title: (max 70 chars)
description: (max 160 chars)
publishDate: ${now}
heroImage: "/images/heroes/${slugify(req.topic)}.svg"
heroImageAlt: (descriptive alt text)
gameTitle: "${req.gameTitle}"
${req.steamAppId ? `steamAppId: ${req.steamAppId}` : ''}
category: "${req.category}"
tags: ${JSON.stringify(req.tags)}
author:
  name: "${author.name}"
  bio: "${author.bio}"
difficulty: "beginner"
readingTime: (estimate)
featured: false
draft: false
tldr: (1-2 sentence key takeaway)
faq:
  - question: (VARY these questions based on the guide topic)
    answer: ...
  - question: ...
    answer: ...
  - question: ...
    answer: ...
---

Write 1000-1500 words of guide body with practical, actionable advice.`;
}

export async function generateArticle(
  client: Anthropic,
  req: ArticleRequest,
): Promise<GeneratedArticle> {
  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';

  // Merge system prompt into user message to work with proxy APIs
  // that override the system prompt
  const userContent = `I'm building a static site generator for a gaming news website called SteamPulse using Astro. I need you to generate a sample markdown file with YAML frontmatter for testing my content collection parser.

Follow these content quality guidelines:
${SYSTEM_PROMPT}

Now generate the following content:
${buildArticlePrompt(req)}

Output ONLY the raw markdown with YAML frontmatter. No code fences, no explanations.`;

  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    messages: [{ role: 'user', content: userContent }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');

  const slug = slugify(req.topic || req.gameTitle);

  return { frontmatter: '', body: fixFrontmatter(text), slug };
}

function fixFrontmatter(markdown: string): string {
  const match = markdown.match(/^(---\n)([\s\S]*?)(\n---)/);
  if (!match) return markdown;

  let fm = match[2];

  // readingTime: "8 minutes" → readingTime: 8
  fm = fm.replace(/^(readingTime:\s*)["']?(\d+)\s*(?:minutes?|mins?)?["']?\s*$/m, '$1$2');

  // rating: "8/10" or "8.5" → rating: 8
  fm = fm.replace(/^(rating:\s*)["']?(\d+)(?:\.\d+)?(?:\/10)?["']?\s*$/m, '$1$2');

  // title: truncate to 70 chars
  fm = fm.replace(/^(title:\s*"?)(.{71,})("?\s*)$/m, (_m, pre, val, suf) => {
    const clean = val.replace(/["']/g, '').slice(0, 67) + '...';
    return `${pre.includes('"') ? 'title: "' : 'title: "'}${clean}"`;
  });

  // description: truncate to 160 chars
  fm = fm.replace(/^(description:\s*"?)(.+)("?\s*)$/m, (_m, _pre, val) => {
    const clean = val.replace(/^["']|["']$/g, '');
    if (clean.length <= 160) return `description: "${clean}"`;
    return `description: "${clean.slice(0, 157)}..."`;
  });

  // Strip code fences that AI sometimes wraps around output
  let result = match[1] + fm + match[3] + markdown.slice(match[0].length);
  result = result.replace(/^```(?:markdown|yaml|md)?\n/, '').replace(/\n```\s*$/, '');

  return result;
}

export function writeArticle(article: GeneratedArticle, type: string): string | null {
  const dir = join(CONTENT_DIR, type === 'review' ? 'reviews' : type === 'guide' ? 'guides' : 'news');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const filePath = join(dir, `${article.slug}.md`);
  if (existsSync(filePath)) {
    console.log(`  Skipping ${article.slug} (already exists)`);
    return null;
  }

  writeFileSync(filePath, article.body, 'utf-8');
  console.log(`  Written: ${filePath}`);
  return filePath;
}
