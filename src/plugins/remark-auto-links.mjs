import { visit } from 'unist-util-visit';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

function buildGameLinkMap() {
  const contentDir = join(process.cwd(), 'src/content');
  const linkMap = new Map();

  for (const col of ['reviews', 'guides', 'news']) {
    const dir = join(contentDir, col);
    let files;
    try { files = readdirSync(dir).filter(f => f.endsWith('.md')); } catch { continue; }

    for (const file of files) {
      const content = readFileSync(join(dir, file), 'utf-8');
      const match = content.match(/^gameTitle:\s*"?([^"\n]+)"?\s*$/m);
      if (!match) continue;
      const game = match[1].trim();
      const slug = file.replace('.md', '');
      const href = `/${col}/${slug}/`;

      if (!linkMap.has(game)) {
        linkMap.set(game, { review: null, guide: null, news: null });
      }
      const entry = linkMap.get(game);
      if (col === 'reviews' && !entry.review) entry.review = href;
      else if (col === 'guides' && !entry.guide) entry.guide = href;
      else if (col === 'news' && !entry.news) entry.news = href;
    }
  }

  return linkMap;
}

let cachedMap = null;

export function remarkAutoLinks() {
  return (tree, file) => {
    if (!cachedMap) cachedMap = buildGameLinkMap();

    const currentPath = file?.history?.[0] || '';
    let currentGame = null;
    visit(tree, 'yaml', (node) => {
      const m = node.value?.match(/^gameTitle:\s*"?([^"\n]+)"?\s*$/m);
      if (m) currentGame = m[1].trim();
    });

    const linked = new Set();

    visit(tree, 'text', (node, index, parent) => {
      if (!parent || parent.type === 'link' || parent.type === 'heading') return;

      for (const [game, links] of cachedMap) {
        if (linked.has(game)) continue;
        if (game === currentGame) continue;
        if (game.length < 4) continue;

        const pos = node.value.indexOf(game);
        if (pos === -1) continue;

        const href = links.review || links.guide || links.news;
        if (!href) continue;
        if (currentPath.includes(href.split('/')[1])) continue;

        const before = node.value.slice(0, pos);
        const after = node.value.slice(pos + game.length);

        const newNodes = [];
        if (before) newNodes.push({ type: 'text', value: before });
        newNodes.push({
          type: 'link',
          url: href,
          title: `Read more about ${game}`,
          children: [{ type: 'text', value: game }],
        });
        if (after) newNodes.push({ type: 'text', value: after });

        parent.children.splice(index, 1, ...newNodes);
        linked.add(game);
        return;
      }
    });
  };
}
