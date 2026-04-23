# SteamNewsAstro AI 自动化建站改进方向

基于 YouTube 站群 Top50 视频分析 + 当前项目现状

---

## 📊 当前项目现状诊断

### ✅ 已具备的能力
1. **内容生成基础设施**
   - Claude API 集成（generate-content.ts）
   - Steam API 数据获取（steam-api.ts）
   - 图片生成（image-generator.ts + SVG fallback）
   - SEO/GEO 优化提示词（CORE-EEAT）

2. **站群复制能力**
   - 单一配置文件（site.config.ts）控制全站
   - Content Collections 类型安全
   - 静态构建（103 页，1.86 秒）
   - Pagefind 搜索集成

3. **部署就绪**
   - Cloudflare Pages / Vercel / Netlify 兼容
   - RSS / Sitemap / robots.txt 自动生成
   - 零 JS 运行时（Astro SSG）

### ❌ 缺失的自动化能力
1. **内容源自动化**
   - ❌ 无定时任务（cron/GitHub Actions）
   - ❌ 无热门游戏自动发现（Steam Top 50）
   - ❌ 无内容去重机制
   - ❌ 无发布历史追踪

2. **批量站群管理**
   - ❌ 无多站点配置管理
   - ❌ 无批量部署脚本
   - ❌ 无站点健康监控

3. **内容质量控制**
   - ❌ 无 AI 生成内容审核
   - ❌ 无原创度检测
   - ❌ 无 SEO 质量评分

---

## 🎯 改进方向（基于 Top50 视频核心主题）

### 方向 1：全自动内容管线（优先级：⭐⭐⭐⭐⭐）

**参考视频：**
- #5: WordPress blog automation with AI (n8n + Gemini)
- #14: AI Creates Top-Ranking Blogs in 7 Minutes (Rankenstein v9.2)
- #49: n8n + WordPress Fully Automatic Blog

**核心方法：**
```
Steam API → 热门游戏发现 → AI 生成文章 → 质量检测 → 自动发布
```

**具体实施：**

#### 1.1 热门游戏自动发现
```typescript
// scripts/fetch-trending.ts
export async function fetchTrendingGames() {
  // 1. 获取 Steam Top 50 热销游戏
  const topSellers = await getTopSellers(); // 已有函数
  
  // 2. 批量获取详细数据（玩家数、评分、新闻）
  const gamesData = await getMultipleGameData(topSellers.slice(0, 50));
  
  // 3. 过滤规则
  const filtered = gamesData.filter(game => 
    game.currentPlayers > 10000 &&  // 至少 1 万在线
    game.reviewPercentage > 70 &&   // 好评率 > 70%
    game.totalReviews > 1000        // 至少 1000 评论
  );
  
  // 4. 写入缓存（避免重复生成）
  writeFileSync('cache/trending-games.json', JSON.stringify(filtered));
  
  return filtered;
}
```

**风险控制：**
- Steam API 限流：200 请求/5 分钟 → 每个游戏间隔 1.5 秒
- 缓存有效期：6 小时（避免频繁请求）
- 失败重试：3 次，指数退避

#### 1.2 动态文章生成策略
```typescript
// scripts/generate-dynamic.ts
export async function generateArticlesFromTrending() {
  const trending = JSON.parse(readFileSync('cache/trending-games.json'));
  
  // 每个游戏生成 1-2 篇文章（根据热度）
  const requests = trending.flatMap(game => {
    const articles = [];
    
    // 高热度游戏（>10万在线）：新闻 + 评测 + 攻略
    if (game.currentPlayers > 100000) {
      articles.push(
        { type: 'news', game, topic: `${game.name} 突破 ${formatNumber(game.currentPlayers)} 在线玩家` },
        { type: 'review', game, topic: `${game.name} 深度评测` },
        { type: 'guide', game, topic: `${game.name} 新手入门指南` }
      );
    }
    // 中热度游戏（1-10万）：新闻 + 评测
    else if (game.currentPlayers > 10000) {
      articles.push(
        { type: 'news', game, topic: `${game.name} 近期更新` },
        { type: 'review', game, topic: `${game.name} 值得买吗？` }
      );
    }
    
    return articles;
  });
  
  // 去重：检查已发布文章
  const published = getPublishedArticles();
  const newRequests = requests.filter(req => 
    !published.some(p => p.gameTitle === req.game.name && p.type === req.type)
  );
  
  // 批量生成（限制每次 20 篇）
  return generateBatch(newRequests.slice(0, 20));
}
```

