# Cloudflare Pages 部署指南

## 1. 创建 Cloudflare Pages 项目

### 方式 A：Cloudflare Dashboard（推荐首次）

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 左侧菜单 → **Workers & Pages** → **Create**
3. 选择 **Pages** → **Connect to Git**
4. 授权 GitHub，选择 `zengzhangsmxx-png/SteamNewsAstro`
5. 配置构建设置：
   - **Project name**: `steampulse`（或你想要的名称）
   - **Production branch**: `main`
   - **Framework preset**: `Astro`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Node.js version**: `22`（在 Environment variables 中设置 `NODE_VERSION=22`）
6. 点击 **Save and Deploy**

> 首次部署完成后，你会得到一个 `steampulse.pages.dev` 的 URL。

### 方式 B：Wrangler CLI

```bash
# 安装 wrangler
npm install -g wrangler

# 登录
wrangler login

# 创建项目（首次）
wrangler pages project create steampulse

# 手动部署
npm run build
wrangler pages deploy dist --project-name=steampulse
```

## 2. 配置 GitHub Secrets

在 GitHub 仓库 → **Settings** → **Secrets and variables** → **Actions** 中添加：

| Secret 名称 | 获取方式 | 说明 |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare Dashboard → My Profile → API Tokens → Create Token → 选择 "Edit Cloudflare Workers" 模板 | 需要 `Account:Cloudflare Pages:Edit` 权限 |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Dashboard → 任意域名 → 右侧 Overview → Account ID | 32 位十六进制字符串 |
| `CLOUDFLARE_PROJECT_NAME` | 你在步骤 1 中创建的项目名称 | 例如 `steampulse` |

### 创建 API Token 详细步骤

1. 访问 https://dash.cloudflare.com/profile/api-tokens
2. 点击 **Create Token**
3. 选择 **Custom token**
4. 配置权限：
   - **Account** → **Cloudflare Pages** → **Edit**
   - **Account** → **Account Settings** → **Read**
5. **Account Resources**: 选择你的账户
6. 点击 **Continue to summary** → **Create Token**
7. 复制 Token（只显示一次）

## 3. 自定义域名（可选）

### 添加自定义域名

1. Cloudflare Dashboard → Workers & Pages → `steampulse` 项目
2. **Custom domains** → **Set up a custom domain**
3. 输入域名：`steamnewsdaily.com`
4. Cloudflare 会自动配置 DNS 记录

### 如果域名不在 Cloudflare

需要在你的 DNS 提供商添加 CNAME 记录：
```
CNAME  @  steampulse.pages.dev
CNAME  www  steampulse.pages.dev
```

## 4. 验证部署

### 自动部署触发条件

- **push 到 main**: 修改 `src/`, `public/`, `astro.config.mjs`, `package.json` 时自动触发
- **每日定时**: UTC 1:00（北京 9:00）生成内容后自动部署
- **手动触发**: GitHub Actions → Deploy to Cloudflare Pages → Run workflow

### 检查部署状态

```bash
# 查看最近部署
gh run list --workflow=deploy.yml --limit 5

# 查看部署详情
gh run view <run-id>

# 手动触发部署
gh workflow run deploy.yml
```

### 验证 URL

- 默认域名: `https://steampulse.pages.dev`
- 自定义域名: `https://steamnewsdaily.com`（配置后）
- 中文版: `https://steampulse.pages.dev/zh/`
- 日文版: `https://steampulse.pages.dev/ja/`

## 5. 性能优化（Cloudflare 自带）

Cloudflare Pages 默认提供：
- 全球 CDN（300+ 节点）
- 自动 HTTPS
- HTTP/3 + Brotli 压缩
- 自动缓存静态资源
- DDoS 防护

### 可选：Page Rules

在 Cloudflare Dashboard → Rules → Page Rules 中添加：

```
URL: steamnewsdaily.com/*
Cache Level: Cache Everything
Edge Cache TTL: 1 day
Browser Cache TTL: 4 hours
```

## 6. 环境变量汇总

GitHub Secrets 中需要配置的所有变量：

| 变量 | 用途 | 必需 |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare Pages 部署 | 是 |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 账户标识 | 是 |
| `CLOUDFLARE_PROJECT_NAME` | Pages 项目名称 | 是 |
| `ANTHROPIC_API_KEY` | Claude API 密钥（内容生成） | 是 |
| `ANTHROPIC_BASE_URL` | 中转 API 地址 | 可选 |
| `ANTHROPIC_MODEL` | 模型选择 | 可选 |
