import { writeFileSync, existsSync, mkdirSync, readdirSync, readFileSync } from 'fs';
import { join, basename } from 'path';

const HEROES_DIR = join(process.cwd(), 'public/images/heroes');
const CONTENT_DIR = join(process.cwd(), 'src/content');

interface ImageEntry {
  imagePath: string;
  fileName: string;
  gameTitle: string;
  type: 'news' | 'review' | 'guide';
  category: string;
}

function scanArticles(): ImageEntry[] {
  const entries: ImageEntry[] = [];
  const collections = [
    { dir: 'news', type: 'news' as const },
    { dir: 'reviews', type: 'review' as const },
    { dir: 'guides', type: 'guide' as const },
  ];

  for (const col of collections) {
    const dir = join(CONTENT_DIR, col.dir);
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir).filter(f => f.endsWith('.md'))) {
      const content = readFileSync(join(dir, file), 'utf-8');
      const heroMatch = content.match(/^heroImage:\s*"([^"]+)"/m);
      const gameMatch = content.match(/^gameTitle:\s*"([^"]+)"/m);
      const catMatch = content.match(/^category:\s*"([^"]+)"/m);
      if (!heroMatch) continue;
      const imagePath = heroMatch[1];
      const fileName = imagePath.split('/').pop() || '';
      entries.push({
        imagePath,
        fileName,
        gameTitle: gameMatch?.[1] || 'Unknown Game',
        type: col.type,
        category: catMatch?.[1] || col.type,
      });
    }
  }

  const seen = new Set<string>();
  return entries.filter(e => {
    if (seen.has(e.fileName)) return false;
    seen.add(e.fileName);
    return true;
  });
}

const GENRE_PATTERNS: Record<string, { deco: string; accent: string }> = {
  fps: { deco: 'crosshair', accent: '#e74c3c' },
  shooter: { deco: 'crosshair', accent: '#e74c3c' },
  action: { deco: 'hexgrid', accent: '#ff6b35' },
  rpg: { deco: 'circles', accent: '#9b59b6' },
  strategy: { deco: 'hexgrid', accent: '#3498db' },
  survival: { deco: 'diagonal', accent: '#27ae60' },
  simulation: { deco: 'dots', accent: '#1abc9c' },
  indie: { deco: 'circles', accent: '#e67e22' },
  horror: { deco: 'diagonal', accent: '#8e44ad' },
  racing: { deco: 'diagonal', accent: '#f39c12' },
  sandbox: { deco: 'dots', accent: '#2ecc71' },
  mmo: { deco: 'hexgrid', accent: '#2980b9' },
};

function detectGenre(gameTitle: string, category: string): { deco: string; accent: string } {
  const lower = (gameTitle + ' ' + category).toLowerCase();
  for (const [key, val] of Object.entries(GENRE_PATTERNS)) {
    if (lower.includes(key)) return val;
  }
  const gameGenres: Record<string, string> = {
    'counter-strike': 'fps', 'cs2': 'fps', 'valorant': 'fps', 'apex': 'fps',
    'rainbow six': 'fps', 'battlefield': 'fps', 'call of duty': 'fps',
    'elden ring': 'rpg', "baldur's gate": 'rpg', 'dark souls': 'rpg',
    'witcher': 'rpg', 'cyberpunk': 'rpg', 'sekiro': 'rpg', 'lies of p': 'rpg',
    'crusader kings': 'strategy', 'stellaris': 'strategy', 'hearts of iron': 'strategy',
    'europa universalis': 'strategy', 'rimworld': 'strategy', 'civilization': 'strategy',
    'war thunder': 'strategy',
    'rust': 'survival', 'valheim': 'survival', 'ark': 'survival',
    "don't starve": 'survival', 'palworld': 'survival', 'subnautica': 'survival',
    'terraria': 'sandbox', 'stardew': 'sandbox', 'satisfactory': 'sandbox',
    'minecraft': 'sandbox', 'sims': 'sandbox',
    'hades': 'action', 'hollow knight': 'action', 'dead cells': 'action',
    'monster hunter': 'action', 'devil may cry': 'action', 'marvel': 'action',
    'helldivers': 'action', 'naraka': 'action', 'black myth': 'action',
    'lethal company': 'horror', 'phasmophobia': 'horror', 'resident evil': 'horror',
    'euro truck': 'simulation', 'forza': 'racing',
    'lost ark': 'mmo', 'destiny': 'mmo', 'elder scrolls online': 'mmo',
    'deep rock': 'action', 'among us': 'indie', 'vampire survivors': 'indie',
    'balatro': 'indie', 'dave the diver': 'indie', 'binding of isaac': 'indie',
    'outer wilds': 'indie', 'it takes two': 'indie', 'stray': 'indie',
    'pubg': 'fps', 'team fortress': 'fps', 'dota': 'strategy',
    'wuthering': 'rpg', 'spider-man': 'action',
  };
  for (const [key, genre] of Object.entries(gameGenres)) {
    if (lower.includes(key)) return GENRE_PATTERNS[genre] || { deco: 'hexgrid', accent: '#66c0f4' };
  }
  return { deco: 'hexgrid', accent: '#66c0f4' };
}