**动作清单：**
- [ ] 创建 `scripts/fetch-trending.ts`
- [ ] 创建 `scripts/generate-dynamic.ts`
- [ ] 创建 `cache/` 目录存储中间结果
- [ ] 创建 `logs/published.json` 追踪已发布文章

---

### 方向 2：GitHub Actions 定时发布（优先级：⭐⭐⭐⭐⭐）

**参考视频：**
- #20: Smart AI Workflow for Online Work | Daily Automation
- #48: AI SEO in 2025: The Complete Automation Playbook

**核心方法：**
```yaml
# .github/workflows/daily-publish.yml
name: Daily Content Generation

on:
  schedule:
    - cron: '0 9 * * *'  # 每天 UTC 9:00（北京时间 17:00）
  workflow_dispatch:      # 支持手动触发

jobs:
  generate-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Fetch trending games
        run: npm run fetch-trending
        env:
          STEAM_API_KEY: ${{ secrets.STEAM_API_KEY }}
          
      - name: Generate articles
        run: npm run generate-dynamic
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          
      - name: Generate images
        run: npm run generate:images
        env:
          VAP_API_KEY: ${{ secrets.VAP_API_KEY }}
          
      - name: Build site
        run: npm run build
        
      - name: Commit new content
        run: |
          git config user.name "GitHub Actions Bot"
          git config user.email "actions@github.com"
          git add src/content/
          git commit -m "chore: auto-generate content $(date +'%Y-%m-%d')" || echo "No changes"
          git push
          
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: steampulse
          directory: dist
```

**风险控制：**
- API 配额耗尽 → 设置每日生成上限（20 篇）
- 构建失败 → 发送 Slack/Email 通知
- 内容质量差 → 人工审核队列（可选）

**动作清单：**
- [ ] 创建 `.github/workflows/daily-publish.yml`
- [ ] 在 GitHub Secrets 中配置 API keys
- [ ] 测试手动触发（workflow_dispatch）
- [ ] 监控首次自动运行

---

### 方向 3：n8n 工作流编排（优先级：⭐⭐⭐⭐）

**参考视频：**
- #5: WordPress automation with n8n + Gemini
- #8: Complete AI Automation using n8n
- #49: n8n + WordPress Fully Automatic Blog

**核心方法：**
```
n8n 工作流：
1. Cron Trigger（每天 9:00）
2. HTTP Request → Steam API（获取 Top 50）
3. Filter（过滤低质量游戏）
4. Loop（遍历每个游戏）
5. HTTP Request → Claude API（生成文章）
6. HTTP Request → VAP API（生成图片）
7. Git Commit（提交到仓库）
8. Webhook → Cloudflare Pages（触发部署）
9. Slack Notification（发送日报）
```

**优势：**
- 可视化编排（无需写代码）
- 错误重试机制内置
- 支持条件分支（质量检测）
- 可接入更多数据源（Reddit、Twitter、Discord）

**实施步骤：**
1. 自托管 n8n（Docker）或使用 n8n.cloud
2. 创建工作流模板
3. 配置 Webhook 触发器
4. 测试端到端流程

**动作清单：**
- [ ] 部署 n8n 实例（Docker Compose）
- [ ] 创建 Steam → Claude → Git 工作流
- [ ] 配置错误通知（Slack/Email）
- [ ] 导出工作流 JSON 备份

---

### 方向 4：内容质量自动检测（优先级：⭐⭐⭐⭐）

**参考视频：**
- #1: AI Parasites Are Infecting The Internet（强调质量阈值）
- #24: Build An SEO-Perfect Website With AI
- #48: AI SEO Automation Playbook

