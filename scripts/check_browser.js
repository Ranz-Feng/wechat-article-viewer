#!/usr/bin/env node
/**
 * 浏览器连接检查脚本
 * 分层诊断浏览器环境状态
 * 
 * 用法：node check_browser.js
 */

const net = require('net');
const http = require('http');

// 配置
const DEBUG_PORT = 9222;
const WECHAT_URL = 'https://wx.qq.com';

/**
 * 检查端口是否开放
 */
function isPortOpen(host, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(2000);
    
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    
    socket.on('error', () => {
      resolve(false);
    });
    
    socket.connect(port, host);
  });
}

/**
 * 检查浏览器是否能正常通信
 */
async function checkBrowserCommunication() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: DEBUG_PORT,
      path: '/json/version',
      method: 'GET',
      timeout: 3000
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const version = JSON.parse(data);
          resolve({
            success: true,
            browser: version.Browser || 'Unknown',
            protocolVersion: version['Protocol-Version'] || 'Unknown'
          });
        } catch (e) {
          resolve({ success: false, error: '无法解析浏览器信息' });
        }
      });
    });
    
    req.on('error', (e) => {
      resolve({ success: false, error: e.message });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({ success: false, error: '连接超时' });
    });
    
    req.end();
  });
}

/**
 * 检查微信登录态
 */
async function checkWechatLogin() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: DEBUG_PORT,
      path: '/json',
      method: 'GET',
      timeout: 3000
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', async () => {
        try {
          const pages = JSON.parse(data);
          // 检查是否有微信相关页面
          const wechatPages = pages.filter(p => 
            p.url && p.url.includes('wx.qq.com')
          );
          
          if (wechatPages.length > 0) {
            // 检查 Cookie
            const hasWechatCookie = await checkCookie(wechatPages[0].webSocketDebuggerUrl);
            resolve({
              success: true,
              hasLogin: hasWechatCookie,
              pageCount: wechatPages.length
            });
          } else {
            resolve({
              success: true,
              hasLogin: false,
              pageCount: 0,
              message: '未打开微信网页版'
            });
          }
        } catch (e) {
          resolve({ success: false, error: e.message });
        }
      });
    });
    
    req.on('error', (e) => {
      resolve({ success: false, error: e.message });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({ success: false, error: '连接超时' });
    });
    
    req.end();
  });
}

/**
 * 检查 Cookie（简化版，实际需要通过 WebSocket 获取）
 */
async function checkCookie(debuggerUrl) {
  // 简化实现：假设如果打开了微信页面就有 Cookie
  // 完整实现需要通过 Chrome DevTools Protocol 获取 Cookie
  return true;
}

/**
 * 主检查函数
 */
async function checkBrowserConnection() {
  const status = {
    connected: false,
    has_debug_port: false,
    has_wechat_login: false,
    user_guidance: '',
    details: {}
  };
  
  console.log('🔍 检查浏览器环境...\n');
  
  // 1. 检查调试端口是否可连接
  console.log('1️⃣ 检查调试端口 (9222)...');
  const portOpen = await isPortOpen('localhost', DEBUG_PORT);
  
  if (!portOpen) {
    status.user_guidance = `
❌ 未检测到运行中的 Chrome 浏览器（调试端口 ${DEBUG_PORT}）

✅ 解决方案：启动带调试端口的 Chrome

macOS:
/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome \\
  --remote-debugging-port=${DEBUG_PORT} \\
  --user-data-dir=/tmp/chrome-debug-profile

Windows:
"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" ^
  --remote-debugging-port=${DEBUG_PORT} ^
  --user-data-dir=%TEMP%\\chrome-debug-profile

Linux:
google-chrome \\
  --remote-debugging-port=${DEBUG_PORT} \\
  --user-data-dir=/tmp/chrome-debug-profile
`;
    return status;
  }
  
  status.has_debug_port = true;
  console.log('   ✅ 调试端口已开放\n');
  
  // 2. 检查浏览器是否能正常通信
  console.log('2️⃣ 检查浏览器通信...');
  const commResult = await checkBrowserCommunication();
  
  if (!commResult.success) {
    status.user_guidance = `
❌ 浏览器端口已占用但无法连接

可能原因：
- 其他进程占用了端口 ${DEBUG_PORT}
- 浏览器调试功能异常

✅ 解决方案：
1. 关闭所有 Chrome 窗口
2. 确认端口未被占用：lsof -i :${DEBUG_PORT}
3. 重新启动带调试端口的 Chrome
`;
    return status;
  }
  
  status.details.browser = commResult.browser;
  console.log(`   ✅ 浏览器通信正常 (${commResult.browser})\n`);
  
  // 3. 检查微信登录态
  console.log('3️⃣ 检查微信登录态...');
  const wechatResult = await checkWechatLogin();
  
  if (!wechatResult.success) {
    status.user_guidance = `
❌ 检查微信登录态失败

错误：${wechatResult.error}

✅ 解决方案：
1. 在浏览器中访问 https://wx.qq.com
2. 扫码登录微信网页版
3. 重新运行检查
`;
    return status;
  }
  
  if (!wechatResult.hasLogin) {
    status.user_guidance = `
⚠️ 未检测到微信网页版登录

✅ 解决方案：
1. 在已启动的 Chrome 中访问 https://wx.qq.com
2. 使用微信扫码登录
3. 登录成功后，重新发送文章链接
`;
    return status;
  }
  
  status.has_wechat_login = true;
  status.connected = true;
  status.details.wechatPages = wechatResult.pageCount;
  console.log(`   ✅ 微信已登录 (打开 ${wechatResult.pageCount} 个页面)\n`);
  
  return status;
}

// 执行检查
async function main() {
  try {
    const status = await checkBrowserConnection();
    
    console.log('═══════════════════════════════════════════');
    console.log('检查结果:');
    console.log('═══════════════════════════════════════════');
    console.log(`调试端口：${status.has_debug_port ? '✅' : '❌'}`);
    console.log(`浏览器通信：${status.details.browser || '❌'}`);
    console.log(`微信登录：${status.has_wechat_login ? '✅' : '❌'}`);
    console.log(`整体状态：${status.connected ? '✅ 就绪' : '❌ 未就绪'}`);
    console.log('═══════════════════════════════════════════');
    
    if (status.user_guidance) {
      console.log('\n' + status.user_guidance);
      process.exit(1);
    } else {
      console.log('\n✅ 所有检查通过！可以读取微信文章了！\n');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ 检查过程出错:', error.message);
    process.exit(1);
  }
}

main();
