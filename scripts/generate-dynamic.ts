import Anthropic from '@anthropic-ai/sdk';
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, basename } from 'path';
import { type GameData } from './steam-api.js';
import {
  CONTENT_DIR,
  type ArticleRequest,
  slugify,
  generateArticle,
  writeArticle,
  getRandomNewsTopic,
} from './shared.js';
import { loadCache } from './fetch-trending.js';
import { checkQuality } from './quality-check.js';

interface GenerateLog {
  timestamp: string;
  generated: { slug: string; type: string; game: string; quality: number; path: string | null }[];
  skipped: { slug: string; reason: string }[];
  errors: { slug: string; error: string }[];
}

function getPublishedSlugs(): Set<string> {
  const slugs = new Set<string>();
  const dirs = ['news', 'reviews', 'guides'];
  for (const dir of dirs) {
    const fullDir = join(CONTENT_DIR, dir);
    if (!existsSync(fullDir)) continue;
    for (const file of readdirSync(fullDir)) {
      if (file.endsWith('.md')) {
        slugs.add(file.replace('.md', ''));
      }
    }
  }
  return slugs;
}

function buildRequests(games: GameData[], diversify = true): ArticleRequest[] {
  const requests: ArticleRequest[] = [];

  for (const game of games) {
    const players = game.currentPlayers ?? 0;
    const tags = [game.name, ...game.genres.slice(0, 3)];
    if (game.developers[0]) tags.push(game.developers[0]);
    const safeTags = tags.slice(0, 8);

    // Use diverse topic templates instead of fixed "Latest Updates and Player Trends"
    const newsTopic = diversify
      ? getRandomNewsTopic(game.name)
      : `${game.name} Latest Updates and Player Trends`;

    requests.push({
      type: 'news',
      gameTitle: game.name,
      steamAppId: game.appId,
      topic: newsTopic,
      category: 'news',
      tags: safeTags,
    });

    // Generate multiple news articles per game with different topics
    if (diversify && players > 5000) {
      requests.push({
        type: 'news',
        gameTitle: game.name,
        steamAppId: game.appId,
        topic: getRandomNewsTopic(game.name),
        category: 'update',
        tags: safeTags,
      });
    }

    if (players > 10000 || game.totalReviews! > 5000) {
      requests.push({
        type: 'review',
        gameTitle: game.name,
        steamAppId: game.appId,
        topic: `${game.name} Review`,
        category: 'review',
        tags: safeTags,
      });
    }

    if (players > 50000 || game.totalReviews! > 20000) {
      requests.push({
        type: 'guide',
        gameTitle: game.name,
        steamAppId: game.appId,
        topic: `${game.name} Beginner Guide and Tips`,
        category: 'guide',
        tags: safeTags,
      });
    }
  }

  return requests;
}

function parseArgs(): { limit: number; dryRun: boolean } {
  let limit = 10;
  let dryRun = false;

  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === '--limit' && process.argv[i + 1]) {
      limit = parseInt(process.argv[i + 1], 10);
      i++;
    }
    if (process.argv[i] === '--dry-run') {
      dryRun = true;
    }
  }

  return { limit, dryRun };
}

async function main() {
  const { limit, dryRun } = parseArgs();

  const games = loadCache();
  if (games.length === 0) {
    console.error('No trending games in cache. Run `npm run fetch-trending` first.');
    process.exit(1);
  }

  console.log(`Loaded ${games.length} trending games from cache`);

  const allRequests = buildRequests(games);
  const published = getPublishedSlugs();

  const newRequests = allRequests.filter((req) => {
    const slug = slugify(req.topic || req.gameTitle);
    return !published.has(slug);
  });

  const toGenerate = newRequests.slice(0, limit);

  console.log(`${allRequests.length} total requests, ${newRequests.length} new, generating ${toGenerate.length}`);

  if (dryRun) {
    console.log('\n[DRY RUN] Would generate:');
    for (const req of toGenerate) {
      const slug = slugify(req.topic || req.gameTitle);
      console.log(`  [${req.type}] ${slug} — ${req.gameTitle}`);
    }
    return;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY not set.');
    process.exit(1);
  }

  const client = new Anthropic();
  const baseUrl = process.env.ANTHROPIC_BASE_URL;
  if (baseUrl) console.log(`Using API endpoint: ${baseUrl}`);
  console.log(`Using model: ${process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514'}`);
  const log: GenerateLog = {
    timestamp: new Date().toISOString(),
    generated: [],
    skipped: [],
    errors: [],
  };

  for (const req of toGenerate) {
    const slug = slugify(req.topic || req.gameTitle);
    console.log(`\nGenerating [${req.type}]: ${slug}...`);

    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const article = await generateArticle(client, req);
        const quality = checkQuality(article.body);

        console.log(`  Quality: ${quality.score}/100 (${quality.passed ? 'PASS' : 'FAIL'})`);

        if (!quality.passed && attempts < maxAttempts) {
          console.log(`  Retrying (attempt ${attempts + 1})...`);
          await new Promise((r) => setTimeout(r, 2000));
          continue;
        }

        const filePath = writeArticle(article, req.type);
        log.generated.push({
          slug,
          type: req.type,
          game: req.gameTitle,
          quality: quality.score,
          path: filePath,
        });

        if (quality.issues.length > 0) {
          console.log(`  Issues: ${quality.issues.join('; ')}`);
        }

        await new Promise((r) => setTimeout(r, 2000));
        break;
      } catch (err: any) {
        if (attempts >= maxAttempts) {
          console.error(`  Error: ${err.message}`);
          log.errors.push({ slug, error: err.message });
        }
      }
    }
  }

  const logsDir = join(process.cwd(), 'logs');
  if (!existsSync(logsDir)) mkdirSync(logsDir, { recursive: true });
  writeFileSync(
    join(logsDir, 'generate-log.json'),
    JSON.stringify(log, null, 2),
    'utf-8',
  );

  console.log(`\nDone. Generated: ${log.generated.length}, Errors: ${log.errors.length}`);
}

main().catch(console.error);
