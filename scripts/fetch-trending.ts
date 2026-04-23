import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { getTopSellers, getMultipleGameData, type GameData } from './steam-api.js';

const CACHE_DIR = join(process.cwd(), 'cache');
const CACHE_FILE = join(CACHE_DIR, 'trending.json');
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

interface TrendingCache {
  fetchedAt: string;
  games: GameData[];
}

function isCacheValid(): boolean {
  if (!existsSync(CACHE_FILE)) return false;
  try {
    const cache: TrendingCache = JSON.parse(readFileSync(CACHE_FILE, 'utf-8'));
    const age = Date.now() - new Date(cache.fetchedAt).getTime();
    return age < CACHE_TTL_MS && cache.games.length > 0;
  } catch {
    return false;
  }
}

export function loadCache(): GameData[] {
  if (!existsSync(CACHE_FILE)) return [];
  try {
    const cache: TrendingCache = JSON.parse(readFileSync(CACHE_FILE, 'utf-8'));
    return cache.games;
  } catch {
    return [];
  }
}

async function fetchNewReleasesAndSpecials(): Promise<number[]> {
  const url = 'https://store.steampowered.com/api/featuredcategories/?l=english';
  try {
    const res = await fetch(url);
    const json = await res.json();
    const newReleases: number[] = (json.new_releases?.items || []).map((i: any) => i.id);
    const specials: number[] = (json.specials?.items || []).map((i: any) => i.id);
    return [...newReleases, ...specials];
  } catch {
    return [];
  }
}

export async function fetchTrending(force = false): Promise<GameData[]> {
  if (!force && isCacheValid()) {
    console.log('Using cached trending data (< 6h old)');
    return loadCache();
  }

  console.log('Fetching trending games from Steam...');

  const topSellers = await getTopSellers();
  const extras = await fetchNewReleasesAndSpecials();

  const allIds = [...new Set([...topSellers, ...extras])];
  console.log(`Found ${allIds.length} unique app IDs (${topSellers.length} top sellers + extras)`);

  const gameMap = await getMultipleGameData(allIds, 1500);

  const filtered = Array.from(gameMap.values()).filter((g) => {
    if (!g.reviewPercentage || !g.totalReviews) return false;
    return g.reviewPercentage >= 70 && g.totalReviews >= 500;
  });

  filtered.sort((a, b) => (b.currentPlayers ?? 0) - (a.currentPlayers ?? 0));

  const cache: TrendingCache = {
    fetchedAt: new Date().toISOString(),
    games: filtered,
  };
  writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
  console.log(`Cached ${filtered.length} trending games to ${CACHE_FILE}`);

  return filtered;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const force = process.argv.includes('--force');
  const games = await fetchTrending(force);
  console.log(`\nTrending games (${games.length}):`);
  for (const g of games) {
    console.log(`  ${g.name} (${g.appId}) — ${g.currentPlayers?.toLocaleString() ?? '?'} players, ${g.reviewPercentage}% positive (${g.totalReviews} reviews)`);
  }
}
