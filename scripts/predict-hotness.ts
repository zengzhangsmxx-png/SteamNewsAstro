import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { getPlayerCount, getReviewSummary, getAppNews, getAppDetails } from './steam-api.js';
import { loadCache } from './fetch-trending.js';

const CACHE_DIR = join(process.cwd(), 'cache');
const HISTORY_FILE = join(CACHE_DIR, 'player-history.json');
const PREDICTION_FILE = join(CACHE_DIR, 'predictions.json');

interface PlayerSnapshot {
  appId: number;
  name: string;
  players: number;
  timestamp: string;
}

interface PlayerHistory {
  snapshots: PlayerSnapshot[];
}

interface Prediction {
  appId: number;
  name: string;
  score: number;
  signals: string[];
  currentPlayers: number;
  playerGrowth: number | null;
  reviewMomentum: number | null;
  newsActivity: number;
  timestamp: string;
}

function loadHistory(): PlayerHistory {
  if (!existsSync(HISTORY_FILE)) return { snapshots: [] };
  try {
    return JSON.parse(readFileSync(HISTORY_FILE, 'utf-8'));
  } catch { return { snapshots: [] }; }
}

function saveHistory(history: PlayerHistory): void {
  if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
  const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
  history.snapshots = history.snapshots.filter(s => new Date(s.timestamp).getTime() > cutoff);
  writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf-8');
}