**核心方法：**
```typescript
// scripts/quality-check.ts
export async function checkArticleQuality(article: string) {
  const checks = {
    // 1. 长度检测
    wordCount: article.split(/\s+/).length,
    minWords: 800,
    maxWords: 2000,
    
    // 2. 原创度检测（简单版：检查重复句子）
    uniqueSentences: new Set(article.match(/[^.!?]+[.!?]/g)).size,
    totalSentences: article.match(/[^.!?]+[.!?]/g)?.length || 0,
    
    // 3. SEO 元素检测
    hasH2: /<h2>/.test(article) || /^## /.test(article),
    hasTable: /<table>/.test(article) || /\|.*\|/.test(article),
    hasList: /<ul>|<ol>/.test(article) || /^[-*] /.test(article),
    
    // 4. 关键词密度（避免堆砌）
    keywordDensity: calculateKeywordDensity(article),
    
    // 5. 可读性（Flesch Reading Ease）
    readability: calculateReadability(article),
  };
  
  // 评分规则
  let score = 0;
  if (checks.wordCount >= checks.minWords && checks.wordCount <= checks.maxWords) score += 20;
  if (checks.uniqueSentences / checks.totalSentences > 0.9) score += 20; // 90% 句子唯一
  if (checks.hasH2 && checks.hasTable && checks.hasList) score += 30;
  if (checks.keywordDensity < 0.03) score += 15; // 关键词密度 < 3%
  if (checks.readability > 60) score += 15; // 可读性良好
  
  return {
    score,
    passed: score >= 70,
    checks,
    recommendation: score < 70 ? '建议重新生成' : '质量合格'
  };
}
```

**风险控制：**
- 质量不达标 → 自动重新生成（最多 3 次）
- 仍不达标 → 写入人工审核队列
- 记录质量分数 → 优化提示词

**动作清单：**
- [ ] 创建 `scripts/quality-check.ts`
- [ ] 集成到生成管线（generate-dynamic.ts）
- [ ] 创建 `logs/quality-scores.json` 追踪质量趋势
- [ ] 设置质量阈值（可配置）

---

### 方向 5：多站点批量管理（优先级：⭐⭐⭐）

**参考视频：**
- #1: AI Parasites（强调批量复制）
- #7: Selling AI Websites to Local Businesses
- #23: Cloudflare Workers/Pages 免费部署

**核心方法：**
```typescript
// sites.config.ts
export const sites = [
  {
    id: 'steampulse-en',
    name: 'SteamPulse',
    url: 'https://steampulse.com',
    language: 'en',
    categories: ['fps', 'rpg', 'strategy'],
    targetGames: [730, 570, 440], // CS2, Dota 2, TF2
  },
  {
    id: 'steampulse-zh',
    name: 'Steam 脉动',
    url: 'https://steampulse.cn',
    language: 'zh',
    categories: ['moba', 'mmorpg', 'battle-royale'],
    targetGames: [1172470, 892970], // Apex, Valheim
  },
  // ... 1000+ 站点配置
];

// scripts/deploy-all.ts
export async function deployAllSites() {
  for (const site of sites) {
    console.log(`Deploying ${site.id}...`);
    
    // 1. 切换配置
    writeFileSync('site.config.ts', generateSiteConfig(site));
    
    // 2. 生成内容
    await generateArticlesForSite(site);
    
    // 3. 构建
    await exec('npm run build');
    
    // 4. 部署到 Cloudflare Pages
    await deployToCloudflare(site.id, 'dist/');
    
    // 5. 记录部署状态
    logDeployment(site.id, 'success');
  }
}
```

**Cloudflare Pages 优势：**
- 免费额度：500 次构建/月，无限带宽
- 自动 HTTPS + CDN
- 支持自定义域名
- Git 集成（推送即部署）

**动作清单：**
- [ ] 创建 `sites.config.ts` 多站点配置
- [ ] 创建 `scripts/deploy-all.ts` 批量部署脚本
- [ ] 注册 Cloudflare 账号，创建 Pages 项目
- [ ] 测试单站点部署流程
- [ ] 扩展到 10 个站点验证

---

### 方向 6：Cloudflare Workers 边缘计算（优先级：⭐⭐⭐）

**参考视频：**
- #23: Cloudflare 免费用到爽！Workers/Pages 全搞定
- #33: Stop Paying for Hosting: AI Builds & Hosts for FREE

