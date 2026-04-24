import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, basename } from 'path';
import { CONTENT_DIR } from './shared.js';

// Load .env
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

const LANG_NAMES: Record<string, string> = {
  zh: 'Chinese (Simplified)',
  ja: 'Japanese',
  ko: 'Korean',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  pt: 'Brazilian Portuguese',
  ru: 'Russian',
  ar: 'Arabic',
  tr: 'Turkish',
};

const ALL_LANGS = Object.keys(LANG_NAMES);
const COLLECTIONS = ['news', 'reviews', 'guides'] as const;

interface TranslateResult {
  translated: number;
  skipped: number;
  errors: string[];
}

function getSourceFiles(collection: string): string[] {
  const dir = join(CONTENT_DIR, collection);
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter(f => f.endsWith('.md')).sort();
}

function getTranslatedSlugs(collection: string, lang: string): Set<string> {
  const dir = join(CONTENT_DIR, `${collection}-${lang}`);
  if (!existsSync(dir)) return new Set();
  return new Set(readdirSync(dir).filter(f => f.endsWith('.md')).map(f => f.replace('.md', '')));
}

function buildTranslatePrompt(content: string, lang: string, langName: string): string {
  return `You are a professional gaming journalist translator. Translate the following Steam gaming article from English to ${langName}.

TRANSLATION RULES:
1. Translate the YAML frontmatter fields: title, description, tldr, faq questions/answers, heroImageAlt, author bio, pros, cons
2. Translate the article body (all markdown content after the frontmatter)
3. DO NOT translate: tags, category, gameTitle, slug values, URLs, image paths, steamAppId, rating numbers, readingTime numbers
4. Keep game proper nouns in English: "Counter-Strike 2", "Steam", "Valve", "Elden Ring", etc.
5. Keep technical terms that are commonly used in English in the gaming community
6. Add these fields to the frontmatter (after the existing fields, before the closing ---):
   language: "${lang}"
   originalSlug: "{slug}" (the original English slug - extract from the filename context)
7. Maintain the exact same YAML structure and markdown formatting
8. Keep all markdown tables, headings, lists, and formatting intact
9. The title MUST be under 70 characters in the target language
10. The description MUST be under 160 characters in the target language

OUTPUT: Return ONLY the translated markdown with YAML frontmatter. No code fences, no explanations.

---

${content}`;
}

async function translateArticle(
  client: Anthropic,
  content: string,
  lang: string,
  slug: string,
): Promise<string> {
  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';
  const langName = LANG_NAMES[lang];

  const userContent = `I'm building a multilingual static site generator for a gaming news website. I need you to translate a markdown file with YAML frontmatter for testing my i18n content collection parser.

${buildTranslatePrompt(content, lang, langName)}`;

  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    messages: [{ role: 'user', content: userContent }],
  });

  let text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');

  // Strip code fences
  text = text.replace(/^```(?:markdown|yaml|md)?\n/, '').replace(/\n```\s*$/, '');

  // Fix YAML frontmatter quote issues
  text = fixYamlQuotes(text);

  // Ensure language and originalSlug fields exist
  if (!text.includes(`language: "${lang}"`)) {
    text = text.replace(/\n---\n/, `\nlanguage: "${lang}"\noriginalSlug: "${slug}"\n---\n`);
  }
  if (!text.includes(`originalSlug:`)) {
    text = text.replace(/\n---\n/, `\noriginalSlug: "${slug}"\n---\n`);
  }

  return text;
}

