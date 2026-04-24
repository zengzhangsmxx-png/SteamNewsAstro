import { execSync } from 'child_process';
import { notify } from './notify.js';

type Mode = 'full' | 'content-only' | 'build-only';

interface StepResult {
  name: string;
  durationMs: number;
  success: boolean;
  error?: string;
}

function parseArgs(): { mode: Mode; limit: number; lang: string } {
  let mode: Mode = 'full';
  let limit = 10;
  let lang = 'all';

  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === '--mode' && process.argv[i + 1]) {
      mode = process.argv[i + 1] as Mode;
      i++;
    }
    if (process.argv[i] === '--limit' && process.argv[i + 1]) {
      limit = parseInt(process.argv[i + 1], 10);
      i++;
    }
    if (process.argv[i] === '--lang' && process.argv[i + 1]) {
      lang = process.argv[i + 1];
      i++;
    }
  }

  if (!['full', 'content-only', 'build-only'].includes(mode)) {
    console.error(`Invalid mode: ${mode}. Use full | content-only | build-only`);
    process.exit(1);
  }

  return { mode, limit, lang };
}

function runStep(name: string, command: string): StepResult {
  const start = Date.now();
  console.log(`\n[${'='.repeat(40)}]`);
  console.log(`Step: ${name}`);
  console.log(`Command: ${command}`);
  console.log(`[${'='.repeat(40)}]\n`);

  try {
    execSync(command, {
      cwd: process.cwd(),
      stdio: 'inherit',
      env: { ...process.env },
      timeout: 10 * 60 * 1000, // 10 min per step
    });
    const duration = Date.now() - start;
    console.log(`\n${name} completed in ${(duration / 1000).toFixed(1)}s`);
    return { name, durationMs: duration, success: true };
  } catch (err: any) {
    const duration = Date.now() - start;
    console.error(`\n${name} FAILED after ${(duration / 1000).toFixed(1)}s: ${err.message}`);
    return { name, durationMs: duration, success: false, error: err.message };
  }
}

async function main() {
  const { mode, limit, lang } = parseArgs();
  const totalStart = Date.now();
  const results: StepResult[] = [];

  console.log(`Orchestrate: mode=${mode}, limit=${limit}, lang=${lang}`);
  console.log(`Started at ${new Date().toISOString()}\n`);

  if (mode === 'full' || mode === 'content-only') {
    results.push(runStep('Fetch Trending', 'npx tsx scripts/fetch-trending.ts'));
    results.push(runStep('Predict Hotness', 'npx tsx scripts/predict-hotness.ts --snapshot'));
    results.push(runStep('Generate Articles', `npx tsx scripts/generate-dynamic.ts --limit ${limit}`));
    results.push(runStep('Translate Articles', `npx tsx scripts/translate.ts --lang ${lang} --limit ${limit}`));
  }

  if (mode === 'full') {
    results.push(runStep('Generate Images', 'npx tsx scripts/image-generator.ts'));
    results.push(runStep('Build Site', 'npm run build'));
  }

  if (mode === 'build-only') {
    results.push(runStep('Build Site', 'npm run build'));
  }

  const totalDuration = Date.now() - totalStart;
  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log(`\n${'='.repeat(50)}`);
  console.log('SUMMARY');
  console.log(`${'='.repeat(50)}`);
  console.log(`Total time: ${(totalDuration / 1000).toFixed(1)}s`);
  console.log(`Steps: ${succeeded} passed, ${failed} failed\n`);

  for (const r of results) {
    const icon = r.success ? 'OK' : 'FAIL';
    console.log(`  [${icon}] ${r.name} (${(r.durationMs / 1000).toFixed(1)}s)`);
  }

  if (failed > 0) {
    console.log('\nFailed steps:');
    for (const r of results.filter((r) => !r.success)) {
      console.log(`  - ${r.name}: ${r.error}`);
    }
  }

  await notify(results, mode);

  if (failed > 0) process.exit(1);
}

main();
