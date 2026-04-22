# 浏览器配置说明

本文档说明如何配置 Chrome 浏览器以支持微信文章读取。

---

## 为什么需要配置？

微信公众号文章有**三层防御机制**：

1. **Cookie 鉴权** - 需要有效的 wap_sid2 Cookie
2. **JS 动态渲染** - 正文由 JavaScript 动态加载
3. **反爬策略** - 检测非浏览器请求

普通网页抓取工具（如 web_fetch）无法绕过这些限制，因此需要**用真正的浏览器去渲染**。

---

## 配置步骤

### Step 1: 启动带调试端口的 Chrome

#### macOS

```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-debug-profile
```

#### Windows

```cmd
"C:\Program Files\Google\Chrome\Application\chrome.exe" ^
  --remote-debugging-port=9222 ^
  --user-data-dir=%TEMP%\chrome-debug-profile
```

#### Linux

```bash
google-chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-debug-profile
```

**参数说明：**
- `--remote-debugging-port=9222` - 开启调试端口
- `--user-data-dir` - 使用独立的用户数据目录（避免影响主浏览器）

---

### Step 2: 登录微信网页版

1. 在新打开的 Chrome 中访问：**https://wx.qq.com**
2. 使用手机微信扫码登录
3. 确认登录成功

**为什么需要登录？**
- 微信文章需要有效的登录态（wap_sid2 Cookie）
- 登录后才能访问完整文章内容

---

### Step 3: 验证配置

运行检查脚本：

```bash
cd wechat-article-viewer
node scripts/check_browser.js
```

**预期输出：**
```
🔍 检查浏览器环境...

1️⃣ 检查调试端口 (9222)...
   ✅ 调试端口已开放

2️⃣ 检查浏览器通信...
   ✅ 浏览器通信正常 (Chrome/120.0.0.0)

3️⃣ 检查微信登录态...
   ✅ 微信已登录 (打开 1 个页面)

═══════════════════════════════════════════
检查结果:
═══════════════════════════════════════════
调试端口：✅
浏览器通信：✅
微信登录：✅
整体状态：✅ 就绪
═══════════════════════════════════════════

✅ 所有检查通过！可以读取微信文章了！
```

---

## 常见问题

### Q1: 端口已被占用

**错误信息：**
```
❌ 浏览器端口已占用但无法连接
```

**解决方案：**
```bash
# 1. 查找占用端口的进程
lsof -i :9222

# 2. 关闭占用进程
kill -9 <PID>

# 3. 重新启动 Chrome
```

---

### Q2: 微信登录态过期

**错误信息：**
```
⚠️ 未检测到微信登录态
```

**解决方案：**
1. 在 Chrome 中访问 https://wx.qq.com
2. 重新扫码登录
3. 重新发送文章链接

---

### Q3: 页面加载超时

**错误信息：**
```
页面加载超时，可能网络较慢或文章已被删除
```

**解决方案：**
1. 检查网络连接
2. 确认文章链接有效
3. 重试命令

---

### Q4: 付费文章

**错误信息：**
```
这是一篇付费文章，需要关注公众号后才能阅读
```

**说明：**
- 部分公众号文章需要关注后才能阅读
- 这是微信的限制，无法绕过

**解决方案：**
1. 在微信中关注公众号
2. 在公众号内打开文章
3. 复制链接后重试

---

## 高级配置

### 使用已有 Chrome 配置

如果不想使用独立的用户数据目录，可以省略 `--user-data-dir` 参数：

```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222
```

**注意：** 这会使用你的主浏览器配置，可能影响日常使用。

---

### 使用其他 Chromium 浏览器

除了 Chrome，也可以使用其他 Chromium 内核浏览器：

#### Microsoft Edge

```bash
/Applications/Microsoft\ Edge.app/Contents/MacOS/Microsoft\ Edge \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/edge-debug-profile
```

#### Brave

```bash
/Applications/Brave\ Browser.app/Contents/MacOS/Brave\ Browser \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/brave-debug-profile
```

---

### 自动化脚本（可选）

创建一个快捷脚本 `start_chrome.sh`：

```bash
#!/bin/bash

echo "🚀 启动 Chrome 调试模式..."

/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-debug-profile &

echo "✅ Chrome 已启动"
echo ""
echo "下一步："
echo "1. 在打开的 Chrome 中访问 https://wx.qq.com"
echo "2. 扫码登录微信"
echo "3. 登录后，可以发送微信文章链接给 AI 助手"
```

使用方法：
```bash
chmod +x start_chrome.sh
./start_chrome.sh
```

---

## 安全注意事项

### ⚠️ 调试端口安全

开启调试端口后，任何能访问该端口的程序都能控制你的浏览器。

**安全建议：**
- 不要将调试端口暴露在公网
- 使用防火墙限制访问
- 使用完毕后关闭 Chrome

### ⚠️ Cookie 安全

微信登录态（Cookie）包含敏感信息。

**安全建议：**
- 使用独立的用户数据目录
- 定期清理 Cookie
- 不要在公共电脑上使用

---

## 故障排查

### 检查 Chrome 是否运行

```bash
ps aux | grep "remote-debugging-port"
```

### 检查端口是否监听

```bash
lsof -i :9222
```

### 测试浏览器连接

```bash
curl http://localhost:9222/json/version
```

预期输出：
```json
{
  "Browser": "Chrome/120.0.0.0",
  "Protocol-Version": "1.3",
  ...
}
```

---

## 参考资源

- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)
- [Puppeteer 文档](https://pptr.dev/)
- [微信文章抓取技术讨论](https://blog.csdn.net/be_racle/article/details/159737660)

---

🦞 红温 AI 助手 - 有问题随时找我！
