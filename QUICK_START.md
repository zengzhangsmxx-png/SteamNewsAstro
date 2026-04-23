# SteamNewsAstro - 快速开始

## 🚀 立即使用

### 1. 查看网站
```bash
cd /Users/gengbiaozeng/projects/SteamNewsAstro

# 开发模式（热重载）
npm run dev
# 访问 http://localhost:4321

# 生产预览
npm run build
npm run preview
# 访问 http://localhost:4321
```

### 2. 浏览内容
- **首页**: http://localhost:4321
- **新闻**: http://localhost:4321/news
- **评测**: http://localhost:4321/reviews
- **攻略**: http://localhost:4321/guides
- **示例文章**: http://localhost:4321/news/cs2-major-update

### 3. 检查 SEO
- **RSS**: http://localhost:4321/rss.xml
- **Sitemap**: http://localhost:4321/sitemap-index.xml
- **robots.txt**: http://localhost:4321/robots.txt

## 📝 添加新文章

### 新闻文章
```bash
cat > src/content/news/your-article.md << 'ARTICLE'
---
title: "Your Article Title"
description: "Meta description under 160 chars"
publishDate: 2024-03-20
heroImage: "/images/heroes/your-image.svg"
heroImageAlt: "Image description"
category: "news"
tags: ["Tag1", "Tag2"]
gameTitle: "Game Name"
steamAppId: 12345
author:
  name: "Alex Chen"
  bio: "Gaming journalist"
readingTime: 5
featured: false
draft: false
tldr: "Quick summary for TL;DR box"
faq:
  - question: "Question 1?"
    answer: "Answer 1"
  - question: "Question 2?"
    answer: "Answer 2"
---

Your article content here...
ARTICLE
```

### 评测文章
```bash
cat > src/content/reviews/your-review.md << 'REVIEW'
---
title: "Game Review Title"
description: "Meta description"
publishDate: 2024-03-20
heroImage: "/images/heroes/your-image.svg"
heroImageAlt: "Image description"
category: "review"
tags: ["Tag1", "Tag2"]
gameTitle: "Game Name"
steamAppId: 12345
author:
  name: "Sarah Martinez"
  bio: "RPG specialist"
readingTime: 7
rating: 8
pros:
  - "Pro 1"
  - "Pro 2"
cons:
  - "Con 1"
  - "Con 2"
featured: false
draft: false
tldr: "Quick verdict"
faq:
  - question: "Question?"
    answer: "Answer"
---

Your review content here...
REVIEW
```

### 攻略文章
```bash
cat > src/content/guides/your-guide.md << 'GUIDE'
---
title: "Guide Title"
description: "Meta description"
publishDate: 2024-03-20
heroImage: "/images/heroes/your-image.svg"
heroImageAlt: "Image description"
category: "guide"
tags: ["Tag1", "Tag2"]
gameTitle: "Game Name"
steamAppId: 12345
author:
  name: "Marcus Johnson"
  bio: "Guide writer"
readingTime: 10
difficulty: "beginner"
featured: false
draft: false
tldr: "Key takeaway"
faq:
  - question: "Question?"
    answer: "Answer"
---

Your guide content here...
GUIDE
```

## 🎨 定制站点

### 修改配置
编辑 `site.config.ts`:
```typescript
export const siteConfig = {
  name: 'YourSiteName',              // 改这里
  url: 'https://yoursite.com',       // 改这里
  description: 'Your description',   // 改这里
  
  steam: {
    appIds: [730, 570, 440],         // 你的游戏列表
    categories: ['fps', 'rpg'],      // 你的分类
  },
  
  theme: {
    accentColor: '#66c0f4',          // 你的品牌色
  },
};
```

### 替换 Logo
```bash
# 替换站点 logo
cp your-logo.svg public/logo.svg

# 替换网站图标
cp your-favicon.svg public/favicon.svg
```

### 添加 Hero 图片
```bash
# 复制图片到 public/images/heroes/
cp your-image.jpg public/images/heroes/your-game.svg

# 或生成 SVG 占位符
bash scripts/generate-placeholders.sh
```

## 🤖 AI 内容生成

### 设置 API Key
```bash
echo "ANTHROPIC_API_KEY=sk-ant-your-key" > .env
```

### 生成文章
```bash
# 生成示例文章
npm run generate

# 生成 + 构建
npm run generate:build
```

### 自定义生成
编辑 `scripts/generate-content.ts` 中的 `DEFAULT_REQUESTS` 数组。

## 🚢 部署

### Cloudflare Pages
```bash
npm run build
# 上传 dist/ 目录到 Cloudflare Pages
```

### Vercel
```bash
npm run build
vercel --prod
```

### Netlify
```bash
npm run build
netlify deploy --prod --dir=dist
```

## 📊 检查清单

部署前检查：
- [ ] 修改 `site.config.ts` 中的站点信息
- [ ] 替换 `public/logo.svg` 和 `public/favicon.svg`
- [ ] 添加至少 10 篇文章
- [ ] 运行 `npm run build` 确认无错误
- [ ] 检查 `dist/sitemap-index.xml` 包含所有页面
- [ ] 检查 `dist/rss.xml` 格式正确
- [ ] 测试响应式设计（调整浏览器窗口）

## 🔧 常见问题

### 构建失败
```bash
# 清理缓存重新构建
rm -rf .astro dist node_modules
npm install
npm run build
```

### 图片不显示
- 确保图片在 `public/images/heroes/` 目录
- 检查 frontmatter 中的 `heroImage` 路径正确
- SVG 文件需要有正确的 XML 声明

### 字体加载慢
- 当前使用 Google Fonts CDN，已经很快
- 如需自托管，下载字体到 `public/fonts/` 并修改 `src/styles/global.css`

### 样式不生效
- 确保 Tailwind 类名在 `content` 配置中
- 检查 `tailwind.config.mjs` 的 `content` 数组
- 运行 `npm run build` 重新生成 CSS

## 📚 更多文档

- `README.md` — 完整项目文档
- `PROJECT_SUMMARY.md` — 项目总结
- `PROJECT_STATUS.md` — 当前状态
- `.env.example` — 环境变量示例

## 💡 提示

- 使用 `draft: true` 隐藏未完成的文章
- 使用 `featured: true` 设置首页 Hero 文章
- 标签会自动生成标签页
- 分类必须在 `site.config.ts` 中定义
- 所有日期使用 ISO 格式 (YYYY-MM-DD)
- 图片建议尺寸: 1200x675 (16:9)

---

**需要帮助？** 查看完整文档或提交 Issue。