**核心方法：**
```typescript
// workers/api.ts
export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    
    // 1. 动态内容生成（边缘计算）
    if (url.pathname === '/api/generate') {
      const game = url.searchParams.get('game');
      const article = await generateArticleOnEdge(game, env.ANTHROPIC_API_KEY);
      return new Response(article, { headers: { 'Content-Type': 'text/html' } });
    }
    
    // 2. 热门游戏缓存（KV 存储）
    if (url.pathname === '/api/trending') {
      const cached = await env.TRENDING_CACHE.get('games');
      if (cached) return new Response(cached);
      
      const trending = await fetchTrendingGames();
      await env.TRENDING_CACHE.put('games', JSON.stringify(trending), { expirationTtl: 3600 });
      return new Response(JSON.stringify(trending));
    }
    
    // 3. 静态资源（Pages）
    return env.ASSETS.fetch(request);
  }
};
```

**优势：**
- 全球边缘节点（低延迟）
- 免费额度：100,000 请求/天
- KV 存储：1GB 免费
- 无需服务器维护

**动作清单：**
- [ ] 创建 Cloudflare Workers 项目
- [ ] 实现 `/api/trending` 缓存接口
- [ ] 实现 `/api/generate` 动态生成接口
- [ ] 集成 KV 存储（缓存热门游戏）
- [ ] 部署到生产环境

---

### 方向 7：Claude Code + Stitch 快速建站（优先级：⭐⭐）

**参考视频：**
- #15: Claude Code + Stitch 2.0 = UNLIMITED $10,000 Websites
- #18: Vibe coded Apple-Style Website With Claude
- #22: Google Stitch + AntiGravity: Build AI Websites FREE

**核心方法：**
1. 使用 Stitch 设计 UI 原型（拖拽式）
2. 导出 HTML/CSS 代码
3. 用 Claude Code 转换为 Astro 组件
4. 集成到 SteamNewsAstro 模板

**优势：**
- 快速迭代 UI 设计
- 无需手写 CSS
- 自动响应式布局
- 可复用组件库

**动作清单：**
- [ ] 注册 Google Stitch 账号
- [ ] 设计 3 个页面模板（首页、文章页、列表页）
- [ ] 导出代码并转换为 Astro 组件
- [ ] 替换当前模板

---

## 🚀 实施路线图（3 个月）

### 第 1 个月：核心自动化（MVP）
**目标：实现每日自动发布 10 篇文章**

- Week 1: 实现热门游戏自动发现（方向 1.1）
- Week 2: 实现动态文章生成（方向 1.2）
- Week 3: 配置 GitHub Actions 定时任务（方向 2）
- Week 4: 测试端到端流程，修复 bug

**验收标准：**
- ✅ 每天自动生成 10 篇文章
- ✅ 自动提交到 Git
- ✅ 自动部署到 Cloudflare Pages
- ✅ 无人工干预运行 7 天

### 第 2 个月：质量控制 + 多站点
**目标：扩展到 10 个站点，质量分数 > 80**

- Week 5-6: 实现内容质量检测（方向 4）
- Week 7: 创建多站点配置（方向 5）
- Week 8: 批量部署 10 个站点

**验收标准：**
- ✅ 质量分数平均 > 80
- ✅ 10 个站点正常运行
- ✅ 每个站点每天 5-10 篇新文章

### 第 3 个月：规模化 + 监控
**目标：扩展到 100 个站点，建立监控体系**

- Week 9-10: 实现 n8n 工作流（方向 3）
- Week 11: 部署 Cloudflare Workers（方向 6）
- Week 12: 建立监控面板（站点健康、流量、收入）

**验收标准：**
- ✅ 100 个站点正常运行
- ✅ 监控面板实时显示关键指标
- ✅ 自动告警机制（站点宕机、API 配额耗尽）

---

## 📈 预期效果

### 内容产出
- **当前：** 手动生成 20 篇文章（耗时 2 小时）
- **自动化后：** 每天自动生成 1000 篇文章（100 站点 × 10 篇）

### 成本
- **Cloudflare Pages：** 免费（500 构建/月）
- **Claude API：** $0.003/1K tokens × 2K tokens/篇 × 1000 篇 = $6/天
- **Steam API：** 免费
- **总成本：** ~$180/月（纯 API 成本）

