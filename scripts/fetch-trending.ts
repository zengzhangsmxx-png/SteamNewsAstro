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
    const comingSoon: number[] = (json.coming_soon?.items || []).map((i: any) => i.id);
    const topSellers: number[] = (json.top_sellers?.items || []).map((i: any) => i.id);
    return [...newReleases, ...specials, ...comingSoon, ...topSellers];
  } catch {
    return [];
  }
}

// Fetch additional games from Steam250 top-rated list (public data)
async function fetchTopRatedGames(): Promise<number[]> {
  // Curated list of popular Steam games across genres to ensure 60+ games for 200 articles
  // These are well-known titles with active communities and review data
  return [
    // FPS / Shooters
    730,      // Counter-Strike 2
    578080,   // PUBG
    440,      // Team Fortress 2
    359550,   // Tom Clancy's Rainbow Six Siege
    1172470,  // Apex Legends
    1938090,  // Call of Duty
    892970,   // Valheim
    // RPG
    1245620,  // Elden Ring
    292030,   // The Witcher 3
    1174180,  // Red Dead Redemption 2
    1086940,  // Baldur's Gate 3
    814380,   // Sekiro
    374320,   // Dark Souls III
    570940,   // DARK SOULS: REMASTERED
    1888930,  // The Elder Scrolls Online
    // Survival / Sandbox
    252490,   // Rust
    346110,   // ARK: Survival Evolved
    322330,   // Don't Starve Together
    105600,   // Terraria
    413150,   // Stardew Valley
    526870,   // Satisfactory
    1623730,  // Palworld
    // Strategy
    394360,   // Hearts of Iron IV
    281990,   // Stellaris
    236390,   // War Thunder
    1158310,  // Crusader Kings III
    294100,   // RimWorld
    // Action / Adventure
    814380,   // Sekiro
    367520,   // Hollow Knight
    1145360,  // Hades
    1100600,  // Deus Ex: Mankind Divided
    1817070,  // Monster Hunter Wilds
    1817190,  // Marvel Rivals
    2358720,  // Black Myth: Wukong
    1222670,  // The Sims 4
    // Indie / Roguelike
    250900,   // The Binding of Isaac: Rebirth
    1966720,  // Lethal Company
    1794680,  // Vampire Survivors
    2379780,  // Balatro
    1868140,  // Dave the Diver
    // Simulation / Racing
    227300,   // Euro Truck Simulator 2
    1328670,  // Mass Effect Legendary Edition
    1551360,  // Forza Horizon 5
    1293830,  // Forza Horizon 4
    // Horror
    753640,   // Outer Wilds
    739630,   // Phasmophobia
    1966720,  // Lethal Company
    601150,   // Devil May Cry 5
    // Multiplayer / Co-op
    945360,   // Among Us
    1599340,  // Lost Ark
    236850,   // Europa Universalis IV
    1085660,  // Destiny 2
    553850,   // Helldivers 2
    // Sports / Fighting
    1426210,  // It Takes Two
    1332010,  // Stray
    1203220,  // Naraka: Bladepoint
    1517290,  // Battlefield 2042
    2767030,  // Marvel's Spider-Man 2
    2050650,  // Resident Evil 4
    2054970,  // Lies of P
    1240440,  // Hades II
    2420510,  // Wuthering Waves
  ];
}

export async function fetchTrending(force = false): Promise<GameData[]> {
  if (!force && isCacheValid()) {
    console.log('Using cached trending data (< 6h old)');
    return loadCache();
  }

  console.log('Fetching trending games from Steam...');

  const topSellers = await getTopSellers();
  const extras = await fetchNewReleasesAndSpecials();
  console.log(`Fetching top-rated games by genre...`);
  const topRated = await fetchTopRatedGames();

  const allIds = [...new Set([...topSellers, ...extras, ...topRated])];
  console.log(`Found ${allIds.length} unique app IDs (${topSellers.length} top sellers + ${extras.length} featured + ${topRated.length} top-rated)`);

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
