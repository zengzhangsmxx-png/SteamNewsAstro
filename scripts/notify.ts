import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface PipelineReport {
  mode: string;
  steps: { name: string; durationMs: number; success: boolean; error?: string }[];
  totalDurationMs: number;
  articlesGenerated?: number;
  articlesTranslated?: number;
  errors: string[];
  timestamp: string;
}

function loadGenerateLog(): { generated: number; errors: string[] } {
  const logPath = join(process.cwd(), 'logs', 'generate-log.json');
  if (!existsSync(logPath)) return { generated: 0, errors: [] };
  try {
    const data = JSON.parse(readFileSync(logPath, 'utf-8'));
    return { generated: data.generated?.length || 0, errors: data.errors || [] };
  } catch { return { generated: 0, errors: [] }; }
}

function loadTranslateLog(): { translated: number; errors: string[] } {
  const logPath = join(process.cwd(), 'logs', 'translate-log.json');
  if (!existsSync(logPath)) return { translated: 0, errors: [] };
  try {
    const data = JSON.parse(readFileSync(logPath, 'utf-8'));
    return { translated: data.translated || 0, errors: data.errors || [] };
  } catch { return { translated: 0, errors: [] }; }
}

function buildReport(steps: PipelineReport['steps'], mode: string): PipelineReport {
  const genLog = loadGenerateLog();
  const transLog = loadTranslateLog();
  const totalMs = steps.reduce((s, r) => s + r.durationMs, 0);
  const allErrors = [
    ...steps.filter(s => !s.success).map(s => `${s.name}: ${s.error}`),
    ...genLog.errors,
    ...transLog.errors,
  ];

  return {
    mode,
    steps,
    totalDurationMs: totalMs,
    articlesGenerated: genLog.generated,
    articlesTranslated: transLog.translated,
    errors: allErrors,
    timestamp: new Date().toISOString(),
  };
}

function formatSlackMessage(report: PipelineReport): object {
  const status = report.errors.length === 0 ? ':white_check_mark: Success' : ':warning: Completed with errors';
  const duration = (report.totalDurationMs / 1000 / 60).toFixed(1);

  const stepLines = report.steps.map(s => {
    const icon = s.success ? ':white_check_mark:' : ':x:';
    return `${icon} ${s.name} (${(s.durationMs / 1000).toFixed(0)}s)`;
  }).join('\n');

  const blocks: any[] = [
    {
      type: 'header',
      text: { type: 'plain_text', text: `SteamPulse Daily Pipeline ${status}` },
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Mode:*\n${report.mode}` },
        { type: 'mrkdwn', text: `*Duration:*\n${duration} min` },
        { type: 'mrkdwn', text: `*Generated:*\n${report.articlesGenerated || 0} articles` },
        { type: 'mrkdwn', text: `*Translated:*\n${report.articlesTranslated || 0} articles` },
      ],
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `*Steps:*\n${stepLines}` },
    },
  ];

  if (report.errors.length > 0) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `*Errors (${report.errors.length}):*\n${report.errors.slice(0, 5).map(e => `• ${e}`).join('\n')}` },
    });
  }

  return { blocks };
}

function formatEmailBody(report: PipelineReport): string {
  const status = report.errors.length === 0 ? 'SUCCESS' : 'COMPLETED WITH ERRORS';
  const duration = (report.totalDurationMs / 1000 / 60).toFixed(1);

  let body = `SteamPulse Daily Pipeline — ${status}\n`;
  body += `${'='.repeat(50)}\n\n`;
  body += `Mode: ${report.mode}\n`;
  body += `Duration: ${duration} min\n`;
  body += `Generated: ${report.articlesGenerated || 0} articles\n`;
  body += `Translated: ${report.articlesTranslated || 0} articles\n\n`;

  body += `Steps:\n`;
  for (const s of report.steps) {
    body += `  [${s.success ? 'OK' : 'FAIL'}] ${s.name} (${(s.durationMs / 1000).toFixed(0)}s)\n`;
  }

  if (report.errors.length > 0) {
    body += `\nErrors (${report.errors.length}):\n`;
    for (const e of report.errors.slice(0, 10)) {
      body += `  - ${e}\n`;
    }
  }

  body += `\nTimestamp: ${report.timestamp}\n`;
  return body;
}

async function sendSlack(webhookUrl: string, report: PipelineReport): Promise<boolean> {
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formatSlackMessage(report)),
    });
    if (!res.ok) {
      console.error(`Slack webhook failed: ${res.status} ${res.statusText}`);
      return false;
    }
    console.log('Slack notification sent');
    return true;
  } catch (err: any) {
    console.error(`Slack send error: ${err.message}`);
    return false;
  }
}

async function sendEmail(report: PipelineReport): Promise<boolean> {
  const to = process.env.NOTIFY_EMAIL;
  if (!to) return false;

  const sgKey = process.env.SENDGRID_API_KEY;
  if (sgKey) {
    try {
      const status = report.errors.length === 0 ? 'Success' : 'Errors';
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sgKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: process.env.NOTIFY_FROM || 'noreply@steamnewsdaily.com', name: 'SteamPulse' },
          subject: `[SteamPulse] Daily Pipeline — ${status} (${report.articlesGenerated || 0} articles)`,
          content: [{ type: 'text/plain', value: formatEmailBody(report) }],
        }),
      });
      if (res.ok || res.status === 202) {
        console.log(`Email sent to ${to}`);
        return true;
      }
      console.error(`SendGrid failed: ${res.status}`);
    } catch (err: any) {
      console.error(`Email send error: ${err.message}`);
    }
  }

  return false;
}

export async function notify(
  steps: PipelineReport['steps'],
  mode: string,
): Promise<void> {
  const report = buildReport(steps, mode);

  const slackUrl = process.env.SLACK_WEBHOOK_URL;
  if (slackUrl) await sendSlack(slackUrl, report);

  if (process.env.NOTIFY_EMAIL) await sendEmail(report);

  if (!slackUrl && !process.env.NOTIFY_EMAIL) {
    console.log('\nNo notification configured (set SLACK_WEBHOOK_URL or NOTIFY_EMAIL + SENDGRID_API_KEY)');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const testSteps = [
    { name: 'Fetch Trending', durationMs: 5200, success: true },
    { name: 'Generate Articles', durationMs: 45000, success: true },
    { name: 'Build Site', durationMs: 3800, success: true },
  ];
  const report = buildReport(testSteps, 'full');
  console.log('Test report:');
  console.log(formatEmailBody(report));
  console.log('\nSlack payload:');
  console.log(JSON.stringify(formatSlackMessage(report), null, 2));
}
