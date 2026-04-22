---
name: wechat-article-viewer
description: "微信公众号文章完整阅读器。Use when: 用户提供 mp.weixin.qq.com 链接，需要阅读/总结文章内容。NOT for: 非微信链接的普通网页、需要登录的付费文章。"
metadata:
  openclaw:
    emoji: "📰"
    requires:
      bins: ["node"]
    install:
      - id: npm-deps
        kind: npm
        directory: "."
        packages: ["puppeteer-core"]
        label: "安装 Puppeteer (复用 Chrome)"
---

# WeChat Article Viewer

📰 微信公众号文章完整阅读器 - 解决 AI 无法抓取微信文章正文的痛点

---

## When to Run (自动触发规则)

**触发条件（满足任一即可）：**
- ✅ 用户消息中包含 `mp.weixin.qq.com` 链接
- ✅ 用户说"帮我读一下这篇公众号"、"总结这篇文章"
- ✅ 用户分享微信公众号文章并要求分析内容

**不触发：**
- ❌ 非微信链接的普通网页（知乎、CSDN 等）
- ❌ 需要登录的付费文章
- ❌ 视频号、小程序链接

**优先级：** 高（微信链接优先使用此 Skill）

---

## Workflow

### Step 1: 检查浏览器环境

检查本地是否有带调试端口的 Chrome 实例运行（默认端口 9222）：

**如果没有运行，提示用户启动方式：**
```bash
# macOS
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-debug-profile

# Windows
"C:\Program Files\Google\Chrome\Application\chrome.exe" ^
  --remote-debugging-port=9222 ^
  --user-data-dir=%TEMP%\chrome-debug-profile

# Linux
google-chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-debug-profile
```

### Step 2: 检查微信登录态

确认浏览器中已登录微信网页版：
- 访问 https://wx.qq.com
- 确认已登录（有 wap_sid2 Cookie）

### Step 3: 连接浏览器并打开链接

使用 Puppeteer 或 Chrome DevTools Protocol 连接到浏览器：
- 打开目标 URL
- 等待页面加载完成（等待 `.rich_media_content` 元素出现）
- 等待时间：最多 30 秒

### Step 4: 提取内容

从渲染后的页面中提取：
- **标题**：`.rich_media_title`
- **作者**：`.profile_nickname`
- **发布时间**：`.publish_time`
- **正文**：`.rich_media_content`（HTML 格式）
- **原文链接**：用户提供的 URL

### Step 5: 返回结构化结果

将提取的内容按输出格式返回给用户。

---

## Output Format

```
📰 **{标题}**

✍️ 作者：{作者}
📅 发布时间：{发布时间}

---

{正文内容（自动分段，保留格式）}

---

🔗 原文链接：{url}
```

**如果提取失败：**
```
❌ 无法读取文章

原因：{具体原因，如 Cookie 过期/网络问题/元素未找到}

解决方案：
{分步指引}
```

---

## Error Handling

### 错误场景及处理

| 错误 | 原因 | 解决方案 |
|-----|------|---------|
| **浏览器未启动** | 无调试端口 | 提供启动命令 |
| **连接失败** | 端口被占用 | 关闭其他调试进程 |
| **Cookie 过期** | 微信未登录 | 引导登录 wx.qq.com |
| **元素未找到** | 页面未加载完成 | 延长等待时间/重试 |
| **付费文章** | 需要公众号关注 | 提示用户关注后重试 |
| **网络超时** | 网络问题 | 建议重试/检查网络 |

### 分层诊断逻辑

```javascript
// 返回详细状态，而非简单 true/false
const status = {
  connected: false,
  has_debug_port: false,
  has_wechat_login: false,
  user_guidance: ""
};
```

---

## Technical Details

### 为什么普通抓取失败？

微信文章有**三层防御机制**：

| 防御层级 | 技术原理 | 普通抓取失败原因 |
|---------|---------|----------------|
| **第一层** | Cookie 鉴权 (wap_sid2) | web_fetch 不带 Cookie |
| **第二层** | JS 动态渲染 | web_fetch 不执行 JS |
| **第三层** | 反爬策略 (UA/Referer) | 请求头被识别为非浏览器 |

### 解决方案

```
用真正的浏览器去渲染页面
  ↓
携带有效 Cookie
  ↓
执行 JavaScript
  ↓
提取渲染后的 DOM
```

---

## Dependencies

### 必需

- Node.js >= 16
- Puppeteer (npm install puppeteer)
- Chrome/Chromium 浏览器

### 可选

- puppeteer-core (如果已有浏览器)

---

## Usage Examples

### 示例 1：读取文章

**用户：**
```
帮我读一下这篇文章：https://mp.weixin.qq.com/s/xxx
```

**助手：**
```
📰 **为什么"高带宽学习者"总能看到 10 年后的机会？**

✍️ 作者：OneOs 超级个体
📅 发布时间：2026 年 4 月 22 日

---

[文章正文内容...]

---

🔗 原文链接：https://mp.weixin.qq.com/s/xxx
```

### 示例 2：总结文章

**用户：**
```
总结这篇：https://mp.weixin.qq.com/s/xxx
```

**助手：**
```
📰 **文章总结**

**核心观点：**
1. ...
2. ...
3. ...

**关键洞察：**
- ...

🔗 原文链接：https://mp.weixin.qq.com/s/xxx
```

### 示例 3：环境未就绪

**用户：**
```
读一下：https://mp.weixin.qq.com/s/xxx
```

**助手：**
```
❌ 无法读取文章

原因：未检测到运行中的 Chrome 浏览器（调试端口 9222）

解决方案：
1. 打开终端，运行以下命令启动 Chrome：

   /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
     --remote-debugging-port=9222 \
     --user-data-dir=/tmp/chrome-debug-profile

2. 在新打开的浏览器中访问 https://wx.qq.com 并登录

3. 登录后，重新发送文章链接

✅ 配置完成后，我可以读取任何微信公众号文章！
```

---

## Design Patterns

### 模式 1：环境检查模式

```
1. 检查环境是否就绪
2. 如未就绪，返回清晰配置指引
3. 如已就绪，执行核心任务
```

### 模式 2：渐进式加载模式

```
SKILL.md 只放触发条件和简要流程
复杂逻辑放在 scripts/
```

### 模式 3：降级方案模式

```
1. 尝试方案 A（最快）
2. 如果失败，尝试方案 B（更稳定但更慢）
3. 如果仍失败，返回错误指引
```

---

## Related Files

| 文件 | 用途 |
|-----|------|
| `scripts/fetch_article.js` | 主执行脚本 |
| `scripts/check_browser.js` | 浏览器环境检查 |
| `references/browser_setup.md` | 浏览器配置详细说明 |

---

## Maintenance

### 定期检查

- [ ] Chrome 端口配置是否变化
- [ ] 微信网页版 DOM 结构是否更新
- [ ] Puppeteer 版本更新

### 已知限制

- ❌ 不支持付费文章（需要公众号关注）
- ❌ 不支持视频号内容
- ❌ 需要本地浏览器环境

---

## References

- [设计思路来源](https://blog.csdn.net/be_racle/article/details/159737660)
- [Puppeteer 文档](https://pptr.dev/)
- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)

---

🦞 红温 AI 助手 - 有问题随时找我！