function decoSvg(style: string, accent: string): string {
  if (style === 'crosshair') {
    return `<circle cx="600" cy="280" r="120" fill="none" stroke="${accent}" stroke-width="1" opacity="0.12"/>
    <circle cx="600" cy="280" r="60" fill="none" stroke="${accent}" stroke-width="1" opacity="0.18"/>
    <line x1="600" y1="140" x2="600" y2="420" stroke="${accent}" stroke-width="0.5" opacity="0.1"/>
    <line x1="460" y1="280" x2="740" y2="280" stroke="${accent}" stroke-width="0.5" opacity="0.1"/>`;
  }
  if (style === 'hexgrid') {
    let hexes = '';
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 8; col++) {
        const x = 100 + col * 140 + (row % 2) * 70;
        const y = 80 + row * 120;
        hexes += `<polygon points="${x},${y - 40} ${x + 35},${y - 20} ${x + 35},${y + 20} ${x},${y + 40} ${x - 35},${y + 20} ${x - 35},${y - 20}" fill="none" stroke="${accent}" stroke-width="0.5" opacity="${0.04 + Math.random() * 0.06}"/>`;
      }
    }
    return hexes;
  }
  if (style === 'circles') {
    return `<circle cx="300" cy="200" r="180" fill="none" stroke="${accent}" stroke-width="0.5" opacity="0.08"/>
    <circle cx="900" cy="400" r="220" fill="none" stroke="${accent}" stroke-width="0.5" opacity="0.06"/>
    <circle cx="600" cy="340" r="280" fill="none" stroke="${accent}" stroke-width="0.5" opacity="0.04"/>
    <circle cx="150" cy="500" r="100" fill="none" stroke="${accent}" stroke-width="0.5" opacity="0.07"/>`;
  }
  if (style === 'diagonal') {
    let lines = '';
    for (let i = -5; i < 20; i++) {
      lines += `<line x1="${i * 80}" y1="0" x2="${i * 80 + 675}" y2="675" stroke="${accent}" stroke-width="0.5" opacity="0.04"/>`;
    }
    return lines;
  }
  // dots
  let dots = '';
  for (let i = 0; i < 30; i++) {
    const x = 50 + Math.random() * 1100;
    const y = 50 + Math.random() * 575;
    const r = 1 + Math.random() * 3;
    dots += `<circle cx="${x}" cy="${y}" r="${r}" fill="${accent}" opacity="${0.05 + Math.random() * 0.1}"/>`;
  }
  return dots;
}

function typeLabel(type: string): { text: string; color: string } {
  if (type === 'review') return { text: 'REVIEW', color: '#ff6b35' };
  if (type === 'guide') return { text: 'GUIDE', color: '#34d399' };
  return { text: 'NEWS', color: '#66c0f4' };
}

function generateSvg(entry: ImageEntry): string {
  const { deco, accent } = detectGenre(entry.gameTitle, entry.category);
  const label = typeLabel(entry.type);

  const hash = entry.gameTitle.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const hue1 = (hash * 37) % 360;
  const hue2 = (hue1 + 40) % 360;
  const c1 = `hsl(${hue1}, 30%, 8%)`;
  const c2 = `hsl(${hue2}, 25%, 5%)`;

  const title = entry.gameTitle.length > 30 ? entry.gameTitle.slice(0, 28) + '...' : entry.gameTitle;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="45%" r="50%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
    <filter id="textglow">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="1200" height="675" fill="url(#bg)"/>
  <rect width="1200" height="675" fill="url(#glow)"/>
  ${decoSvg(deco, accent)}
  <line x1="0" y1="540" x2="1200" y2="540" stroke="${accent}" stroke-width="0.5" opacity="0.1"/>
  <text x="600" y="310" font-family="system-ui,-apple-system,sans-serif" font-size="42" font-weight="700" fill="rgba(255,255,255,0.9)" text-anchor="middle" filter="url(#textglow)">${title}</text>
  <rect x="${600 - label.text.length * 5 - 16}" y="345" width="${label.text.length * 10 + 32}" height="28" rx="14" fill="${label.color}" opacity="0.2"/>
  <text x="600" y="364" font-family="system-ui,-apple-system,sans-serif" font-size="11" font-weight="600" fill="${label.color}" text-anchor="middle" letter-spacing="2">${label.text}</text>
  <text x="600" y="630" font-family="system-ui,-apple-system,sans-serif" font-size="11" fill="rgba(102,192,244,0.3)" text-anchor="middle" letter-spacing="3">STEAMPULSE</text>
</svg>`;
}

async function main() {
  if (!existsSync(HEROES_DIR)) mkdirSync(HEROES_DIR, { recursive: true });

  const entries = scanArticles();
  const existing = new Set(readdirSync(HEROES_DIR));

  const missing = entries.filter(e => !existing.has(e.fileName));

  console.log(`Image Generator (auto-scan mode)`);
  console.log(`  Total unique images referenced: ${entries.length}`);
  console.log(`  Already exist: ${entries.length - missing.length}`);
  console.log(`  Missing: ${missing.length}\n`);

  if (missing.length === 0) {
    console.log('All images present. Nothing to generate.');
    return;
  }

  let generated = 0;
  for (const entry of missing) {
    const svg = generateSvg(entry);
    const outPath = join(HEROES_DIR, entry.fileName);
    writeFileSync(outPath, svg, 'utf-8');
    generated++;
    if (generated % 20 === 0) console.log(`  Generated ${generated}/${missing.length}...`);
  }

  console.log(`\nDone. Generated ${generated} SVG placeholders.`);
  console.log(`Total images now: ${existing.size + generated}`);
}

main().catch(console.error);
