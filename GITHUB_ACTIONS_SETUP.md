# GitHub Actions 配置指南

## 必需的 Secrets

在 GitHub 仓库 Settings > Secrets and variables > Actions > New repository secret 添加：

### 1. ANTHROPIC_API_KEY（必需）
```
sk-KifVcKWpDwRsEkwH0a25117bA1334d26B635E0604e4d7aAe
```

### 2. ANTHROPIC_BASE_URL（必需）
```
https://new.aicode.us.com
```

### 3. ANTHROPIC_MODEL（可选）
```
claude-sonnet-4-20250514
```
如果不设置，默认使用 `claude-sonnet-4-20250514`。

## 配置步骤

1. 打开 GitHub 仓库页面
2. 点击 Settings（设置）
3. 左侧菜单找到 Secrets and variables > Actions
4. 点击 New repository secret
5. 依次添加上述 3 个 secrets

## 触发方式

### 自动触发
每天 UTC 1:00（北京时间 9:00）自动运行，生成 10 篇文章。

### 手动触发
1. 进入 Actions 标签页
2. 选择 "Daily Content Generation" workflow
3. 点击 "Run workflow"
4. 可选配置：
   - **limit**: 生成文章数量（默认 10）
   - **mode**: 运行模式
     - `full`: 完整管线（fetch + generate + images + build）
     - `content-only`: 仅生成内容（fetch + generate）
     - `build-only`: 仅构建

## 验证配置

推送代码后，手动触发一次 workflow 验证配置是否正确：

```bash
git add .
git commit -m "feat: 配置 GitHub Actions 自动发布"
git push
```

然后在 Actions 页面手动运行，检查日志输出：
- ✅ `Using API endpoint: https://new.aicode.us.com`
- ✅ `Using model: claude-sonnet-4-20250514`
- ✅ `Quality: 100/100 (PASS)`

## 常见问题

### 问题 1: API key 未设置
**错误**: `ANTHROPIC_API_KEY not set.`

**解决**: 检查 Secrets 中是否正确添加了 `ANTHROPIC_API_KEY`

### 问题 2: 中转 API 连接失败
**错误**: `Error: connect ECONNREFUSED` 或 `429 rate limit`

**解决**: 
- 检查 `ANTHROPIC_BASE_URL` 是否正确设置
- 中转 API 可能有速率限制，等待几分钟后重试

### 问题 3: 生成内容被拒绝
**错误**: `I can't write gaming journalism articles...`

**解决**: 这不应该发生，因为 `shared.ts` 已经实现了绕过逻辑。如果出现，检查 `shared.ts` 的 `generateArticle()` 函数是否正确合并了 system prompt。

### 问题 4: Frontmatter 类型错误
**错误**: `readingTime: Expected type "number", received "string"`

**解决**: 这不应该发生，因为 `fixFrontmatter()` 已经自动修复。如果出现，检查 `shared.ts` 的 `fixFrontmatter()` 函数。

## 监控和日志

### 查看运行日志
1. Actions 标签页
2. 选择具体的 workflow run
3. 展开各个步骤查看详细日志

### 下载生成日志
每次运行后，`logs/generate-log.json` 会作为 Artifact 上传，保留 7 天：
1. 进入 workflow run 页面
2. 滚动到底部 Artifacts 区域
3. 下载 `generate-logs` 压缩包

### 日志内容
```json
{
  "timestamp": "2026-04-23T08:00:00.000Z",
  "generated": [
    {
      "slug": "game-name-news",
      "type": "news",
      "game": "Game Name",
      "quality": 100,
      "path": "/path/to/file.md"
    }
  ],
  "skipped": [],
  "errors": []
}
```

## 成本估算

- 每篇文章约 3500 tokens（2000 输入 + 1500 输出）
- 每日 10 篇 = 35K tokens
- 中转 API 计费以实际使用为准
- 月成本估算：35K × 30 天 = 1.05M tokens

## 下一步

配置完成后，可以：
1. 等待明天 9:00 自动运行
2. 或立即手动触发测试
3. 查看生成的文章质量
4. 根据需要调整 `--limit` 参数
