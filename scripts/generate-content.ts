import Anthropic from '@anthropic-ai/sdk';
import { existsSync } from 'fs';
import { join } from 'path';
import {
  CONTENT_DIR,
  type ArticleRequest,
  slugify,
  generateArticle,
  writeArticle,
} from './shared.js';

const DEFAULT_REQUESTS: ArticleRequest[] = [
  {
    type: 'news',
    gameTitle: 'Helldivers 2',
    steamAppId: 553850,
    topic: 'Helldivers 2 Breaks 450K Concurrent Players on Steam',
    category: 'news',
    tags: ['Helldivers 2', 'Co-op', 'Arrowhead', 'PlayStation PC'],
  },
  {
    type: 'news',
    gameTitle: 'Palworld',
    steamAppId: 1623730,
    topic: 'Palworld Early Access Roadmap Reveals PvP and New Biomes',
    category: 'update',
    tags: ['Palworld', 'Survival', 'Early Access', 'Pocketpair'],
  },
  {
    type: 'review',
    gameTitle: 'Hades II',
    steamAppId: 1145350,
    topic: 'Hades II Early Access Review',
    category: 'review',
    tags: ['Hades II', 'Roguelike', 'Supergiant Games', 'Action'],
  },
  {
    type: 'guide',
    gameTitle: 'Lethal Company',
    steamAppId: 1966720,
    topic: 'Lethal Company Best Strategies for Solo and Team Play',
    category: 'guide',
    tags: ['Lethal Company', 'Horror', 'Co-op', 'Indie'],
  },
  {
    type: 'news',
    gameTitle: 'Steam',
    topic: 'Steam Spring Sale 2024 Best Deals Under $10',
    category: 'event',
    tags: ['Steam Sale', 'Deals', 'PC Gaming', 'Budget'],
  },
];

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('No ANTHROPIC_API_KEY set. Writing placeholder content only.');
    console.log('Set ANTHROPIC_API_KEY in .env to enable AI content generation.\n');
    return;
  }

  const client = new Anthropic();
  const baseUrl = process.env.ANTHROPIC_BASE_URL;
  if (baseUrl) console.log(`Using API endpoint: ${baseUrl}`);

  console.log(`Generating ${DEFAULT_REQUESTS.length} articles...\n`);

  for (const req of DEFAULT_REQUESTS) {
    const slug = slugify(req.topic || req.gameTitle);
    const dir = req.type === 'review' ? 'reviews' : req.type === 'guide' ? 'guides' : 'news';
    const filePath = join(CONTENT_DIR, dir, `${slug}.md`);

    if (existsSync(filePath)) {
      console.log(`Skipping "${req.topic}" (already exists)`);
      continue;
    }

    console.log(`Generating: "${req.topic}"...`);
    try {
      const article = await generateArticle(client, req);
      writeArticle(article, req.type);
      await new Promise((r) => setTimeout(r, 2000));
    } catch (err) {
      console.error(`  Error generating "${req.topic}":`, err);
    }
  }

  console.log('\nContent generation complete.');
}

main().catch(console.error);
