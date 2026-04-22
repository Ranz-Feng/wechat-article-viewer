#!/bin/bash
# 启动 Chrome 调试模式脚本

echo "🚀 启动 Chrome 调试模式..."
echo ""

# 检查 Chrome 是否已安装
if [ ! -d "/Applications/Google Chrome.app" ]; then
  echo "❌ 未找到 Google Chrome"
  echo ""
  echo "请确认 Chrome 已安装在 /Applications/Google Chrome.app"
  exit 1
fi

# 启动 Chrome
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-debug-profile \
  &

# 等待 Chrome 启动
sleep 2

# 检查端口是否开放
if lsof -i :9222 > /dev/null 2>&1; then
  echo "✅ Chrome 已启动（调试端口：9222）"
  echo ""
  echo "═══════════════════════════════════════════"
  echo "下一步："
  echo "═══════════════════════════════════════════"
  echo ""
  echo "1. 在打开的 Chrome 中访问："
  echo "   https://wx.qq.com"
  echo ""
  echo "2. 使用微信扫码登录微信网页版"
  echo ""
  echo "3. 登录成功后，发送微信文章链接给 AI 助手"
  echo ""
  echo "═══════════════════════════════════════════"
  echo ""
  echo "💡 提示："
  echo "• 这个 Chrome 窗口专门用于微信文章读取"
  echo "• 使用独立的用户数据目录，不影响主浏览器"
  echo "• 使用完毕后关闭 Chrome 即可"
  echo ""
else
  echo "❌ Chrome 启动失败"
  echo ""
  echo "请检查："
  echo "1. Chrome 是否已安装"
  echo "2. 端口 9222 是否被占用"
  exit 1
fi
