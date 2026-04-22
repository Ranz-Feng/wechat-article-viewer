#!/usr/bin/env node
/**
 * 微信文章抓取脚本
 * 使用 Puppeteer 渲染并提取微信公众号文章内容
 * 
 * 用法：node fetch_article.js <url>
 */

const puppeteer = require('puppeteer-core');

// 配置
const DEBUG_PORT = 9222;
const LOAD_TIMEOUT = 30000; // 30 秒超时

/**
 * 连接到现有 Chrome 浏览器
 */
async function connectToBrowser() {
  try {
    const browser = await puppeteer.connect({
      browserURL: `http://localhost:${DEBUG_PORT}`,
      defaultViewport: null
    });
    return browser;
  } catch (error) {
    throw new Error(`无法连接到浏览器：${error.message}\n\n请确认：\n1. Chrome 已启动（带调试端口 9222）\n2. 端口未被其他进程占用`);
  }
}

/**
 * 提取文章内容
 */
async function extractArticleContent(page) {
  const content = await page.evaluate(() => {
    // 提取标题
    const titleElement = document.querySelector('.rich_media_title');
    const title = titleElement ? titleElement.textContent.trim() : '未知标题';
    
    // 提取作者
    const authorElement = document.querySelector('.profile_nickname');
    const author = authorElement ? authorElement.textContent.trim() : '未知作者';
    
    // 提取发布时间
    const timeElement = document.querySelector('.publish_time');
    let publishTime = '未知时间';
    if (timeElement) {
      const timeText = timeElement.textContent.trim();
      // 清理时间文本中的多余空格和"发表于"前缀
      publishTime = timeText.replace(/发表于\s*/, '').trim();
    }
    
    // 提取正文
    const contentElement = document.querySelector('.rich_media_content');
    let content = '';
    if (contentElement) {
      // 保留 HTML 结构，便于后续格式化
      content = contentElement.innerHTML;
    }
    
    // 提取摘要（前 200 字）
    const textContent = contentElement ? contentElement.textContent.trim() : '';
    const summary = textContent.substring(0, 200) + (textContent.length > 200 ? '...' : '');
    
    return {
      title,
      author,
      publishTime,
      content,
      summary,
      fullText: textContent
    };
  });
  
  return content;
}

/**
 * 格式化正文内容
 */
function formatContent(htmlContent) {
  // 简单清理：移除多余的空格和换行
  let formatted = htmlContent
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<p[^>]*>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  // 分段
  const paragraphs = formatted.split('\n\n').filter(p => p.trim().length > 0);
  
  return paragraphs.join('\n\n');
}

/**
 * 主函数：抓取并渲染文章
 */
async function fetchAndRenderArticle(url) {
  // 验证 URL
  if (!url || !url.includes('mp.weixin.qq.com')) {
    throw new Error('请提供有效的微信公众号文章链接');
  }
  
  let browser = null;
  
  try {
    console.log('🔗 正在连接浏览器...');
    browser = await connectToBrowser();
    
    console.log('📖 正在打开文章...');
    const page = await browser.newPage();
    
    // 设置 User-Agent（模拟真实浏览器）
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // 导航并等待加载
    console.log('⏳ 等待页面加载...');
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: LOAD_TIMEOUT
    });
    
    // 等待正文元素出现
    console.log('⏳ 等待内容渲染...');
    try {
      await page.waitForSelector('.rich_media_content', { timeout: 10000 });
    } catch (error) {
      // 检查是否是付费文章
      const paywallElement = await page.$('.js_article_paywall');
      if (paywallElement) {
        throw new Error('这是一篇付费文章，需要关注公众号后才能阅读');
      }
      throw new Error('页面加载超时，可能网络较慢或文章已被删除');
    }
    
    // 额外等待确保 JS 执行完成
    await page.waitForTimeout(2000);
    
    // 提取内容
    console.log('📝 正在提取内容...');
    const article = await extractArticleContent(page);
    
    // 关闭页面
    await page.close();
    
    // 格式化结果
    const result = {
      success: true,
      data: {
        title: article.title,
        author: article.author,
        publishTime: article.publishTime,
        content: formatContent(article.content),
        summary: article.summary,
        url: url
      }
    };
    
    return result;
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      retryable: true
    };
  } finally {
    if (browser) {
      await browser.disconnect();
    }
  }
}

/**
 * CLI 入口
 */
async function main() {
  const url = process.argv[2];
  
  if (!url) {
    console.error('❌ 请提供文章 URL');
    console.error('');
    console.error('用法：node fetch_article.js <url>');
    console.error('');
    console.error('示例：');
    console.error('  node fetch_article.js https://mp.weixin.qq.com/s/xxx');
    process.exit(1);
  }
  
  console.log('═══════════════════════════════════════════');
  console.log('微信文章阅读器');
  console.log('═══════════════════════════════════════════');
  console.log(`链接：${url}`);
  console.log('═══════════════════════════════════════════\n');
  
  const result = await fetchAndRenderArticle(url);
  
  if (result.success) {
    const { title, author, publishTime, content, url } = result.data;
    
    console.log('✅ 提取成功！\n');
    console.log('═══════════════════════════════════════════');
    console.log(`📰 ${title}`);
    console.log('═══════════════════════════════════════════');
    console.log(`✍️ 作者：${author}`);
    console.log(`📅 发布时间：${publishTime}`);
    console.log('═══════════════════════════════════════════\n');
    console.log('【正文预览】\n');
    console.log(content.substring(0, 500) + '...\n');
    console.log('═══════════════════════════════════════════');
    console.log(`🔗 原文链接：${url}`);
    console.log('═══════════════════════════════════════════\n');
    
    // 输出 JSON 格式（供其他程序使用）
    console.log('\n【JSON 格式】');
    console.log(JSON.stringify(result.data, null, 2));
    
    process.exit(0);
  } else {
    console.error('❌ 提取失败\n');
    console.error(`原因：${result.error}`);
    
    if (result.retryable) {
      console.error('\n💡 建议：');
      console.error('1. 确认浏览器已启动（带调试端口）');
      console.error('2. 确认已登录微信网页版');
      console.error('3. 检查网络连接');
      console.error('4. 重试命令');
    }
    
    process.exit(1);
  }
}

// 导出供其他模块使用
module.exports = { fetchAndRenderArticle, connectToBrowser };

// 如果是直接执行
if (require.main === module) {
  main();
}
