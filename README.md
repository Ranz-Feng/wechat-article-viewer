# 📰 WeChat Article Viewer

微信公众号文章完整阅读器 - OpenClaw Skill

[![OpenClaw Skill](https://img.shields.io/badge/OpenClaw-Skill-blue)](https://openclaw.ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow)](https://opensource.org/licenses/MIT)

---

## 📖 简介

这个 Skill 可以读取微信公众号文章的完整内容，解决普通网页抓取工具无法获取微信文章正文的问题。

**核心能力：**
- ✅ 绕过微信的三层防御机制（Cookie 鉴权、JS 动态渲染、反爬策略）
- ✅ 使用真实浏览器渲染页面
- ✅ 提取标题、作者、发布时间、正文内容
- ✅ 支持 OpenClaw 自动触发

---

## 🎯 使用场景

### 适合的场景 ✅

| 场景 | 示例 |
|-----|------|
| 读取公众号文章 | "帮我读一下这篇：https://mp.weixin.qq.com/s/xxx" |
| 总结文章内容 | "总结这篇公众号文章" |
| 提取关键信息 | "这篇文章讲了什么？" |
| 多篇文章对比 | "比较这两篇文章的观点" |

### 不适合的场景 ❌

| 场景 | 原因 |
|-----|------|
| 普通网页 | 用 web_fetch 就够了 |
| 付费文章 | 需要公众号关注，无法绕过 |
| 视频号/小程序 | 不是文章格式 |

---

## 🚀 快速开始

### 前置要求

- Node.js >= 16
- Google Chrome 浏览器
- 微信账号（用于登录网页版）

### 安装

```bash
# 克隆仓库
git clone https://github.com/bunniesmacbook/wechat-article-viewer.git
cd wechat-article-viewer

# 安装依赖
npm install
```

### 配置

#### 1. 启动 Chrome（调试模式）

**macOS:**
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-debug-profile
```

**Windows:**
```cmd
"C:\Program Files\Google\Chrome\Application\chrome.exe" ^
  --remote-debugging-port=9222 ^
  --user-data-dir=%TEMP%\chrome-debug-profile
```

**Linux:**
```bash
google-chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-debug-profile
```

#### 2. 登录微信网页版

在打开的 Chrome 中访问：**https://wx.qq.com** 并扫码登录

#### 3. 检查环境

```bash
node scripts/check_browser.js
```

**预期输出：**
```
✅ 所有检查通过！可以读取微信文章了！
```

---

## 📖 使用方法

### 方式 1：命令行

```bash
node scripts/fetch_article.js "https://mp.weixin.qq.com/s/xxx"
```

### 方式 2：OpenClaw 自动触发

在 OpenClaw 中直接发送微信文章链接，Skill 会自动激活：

```
用户：https://mp.weixin.qq.com/s/69pgTxHbwzljaPQkejwhZg

AI: 🔍 微信文章阅读器已激活
    📰 **文章标题**
    ✍️ 作者：xxx
    📅 发布时间：xxx
    
    [文章正文内容...]
    
    🔗 原文链接：...
```

### 方式 3：编程调用

```javascript
const { fetchAndRenderArticle } = require('./scripts/fetch_article');

const result = await fetchAndRenderArticle('https://mp.weixin.qq.com/s/xxx');

if (result.success) {
  console.log('标题:', result.data.title);
  console.log('作者:', result.data.author);
  console.log('正文:', result.data.content);
}
```

---

## 📁 项目结构

```
wechat-article-viewer/
├── SKILL.md                    # OpenClaw Skill 说明书
├── index.js                    # 执行入口
├── package.json                # 依赖管理
├── start_chrome.sh             # Chrome 启动脚本
├── scripts/
│   ├── check_browser.js        # 浏览器环境检查
│   └── fetch_article.js        # 文章抓取脚本
├── references/
│   └── browser_setup.md        # 浏览器配置详细说明
├── assets/                     # 资源文件
├── README.md                   # 本文件
└── LICENSE                     # MIT 许可证
```

---

## 🔧 技术原理

### 为什么普通抓取失败？

微信文章有**三层防御机制**：

| 防御层级 | 技术原理 | 普通抓取失败原因 |
|---------|---------|----------------|
| 第一层 | Cookie 鉴权 (wap_sid2) | web_fetch 不带 Cookie |
| 第二层 | JS 动态渲染 | web_fetch 不执行 JS |
| 第三层 | 反爬策略 (UA/Referer) | 请求头被识别为非浏览器 |

### 解决方案

```
用真正的浏览器去渲染页面
  ↓
携带有效 Cookie（微信登录态）
  ↓
执行 JavaScript
  ↓
提取渲染后的 DOM
```

---

## ⚠️ 注意事项

### 安全提醒

| 风险 | 说明 | 建议 |
|-----|------|------|
| **调试端口** | 9222 端口开放后，本地程序可控制浏览器 | 不要暴露到公网 |
| **Cookie 安全** | 微信登录态包含敏感信息 | 使用独立用户数据目录 |
| **使用频率** | 频繁抓取可能触发反爬 | 建议间隔 5 秒以上 |

### 已知限制

- ❌ 不支持付费文章（需要公众号关注）
- ❌ 不支持视频号内容
- ❌ 不支持小程序内容
- ❌ 需要本地浏览器环境

---

## 🐛 故障排查

### 问题 1：浏览器未启动

**错误信息：**
```
❌ 未检测到运行中的 Chrome 浏览器
```

**解决方案：**
```bash
# 启动 Chrome（调试模式）
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-debug-profile
```

### 问题 2：微信未登录

**错误信息：**
```
⚠️ 未检测到微信登录态
```

**解决方案：**
1. 在 Chrome 中访问 https://wx.qq.com
2. 扫码登录
3. 重新运行检查

### 问题 3：文章读取超时

**错误信息：**
```
页面加载超时
```

**解决方案：**
1. 检查网络连接
2. 确认文章链接有效
3. 重试

---

## 📚 相关资源

- [OpenClaw 文档](https://docs.openclaw.ai)
- [Puppeteer 文档](https://pptr.dev/)
- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)
- [设计思路来源](https://blog.csdn.net/be_racle/article/details/159737660)

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

---

## 🙏 致谢

- 设计思路来自：[be_racle 的 CSDN 博客](https://blog.csdn.net/be_racle/article/details/159737660)
- 基于 OpenClaw Skill 系统开发
- 使用 Puppeteer 进行浏览器自动化

---

## 📬 联系方式

- 作者：红温
- 项目地址：https://github.com/bunniesmacbook/wechat-article-viewer

---

**⭐ 如果这个项目对你有帮助，请给一个 Star！**