### 收入潜力（假设）
- 每站点日均 100 UV × 100 站点 = 10,000 UV/天
- Google AdSense RPM $2 → $20/天 = $600/月
- 联盟营销（Steam 游戏推荐）→ $300/月
- **总收入：** ~$900/月
- **净利润：** $720/月（ROI 400%）

---

## ⚠️ 风险与应对

### 风险 1：AI 生成内容被 Google 降权
**应对：**
- 质量检测（方向 4）确保原创度 > 90%
- 人工审核抽查（10% 文章）
- 添加用户评论区（UGC 内容）
- 引用权威来源（Steam 官方数据）

### 风险 2：API 配额耗尽
**应对：**
- 设置每日生成上限（1000 篇）
- 使用多个 API key 轮换
- 缓存热门游戏数据（6 小时）
- 降级策略（API 失败时使用模板）

### 风险 3：站点被封禁
**应对：**
- 分散域名（不同注册商）
- 使用 Cloudflare 隐藏源站 IP
- 遵守 robots.txt 和 sitemap 规范
- 避免黑帽 SEO 手法

### 风险 4：内容同质化
**应对：**
- 每个站点差异化定位（语言、游戏类型、受众）
- 动态调整提示词（根据站点风格）
- 引入多样化内容源（Reddit、Discord、Twitter）

---

## 🎓 学习资源（基于 Top50 视频）

### 必看视频（优先级排序）
1. **#5: WordPress automation with n8n + Gemini** → 学习工作流编排
2. **#14: AI Creates Top-Ranking Blogs in 7 Minutes** → 学习 SEO 优化
3. **#23: Cloudflare 免费部署全搞定** → 学习免费托管
4. **#15: Claude Code + Stitch 2.0** → 学习快速建站
5. **#48: AI SEO Automation Playbook** → 学习 SEO 自动化

### 工具栈推荐
- **内容生成：** Claude API（当前）或 Gemini 3.0（免费额度大）
- **工作流编排：** n8n（开源）或 Make.com（可视化）
- **托管：** Cloudflare Pages（免费）
- **监控：** UptimeRobot（免费）+ Google Analytics
- **图片生成：** Flux（VAP API）或 DALL-E 3

---

## 📝 下一步行动

### 立即执行（本周）
1. [ ] 创建 `scripts/fetch-trending.ts`（2 小时）
2. [ ] 创建 `scripts/generate-dynamic.ts`（3 小时）
3. [ ] 配置 GitHub Actions（1 小时）
4. [ ] 测试端到端流程（2 小时）

### 短期目标（本月）
1. [ ] 实现每日自动发布 10 篇文章
2. [ ] 部署到 Cloudflare Pages
3. [ ] 监控运行 7 天，修复 bug

### 中期目标（3 个月）
1. [ ] 扩展到 100 个站点
2. [ ] 实现内容质量自动检测
3. [ ] 建立监控面板

### 长期目标（6 个月）
1. [ ] 扩展到 1000 个站点
2. [ ] 月收入 > $5000
3. [ ] 开发 SaaS 平台（卖给其他站长）

---

## 💡 创新点（超越 Top50 视频）

### 1. 游戏热度预测
- 使用 Steam 历史数据训练模型
- 预测未来 7 天热门游戏
- 提前生成内容（抢占先机）

### 2. 多语言自动翻译
- 英文文章 → Claude 翻译 → 中文/日文/韩文站点
- 1 篇文章 → 10 种语言 → 10 倍内容产出

### 3. 用户行为分析
- 追踪哪些文章点击率高
- 自动调整生成策略（更多热门类型）
- A/B 测试标题和封面图

### 4. 社区互动
- 自动回复用户评论（Claude API）
- 生成每周热门游戏排行榜
- 用户投票决定下周生成哪些游戏

---

**总结：** 当前项目已具备 70% 的自动化基础，只需补齐定时任务、热门游戏发现、质量检测 3 个关键模块，即可实现全自动运营。预计 1 个月内可达到每日自动发布 10 篇文章，3 个月内扩展到 100 个站点。
