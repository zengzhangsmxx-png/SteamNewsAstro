import { createServer } from 'http';
import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const PORT = parseInt(process.env.N8N_API_PORT || '3847');
const API_SECRET = process.env.N8N_API_SECRET || '';
const CWD = process.cwd();

function json(res: any, status: number, data: any) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function runCmd(cmd: string, timeoutMs = 600000): { ok: boolean; output: string; durationMs: number } {
  const start = Date.now();
  try {
    const output = execSync(cmd, { cwd: CWD, timeout: timeoutMs, env: { ...process.env } }).toString();
    return { ok: true, output, durationMs: Date.now() - start };
  } catch (err: any) {
    return { ok: false, output: err.stderr?.toString() || err.message, durationMs: Date.now() - start };
  }
}

function readLog(name: string): any {
  const p = join(CWD, 'logs', name);
  if (!existsSync(p)) return null;
  try { return JSON.parse(readFileSync(p, 'utf-8')); } catch { return null; }
}

function readCache(name: string): any {
  const p = join(CWD, 'cache', name);
  if (!existsSync(p)) return null;
  try { return JSON.parse(readFileSync(p, 'utf-8')); } catch { return null; }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);
  const path = url.pathname;

  if (API_SECRET && req.headers['x-api-secret'] !== API_SECRET) {
    return json(res, 401, { error: 'unauthorized' });
  }

  if (path === '/health') {
    return json(res, 200, { status: 'ok', timestamp: new Date().toISOString() });
  }

  if (path === '/fetch-trending') {
    const force = url.searchParams.get('force') === 'true';
    const result = runCmd(`npx tsx scripts/fetch-trending.ts${force ? ' --force' : ''}`);
    const cache = readCache('trending.json');
    return json(res, result.ok ? 200 : 500, {
      ...result,
      gamesCount: cache?.games?.length || 0,
    });
  }

  if (path === '/predict') {
    const top = url.searchParams.get('top') || '20';
    const result = runCmd(`npx tsx scripts/predict-hotness.ts --top=${top}`);
    const predictions = readCache('predictions.json');
    return json(res, result.ok ? 200 : 500, {
      ...result,
      predictions: predictions?.predictions || [],
    });
  }

  if (path === '/generate') {
    const limit = url.searchParams.get('limit') || '10';
    const result = runCmd(`npx tsx scripts/generate-dynamic.ts --limit ${limit}`);
    const log = readLog('generate-log.json');
    return json(res, result.ok ? 200 : 500, {
      ...result,
      generated: log?.generated?.length || 0,
      skipped: log?.skipped?.length || 0,
      errors: log?.errors || [],
    });
  }

  if (path === '/translate') {
    const lang = url.searchParams.get('lang') || 'all';
    const limit = url.searchParams.get('limit') || '10';
    const result = runCmd(`npx tsx scripts/translate.ts --lang ${lang} --limit ${limit}`);
    const log = readLog('translate-log.json');
    return json(res, result.ok ? 200 : 500, {
      ...result,
      translated: log?.translated || 0,
      errors: log?.errors || [],
    });
  }

  if (path === '/build') {
    const result = runCmd('npm run build', 300000);
    return json(res, result.ok ? 200 : 500, result);
  }

  if (path === '/deploy') {
    const project = process.env.CLOUDFLARE_PROJECT_NAME || 'steampulse';
    const result = runCmd(`npx wrangler pages deploy dist --project-name=${project}`);
    return json(res, result.ok ? 200 : 500, result);
  }

  if (path === '/status') {
    const trending = readCache('trending.json');
    const predictions = readCache('predictions.json');
    const genLog = readLog('generate-log.json');
    const transLog = readLog('translate-log.json');
    return json(res, 200, {
      trending: { gamesCount: trending?.games?.length || 0, fetchedAt: trending?.fetchedAt },
      predictions: { count: predictions?.predictions?.length || 0, timestamp: predictions?.timestamp },
      lastGenerate: genLog ? { generated: genLog.generated?.length || 0, timestamp: genLog.timestamp } : null,
      lastTranslate: transLog ? { translated: transLog.translated || 0, timestamp: transLog.timestamp } : null,
    });
  }

  if (path === '/git-commit') {
    const r1 = runCmd('git add src/content/ public/images/');
    if (!r1.ok) return json(res, 500, { error: 'git add failed', ...r1 });

    const check = runCmd('git diff --cached --quiet');
    if (check.ok) return json(res, 200, { committed: false, message: 'no changes' });

    const date = new Date().toISOString().split('T')[0];
    const result = runCmd(`git commit -m "chore: auto-generate content ${date}"`);
    return json(res, result.ok ? 200 : 500, { committed: result.ok, ...result });
  }

  if (path === '/git-push') {
    const result = runCmd('git push');
    return json(res, result.ok ? 200 : 500, result);
  }

  json(res, 404, {
    error: 'not found',
    endpoints: ['/health', '/fetch-trending', '/predict', '/generate', '/translate', '/build', '/deploy', '/status', '/git-commit', '/git-push'],
  });
});

server.listen(PORT, () => {
  console.log(`SteamPulse n8n API running on http://localhost:${PORT}`);
  console.log(`Endpoints: /health /fetch-trending /predict /generate /translate /build /deploy /status /git-commit /git-push`);
  if (API_SECRET) console.log('Auth: x-api-secret header required');
});