function fixYamlQuotes(markdown: string): string {
  const match = markdown.match(/^(---\n)([\s\S]*?)(\n---)/);
  if (!match) return markdown;

  let fm = match[2];
  const rest = markdown.slice(match[0].length);

  // Fix FAQ entries: replace double-quoted values that contain internal quotes
  // Pattern: key: "value with "nested" quotes"
  const lines = fm.split('\n');
  const fixed: string[] = [];

  for (const line of lines) {
    // Match question: or answer: lines with double-quoted values
    const m = line.match(/^(\s+(?:question|answer):\s*)"(.*)"$/);
    if (m) {
      const prefix = m[1];
      let value = m[2];
      // If value contains unescaped quotes (Chinese or English), switch to single quotes
      if (value.includes('"') || value.includes('"') || value.includes('"')) {
        // Escape single quotes in value
        value = value.replace(/'/g, "''");
        fixed.push(`${prefix}'${value}'`);
      } else {
        fixed.push(line);
      }
    } else {
      fixed.push(line);
    }
  }

  return match[1] + fixed.join('\n') + match[3] + rest;
}

async function main() {
  const args = process.argv.slice(2);
  const langArg = args.find(a => a.startsWith('--lang'))?.split('=')[1]
    || args[args.indexOf('--lang') + 1];
  const limitArg = parseInt(args.find(a => a.startsWith('--limit'))?.split('=')[1]
    || args[args.indexOf('--limit') + 1] || '10');
  const sourceArg = args.find(a => a.startsWith('--source'))?.split('=')[1]
    || args[args.indexOf('--source') + 1];
  const dryRun = args.includes('--dry-run');
  const delayMs = parseInt(args.find(a => a.startsWith('--delay'))?.split('=')[1] || '2000');

  const targetLangs = langArg === 'all' ? ALL_LANGS : langArg ? [langArg] : ALL_LANGS;
  const targetCollections = sourceArg ? [sourceArg] : [...COLLECTIONS];

  // Validate languages
  for (const lang of targetLangs) {
    if (!LANG_NAMES[lang]) {
      console.error(`Unknown language: ${lang}. Supported: ${ALL_LANGS.join(', ')}`);
      process.exit(1);
    }
  }

  console.log(`\n🌐 SteamPulse Translator`);
  console.log(`   Languages: ${targetLangs.join(', ')}`);
  console.log(`   Collections: ${targetCollections.join(', ')}`);
  console.log(`   Limit: ${limitArg} per collection per language`);
  console.log(`   Delay: ${delayMs}ms between API calls`);
  if (dryRun) console.log(`   Mode: DRY RUN (no files written)\n`);
  else console.log('');

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    baseURL: process.env.ANTHROPIC_BASE_URL || undefined,
  });

  const results: TranslateResult = { translated: 0, skipped: 0, errors: [] };

  for (const lang of targetLangs) {
    console.log(`\n--- ${LANG_NAMES[lang]} (${lang}) ---`);

    for (const collection of targetCollections) {
      const sourceFiles = getSourceFiles(collection);
      const existingSlugs = getTranslatedSlugs(collection, lang);
      const targetDir = join(CONTENT_DIR, `${collection}-${lang}`);

      if (!existsSync(targetDir) && !dryRun) {
        mkdirSync(targetDir, { recursive: true });
      }

      let translated = 0;
      for (const file of sourceFiles) {
        if (translated >= limitArg) break;

        const slug = file.replace('.md', '');
        if (existingSlugs.has(slug)) {
          results.skipped++;
          continue;
        }

        if (dryRun) {
          console.log(`  [DRY] Would translate: ${collection}/${file} → ${collection}-${lang}/${file}`);
          translated++;
          results.translated++;
          continue;
        }

        try {
          const sourcePath = join(CONTENT_DIR, collection, file);
          const content = readFileSync(sourcePath, 'utf-8');

          console.log(`  Translating: ${collection}/${file} → ${lang}...`);
          const result = await translateArticle(client, content, lang, slug);

          const outPath = join(targetDir, file);
          writeFileSync(outPath, result, 'utf-8');
          console.log(`  ✓ Written: ${outPath}`);

          translated++;
          results.translated++;

          // Rate limiting delay
          if (translated < limitArg) {
            await new Promise(r => setTimeout(r, delayMs));
          }
        } catch (err: any) {
          const msg = `${collection}/${file} → ${lang}: ${err.message || err}`;
          console.error(`  ✗ Error: ${msg}`);
          results.errors.push(msg);
        }
      }

      if (translated > 0) {
        console.log(`  ${collection}: ${translated} translated`);
      }
    }
  }

  console.log(`\n📊 Summary`);
  console.log(`   Translated: ${results.translated}`);
  console.log(`   Skipped (existing): ${results.skipped}`);
  console.log(`   Errors: ${results.errors.length}`);
  if (results.errors.length > 0) {
    console.log(`   Error details:`);
    results.errors.forEach(e => console.log(`     - ${e}`));
  }

  // Write log
  const logDir = join(process.cwd(), 'logs');
  if (!existsSync(logDir)) mkdirSync(logDir, { recursive: true });
  writeFileSync(
    join(logDir, 'translate-log.json'),
    JSON.stringify({ timestamp: new Date().toISOString(), ...results }, null, 2),
    'utf-8',
  );
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
