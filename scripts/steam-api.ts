/**
 * Steam Web API client for fetching game data.
 * Docs: https://partner.steamgames.com/doc/webapi
 *
 * Usage:
 *   STEAM_API_KEY=xxx tsx scripts/steam-api.ts
 *
 * Without API key, falls back to public store API endpoints.
 */

interface SteamAppDetails {
  name: string;
  steam_appid: number;
  short_description: string;
  header_image: string;
  genres: { id: string; description: string }[];
  categories: { id: number; description: string }[];
  release_date: { coming_soon: boolean; date: string };
  metacritic?: { score: number; url: string };
  recommendations?: { total: number };
  price_overview?: {
    currency: string;
    initial: number;
    final: number;
    discount_percent: number;
    final_formatted: string;
  };
  developers: string[];
  publishers: string[];
  platforms: { windows: boolean; mac: boolean; linux: boolean };
}

interface SteamNewsItem {
  gid: string;
  title: string;
  url: string;
  author: string;
  contents: string;
  date: number;
  feedlabel: string;
  feedname: string;
}

interface SteamPlayerCount {
  player_count: number;
  result: number;
}

interface SteamReviewSummary {
  query_summary: {
    num_reviews: number;
    review_score: number;
    review_score_desc: string;
    total_positive: number;
    total_negative: number;
    total_reviews: number;
  };
}

// --- Public API (no key required) ---

export async function getAppDetails(appId: number): Promise<SteamAppDetails | null> {
  const url = `https://store.steampowered.com/api/appdetails?appids=${appId}&l=english`;
  try {
    const res = await fetch(url);
    const json = await res.json();
    if (json[appId]?.success) {
      return json[appId].data as SteamAppDetails;
    }
    return null;
  } catch (e) {
    console.error(`Failed to fetch app details for ${appId}:`, e);
    return null;
  }
}

export async function getAppNews(appId: number, count = 5): Promise<SteamNewsItem[]> {
  const url = `https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=${appId}&count=${count}&maxlength=500&format=json`;
  try {
    const res = await fetch(url);
    const json = await res.json();
    return json.appnews?.newsitems || [];
  } catch (e) {
    console.error(`Failed to fetch news for ${appId}:`, e);
    return [];
  }
}

export async function getPlayerCount(appId: number): Promise<number | null> {
  const url = `https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${appId}&format=json`;
  try {
    const res = await fetch(url);
    const json = await res.json();
    const data = json.response as SteamPlayerCount;
    return data.result === 1 ? data.player_count : null;
  } catch {
    return null;
  }
}

export async function getReviewSummary(appId: number): Promise<SteamReviewSummary['query_summary'] | null> {
  const url = `https://store.steampowered.com/appreviews/${appId}?json=1&language=all&purchase_type=all&num_per_page=0`;
  try {
    const res = await fetch(url);
    const json = await res.json();
    return json.query_summary || null;
  } catch {
    return null;
  }
}

// --- Top sellers / trending (public) ---

export async function getTopSellers(): Promise<number[]> {
  // Steam featured endpoint returns current top sellers
  const url = 'https://store.steampowered.com/api/featuredcategories/?l=english';
  try {
    const res = await fetch(url);
    const json = await res.json();
    const topSellers = json.top_sellers?.items || [];
    return topSellers.map((item: any) => item.id as number).slice(0, 20);
  } catch {
    return [];
  }
}

// --- Aggregate game data for content generation ---

export interface GameData {
  appId: number;
  name: string;
  description: string;
  headerImage: string;
  genres: string[];
  developers: string[];
  publishers: string[];
  releaseDate: string;
  metacriticScore: number | null;
  reviewScore: string | null;
  reviewPercentage: number | null;
  totalReviews: number | null;
  currentPlayers: number | null;
  price: string | null;
  discount: number | null;
  platforms: { windows: boolean; mac: boolean; linux: boolean };
  recentNews: SteamNewsItem[];
}

export async function getGameData(appId: number): Promise<GameData | null> {
  const [details, players, reviews, news] = await Promise.all([
    getAppDetails(appId),
    getPlayerCount(appId),
    getReviewSummary(appId),
    getAppNews(appId, 3),
  ]);

  if (!details) return null;

  const reviewPct = reviews
    ? Math.round((reviews.total_positive / reviews.total_reviews) * 100)
    : null;

  return {
    appId: details.steam_appid,
    name: details.name,
    description: details.short_description,
    headerImage: details.header_image,
    genres: details.genres?.map((g) => g.description) || [],
    developers: details.developers || [],
    publishers: details.publishers || [],
    releaseDate: details.release_date?.date || 'TBA',
    metacriticScore: details.metacritic?.score || null,
    reviewScore: reviews?.review_score_desc || null,
    reviewPercentage: reviewPct,
    totalReviews: reviews?.total_reviews || null,
    currentPlayers: players,
    price: details.price_overview?.final_formatted || 'Free',
    discount: details.price_overview?.discount_percent || null,
    platforms: details.platforms || { windows: true, mac: false, linux: false },
    recentNews: news,
  };
}

// --- Batch fetch for multiple games ---

export async function getMultipleGameData(
  appIds: number[],
  delayMs = 1500,
): Promise<Map<number, GameData>> {
  const results = new Map<number, GameData>();

  for (const appId of appIds) {
    const data = await getGameData(appId);
    if (data) results.set(appId, data);

    // Rate limit: Steam API has ~200 requests/5min limit
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
  }

  return results;
}

// --- CLI: test the API ---

if (import.meta.url === `file://${process.argv[1]}`) {
  const testAppIds = [730, 1245620, 553850]; // CS2, Elden Ring, Helldivers 2

  console.log('Fetching Steam data...\n');

  for (const appId of testAppIds) {
    const data = await getGameData(appId);
    if (data) {
      console.log(`${data.name} (${data.appId})`);
      console.log(`  Genres: ${data.genres.join(', ')}`);
      console.log(`  Reviews: ${data.reviewScore} (${data.reviewPercentage}% of ${data.totalReviews})`);
      console.log(`  Players now: ${data.currentPlayers?.toLocaleString() || 'N/A'}`);
      console.log(`  Price: ${data.price}${data.discount ? ` (-${data.discount}%)` : ''}`);
      console.log(`  Recent news: ${data.recentNews.length} items`);
      console.log();
    } else {
      console.log(`Failed to fetch data for appId ${appId}\n`);
    }
  }
}
