/**
 * Hero image generator using VAP API (Flux model).
 * Generates stylized gaming hero images for articles.
 *
 * Usage:
 *   VAP_API_KEY=xxx tsx scripts/image-generator.ts
 *
 * Without API key, uses free tier (3 images/day).
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const HEROES_DIR = join(process.cwd(), 'public/images/heroes');
const VAP_API_URL = 'https://api.vap.ai/v1/images/generations';

interface ImageRequest {
  slug: string;
  gameTitle: string;
  description: string;
}

function buildPrompt(req: ImageRequest): string {
  return `Cinematic wide-angle screenshot of ${req.gameTitle} game, ${req.description}. Dark moody atmosphere, volumetric lighting, dramatic composition, 16:9 aspect ratio, game art style, high detail, no text, no UI elements, no watermarks.`;
}

async function generateImage(req: ImageRequest, apiKey?: string): Promise<Buffer | null> {
  const prompt = buildPrompt(req);

  if (!apiKey) {
    console.log(`  [dry-run] Would generate: "${prompt.slice(0, 80)}..."`);
    return null;
  }

  try {
    const res = await fetch(VAP_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'flux-1.1-pro',
        prompt,
        n: 1,
        size: '1200x675',
        response_format: 'b64_json',
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`  API error (${res.status}): ${err.slice(0, 200)}`);
      return null;
    }

    const json = await res.json();
    const b64 = json.data?.[0]?.b64_json;
    if (!b64) {
      console.error('  No image data in response');
      return null;
    }

    return Buffer.from(b64, 'base64');
  } catch (e) {
    console.error(`  Fetch error:`, e);
    return null;
  }
}

function generateSvgPlaceholder(req: ImageRequest): string {
  // Generate a high-quality SVG placeholder with game-specific colors
  const colors: Record<string, [string, string]> = {
    'counter-strike': ['#1a2a3a', '#0d1b2a'],
    'baldur': ['#2a1a2e', '#1a0d1e'],
    'elden': ['#2a2a1a', '#1e1a0d'],
    'helldivers': ['#1a2a1a', '#0d1e0d'],
    'palworld': ['#1a2a2a', '#0d1e1e'],
    'steam': ['#1a1a2a', '#0d0d1e'],
    'hades': ['#2a1a1a', '#1e0d0d'],
    'lethal': ['#1a1a1a', '#0d0d0d'],
    'dota': ['#1a2a1e', '#0d1e12'],
    'cyberpunk': ['#2a1a20', '#1e0d14'],
    'manor': ['#1e1a2a', '#120d1e'],
    'stardew': ['#1a2a20', '#0d1e14'],
    'hollow': ['#1a1e2a', '#0d121e'],
    'dead': ['#2a1e1a', '#1e120d'],
    'valheim': ['#1e2a1a', '#121e0d'],
    'satisfactory': ['#2a2a1e', '#1e1e12'],
    'deep rock': ['#2a1e1e', '#1e1212'],
    'terraria': ['#1a2a2a', '#0d1e1e'],
    'rimworld': ['#2a2a2a', '#1a1a1a'],
    'subnautica': ['#0d1a2a', '#060d1e'],
  };

  const key = Object.keys(colors).find(k => req.gameTitle.toLowerCase().includes(k)) || '';
  const [c1, c2] = colors[key] || ['#1a1e28', '#0b0d12'];

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${c1}"/>
      <stop offset="100%" style="stop-color:${c2}"/>
    </linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="1200" height="675" fill="url(#bg)"/>
  <rect width="1200" height="675" fill="url(#grid)"/>
  <text x="600" y="310" font-family="system-ui,sans-serif" font-size="36" font-weight="700" fill="rgba(255,255,255,0.85)" text-anchor="middle">${req.gameTitle}</text>
  <text x="600" y="360" font-family="system-ui,sans-serif" font-size="16" fill="rgba(255,255,255,0.4)" text-anchor="middle">${req.description.slice(0, 60)}</text>
  <text x="600" y="400" font-family="system-ui,sans-serif" font-size="12" fill="rgba(102,192,244,0.5)" text-anchor="middle">SteamPulse</text>
</svg>`;
}

// Default image requests matching existing articles
const IMAGE_REQUESTS: ImageRequest[] = [
  { slug: 'cs2-update', gameTitle: 'Counter-Strike 2', description: 'competitive match on Dust II map with dramatic lighting' },
  { slug: 'bg3-review', gameTitle: "Baldur's Gate 3", description: 'party of adventurers in a dark fantasy dungeon with magical effects' },
  { slug: 'elden-ring-guide', gameTitle: 'Elden Ring', description: 'lone warrior on horseback overlooking a vast golden landscape with Erdtree' },
  { slug: 'helldivers2-news', gameTitle: 'Helldivers 2', description: 'squad of soldiers dropping from orbit onto alien planet with explosions' },
  { slug: 'palworld-update', gameTitle: 'Palworld', description: 'colorful creatures in an open world base with crafting elements' },
  { slug: 'steam-sale', gameTitle: 'Steam Store', description: 'abstract digital storefront with glowing discount tags and game covers' },
  { slug: 'hades2-review', gameTitle: 'Hades II', description: 'witch character casting green magic spells in the underworld' },
  { slug: 'lethal-company-guide', gameTitle: 'Lethal Company', description: 'crew with flashlights exploring dark abandoned industrial facility' },
  { slug: 'dota2-esports', gameTitle: 'Dota 2', description: 'epic team fight in a MOBA arena with magical abilities clashing' },
  { slug: 'cyberpunk-dlc', gameTitle: 'Cyberpunk 2077', description: 'neon-lit Night City street at night with futuristic vehicles' },
  { slug: 'manor-lords', gameTitle: 'Manor Lords', description: 'medieval village with timber-frame houses and farmland from above' },
  { slug: 'stardew-valley', gameTitle: 'Stardew Valley', description: 'pixel art farm with crops, animals, and a cozy farmhouse at sunset' },
  { slug: 'hollow-knight', gameTitle: 'Hollow Knight', description: 'small knight character in a vast underground cavern with bioluminescence' },
  { slug: 'dead-cells', gameTitle: 'Dead Cells', description: 'action combat scene in a dark castle with pixel art style' },
  { slug: 'valheim', gameTitle: 'Valheim', description: 'viking longhouse in a misty forest with northern lights' },
  { slug: 'satisfactory', gameTitle: 'Satisfactory', description: 'massive automated factory complex on an alien planet' },
  { slug: 'deep-rock', gameTitle: 'Deep Rock Galactic', description: 'dwarf miners in a glowing crystal cave with mining equipment' },
  { slug: 'terraria-update', gameTitle: 'Terraria', description: 'colorful 2D world with floating islands and boss creatures' },
  { slug: 'rimworld', gameTitle: 'RimWorld', description: 'space colony base on an alien world with colonists and defenses' },
  { slug: 'subnautica', gameTitle: 'Subnautica', description: 'underwater alien ocean with bioluminescent creatures and a submarine' },
];

async function main() {
  const apiKey = process.env.VAP_API_KEY;

  if (!existsSync(HEROES_DIR)) mkdirSync(HEROES_DIR, { recursive: true });

  console.log(`Image generator — ${apiKey ? 'API mode' : 'SVG placeholder mode'}\n`);

  for (const req of IMAGE_REQUESTS) {
    const svgPath = join(HEROES_DIR, `${req.slug}.svg`);
    const pngPath = join(HEROES_DIR, `${req.slug}.png`);

    // Skip if real image already exists
    if (existsSync(pngPath)) {
      console.log(`Skip: ${req.slug}.png (exists)`);
      continue;
    }

    console.log(`Generating: ${req.slug} (${req.gameTitle})`);

    if (apiKey) {
      const imageBuffer = await generateImage(req, apiKey);
      if (imageBuffer) {
        writeFileSync(pngPath, imageBuffer);
        console.log(`  Saved: ${pngPath}`);
        // Rate limit
        await new Promise((r) => setTimeout(r, 3000));
        continue;
      }
    }

    // Fallback: generate SVG placeholder
    const svg = generateSvgPlaceholder(req);
    writeFileSync(svgPath, svg, 'utf-8');
    console.log(`  Saved SVG: ${svgPath}`);
  }

  console.log('\nImage generation complete.');
}

main().catch(console.error);