function getPlayerGrowth(history: PlayerHistory, appId: number): number | null {
  const snaps = history.snapshots
    .filter(s => s.appId === appId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  if (snaps.length < 2) return null;

  const oldest = snaps[0].players;
  const newest = snaps[snaps.length - 1].players;
  if (oldest === 0) return null;

  return ((newest - oldest) / oldest) * 100;
}

async function collectSnapshot(games: { appId: number; name: string }[]): Promise<PlayerSnapshot[]> {
  const snapshots: PlayerSnapshot[] = [];
  const now = new Date().toISOString();

  for (const game of games) {
    const players = await getPlayerCount(game.appId);
    if (players !== null) {
      snapshots.push({ appId: game.appId, name: game.name, players, timestamp: now });
    }
    await new Promise(r => setTimeout(r, 500));
  }

  return snapshots;
}

async function predictHotness(games: { appId: number; name: string }[], history: PlayerHistory): Promise<Prediction[]> {
  const predictions: Prediction[] = [];

  for (const game of games) {
    let score = 0;
    const signals: string[] = [];

    const players = await getPlayerCount(game.appId);
    const reviews = await getReviewSummary(game.appId);
    const news = await getAppNews(game.appId, 10);
    await new Promise(r => setTimeout(r, 800));

    const currentPlayers = players || 0;

    // Signal 1: Player growth trend (0-30 points)
    const growth = getPlayerGrowth(history, game.appId);
    if (growth !== null) {
      if (growth > 50) { score += 30; signals.push(`player growth +${growth.toFixed(0)}%`); }
      else if (growth > 20) { score += 20; signals.push(`player growth +${growth.toFixed(0)}%`); }
      else if (growth > 5) { score += 10; signals.push(`player growth +${growth.toFixed(0)}%`); }
    }

    // Signal 2: High concurrent players (0-20 points)
    if (currentPlayers > 100000) { score += 20; signals.push(`${(currentPlayers / 1000).toFixed(0)}K concurrent`); }
    else if (currentPlayers > 50000) { score += 15; signals.push(`${(currentPlayers / 1000).toFixed(0)}K concurrent`); }
    else if (currentPlayers > 10000) { score += 10; signals.push(`${(currentPlayers / 1000).toFixed(0)}K concurrent`); }

    // Signal 3: Review momentum — high positive ratio with volume (0-20 points)
    let reviewMomentum: number | null = null;
    if (reviews) {
      const pct = Math.round((reviews.total_positive / reviews.total_reviews) * 100);
      reviewMomentum = pct;
      if (pct >= 95 && reviews.total_reviews > 10000) { score += 20; signals.push(`${pct}% positive (${(reviews.total_reviews / 1000).toFixed(0)}K reviews)`); }
      else if (pct >= 90 && reviews.total_reviews > 5000) { score += 15; signals.push(`${pct}% positive`); }
      else if (pct >= 80) { score += 10; signals.push(`${pct}% positive`); }
    }

    // Signal 4: Recent news activity (0-15 points)
    const recentNews = news.filter(n => {
      const age = Date.now() - n.date * 1000;
      return age < 7 * 24 * 60 * 60 * 1000;
    });
    if (recentNews.length >= 5) { score += 15; signals.push(`${recentNews.length} news items this week`); }
    else if (recentNews.length >= 3) { score += 10; signals.push(`${recentNews.length} news items this week`); }
    else if (recentNews.length >= 1) { score += 5; signals.push(`${recentNews.length} news this week`); }

    // Signal 5: Upcoming content / DLC (0-15 points)
    const hasUpdateNews = news.some(n =>
      /update|patch|dlc|expansion|season|chapter/i.test(n.title) &&
      (Date.now() - n.date * 1000) < 14 * 24 * 60 * 60 * 1000
    );
    if (hasUpdateNews) { score += 15; signals.push('recent update/DLC announcement'); }

    predictions.push({
      appId: game.appId,
      name: game.name,
      score,
      signals,
      currentPlayers,
      playerGrowth: growth,
      reviewMomentum,
      newsActivity: recentNews.length,
      timestamp: new Date().toISOString(),
    });
  }

  return predictions.sort((a, b) => b.score - a.score);
}

async function main() {
  const args = process.argv.slice(2);
  const topN = parseInt(args.find(a => a.startsWith('--top'))?.split('=')[1] || args[args.indexOf('--top') + 1] || '20');
  const snapshotOnly = args.includes('--snapshot');

  const games = loadCache();
  if (games.length === 0) {
    console.error('No cached games. Run fetch-trending first.');
    process.exit(1);
  }

  console.log(`\nGame Hotness Predictor`);
  console.log(`  Games in cache: ${games.length}`);
  console.log(`  Top N: ${topN}\n`);

  const history = loadHistory();
  console.log(`  Historical snapshots: ${history.snapshots.length}`);

  // Collect current player snapshot
  console.log('\nCollecting player snapshots...');
  const newSnapshots = await collectSnapshot(games.map(g => ({ appId: g.appId, name: g.name })));
  history.snapshots.push(...newSnapshots);
  saveHistory(history);
  console.log(`  Saved ${newSnapshots.length} snapshots (${history.snapshots.length} total)\n`);

  if (snapshotOnly) {
    console.log('Snapshot-only mode, skipping prediction.');
    return;
  }

  console.log('Analyzing hotness signals...\n');
  const predictions = await predictHotness(
    games.map(g => ({ appId: g.appId, name: g.name })),
    history,
  );

  const top = predictions.slice(0, topN);

  console.log(`Top ${topN} Hottest Games:`);
  console.log(`${'='.repeat(70)}`);
  for (let i = 0; i < top.length; i++) {
    const p = top[i];
    const rank = `#${i + 1}`.padStart(3);
    console.log(`${rank}  ${p.name} (${p.appId}) — Score: ${p.score}/100`);
    console.log(`      Players: ${p.currentPlayers.toLocaleString()} | Growth: ${p.playerGrowth !== null ? `${p.playerGrowth.toFixed(1)}%` : 'N/A'}`);
    console.log(`      Signals: ${p.signals.join(', ') || 'none'}`);
  }

  if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(PREDICTION_FILE, JSON.stringify({ timestamp: new Date().toISOString(), predictions: top }, null, 2), 'utf-8');
  console.log(`\nPredictions saved to ${PREDICTION_FILE}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
