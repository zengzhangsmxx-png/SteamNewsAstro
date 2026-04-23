interface QualityCheck {
  score: number;
  passed: boolean;
  issues: string[];
  checks: {
    wordCount: { value: number; passed: boolean };
    frontmatterComplete: { value: boolean; passed: boolean };
    titleLength: { value: number; passed: boolean };
    hasTable: { value: boolean; passed: boolean };
    hasH2: { value: number; passed: boolean };
    hasFAQ: { value: number; passed: boolean };
    noDuplicateParagraphs: { value: boolean; passed: boolean };
  };
}

const REQUIRED_FRONTMATTER_FIELDS = [
  'title',
  'description',
  'publishDate',
  'heroImage',
  'category',
  'tags',
  'author',
  'tldr',
  'faq',
];

function extractFrontmatter(markdown: string): Record<string, any> {
  const match = markdown.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const yaml = match[1];
  const obj: Record<string, any> = {};

  // Simple YAML parser for our needs
  const lines = yaml.split('\n');
  let currentKey = '';
  let currentIndent = 0;

  for (const line of lines) {
    const indent = line.search(/\S/);

    // Top-level key (no indent or indent 0)
    if (indent === 0 && line.match(/^\w+:/)) {
      const [key, ...rest] = line.split(':');
      currentKey = key.trim();
      const value = rest.join(':').trim();
      obj[currentKey] = value || true; // Mark as present even if nested
      currentIndent = 0;
    }
    // Array item
    else if (line.trim().startsWith('-') && currentKey) {
      if (!Array.isArray(obj[currentKey])) obj[currentKey] = [];
      obj[currentKey].push(line.trim().substring(1).trim());
    }
    // Nested key (indented) - just mark parent as present
    else if (indent > 0 && line.match(/\w+:/) && currentKey) {
      // Nested field exists, parent key is valid
      if (obj[currentKey] === true) obj[currentKey] = {};
    }
  }

  return obj;
}

function extractBody(markdown: string): string {
  return markdown.replace(/^---\n[\s\S]*?\n---\n/, '');
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

function countH2Headers(text: string): number {
  return (text.match(/^## /gm) || []).length;
}

function hasTables(text: string): boolean {
  const tableLines = text.split('\n').filter(line => line.includes('|'));
  return tableLines.length >= 3; // Header + separator + at least 1 row
}

function hasDuplicateParagraphs(text: string): boolean {
  const paragraphs = text
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 50); // Only check substantial paragraphs

  const seen = new Set<string>();
  for (const p of paragraphs) {
    if (seen.has(p)) return true;
    seen.add(p);
  }
  return false;
}

export function checkQuality(markdown: string): QualityCheck {
  const frontmatter = extractFrontmatter(markdown);
  const body = extractBody(markdown);

  const wordCount = countWords(body);
  const titleLength = frontmatter.title?.length || 0;
  const h2Count = countH2Headers(body);
  const hasTableCheck = hasTables(body);
  const faqCount = Array.isArray(frontmatter.faq) ? frontmatter.faq.length : 0;
  const noDuplicates = !hasDuplicateParagraphs(body);

  const frontmatterComplete = REQUIRED_FRONTMATTER_FIELDS.every(
    field => frontmatter[field] !== undefined && frontmatter[field] !== ''
  );

  const checks = {
    wordCount: {
      value: wordCount,
      passed: wordCount >= 800 && wordCount <= 2000,
    },
    frontmatterComplete: {
      value: frontmatterComplete,
      passed: frontmatterComplete,
    },
    titleLength: {
      value: titleLength,
      passed: titleLength > 0 && titleLength <= 70,
    },
    hasTable: {
      value: hasTableCheck,
      passed: hasTableCheck,
    },
    hasH2: {
      value: h2Count,
      passed: h2Count >= 2,
    },
    hasFAQ: {
      value: faqCount,
      passed: faqCount >= 3,
    },
    noDuplicateParagraphs: {
      value: noDuplicates,
      passed: noDuplicates,
    },
  };

  let score = 0;
  const issues: string[] = [];

  if (checks.wordCount.passed) {
    score += 20;
  } else {
    issues.push(`Word count ${wordCount} not in range 800-2000`);
  }

  if (checks.frontmatterComplete.passed) {
    score += 20;
  } else {
    const missing = REQUIRED_FRONTMATTER_FIELDS.filter(f => !frontmatter[f]);
    issues.push(`Missing frontmatter fields: ${missing.join(', ')}`);
  }

  if (checks.titleLength.passed) {
    score += 10;
  } else {
    issues.push(`Title length ${titleLength} exceeds 70 chars`);
  }

  if (checks.hasTable.passed) {
    score += 15;
  } else {
    issues.push('No Markdown table found');
  }

  if (checks.hasH2.passed) {
    score += 15;
  } else {
    issues.push(`Only ${h2Count} H2 headers (need ≥2)`);
  }

  if (checks.hasFAQ.passed) {
    score += 10;
  } else {
    issues.push(`Only ${faqCount} FAQ items (need ≥3)`);
  }

  if (checks.noDuplicateParagraphs.passed) {
    score += 10;
  } else {
    issues.push('Duplicate paragraphs detected');
  }

  return {
    score,
    passed: score >= 70,
    issues,
    checks,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    const { readFileSync } = await import('fs');
    const testFile = process.argv[2];

    if (!testFile) {
      console.error('Usage: tsx scripts/quality-check.ts <markdown-file>');
      process.exit(1);
    }

    const markdown = readFileSync(testFile, 'utf-8');
    const result = checkQuality(markdown);

    console.log(`Quality Score: ${result.score}/100 (${result.passed ? 'PASS' : 'FAIL'})\n`);
    console.log('Checks:');
    for (const [key, check] of Object.entries(result.checks)) {
      const status = check.passed ? '✓' : '✗';
      console.log(`  ${status} ${key}: ${JSON.stringify(check.value)}`);
    }

    if (result.issues.length > 0) {
      console.log('\nIssues:');
      result.issues.forEach(issue => console.log(`  - ${issue}`));
    }
  })();
}
