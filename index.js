#!/usr/bin/env node
/**
 * OpenClaw Skill 执行入口
 * 微信文章阅读器 - 自动触发版本
 * 
 * 用法：node index.js <action> <params>
 */

const { fetchAndRenderArticle } = require('./scripts/fetch_article');

async function main() {
  const action = process.argv[2];
  const params = JSON.parse(process.argv[3] || '{}');
  
  console.log('🔍 微信文章阅读器已激活');
  console.log('═══════════════════════════════════════════\n');
  
  try {
    // 参数校验
    const url = params.url;
    if (!url || !url.includes('mp.weixin.qq.com')) {
      return {
        success: false,
        message: '❌ 请提供有效的微信公众号文章链接',
        retryable: false
      };
    }
    
    // 抓取文章
    console.log(`📖 文章链接：${url}`);
    const result = await fetchAndRenderArticle(url);
    
    if (result.success) {
      const { title, author, publishTime, content, summary, url } = result.data;
      
      console.log('\n✅ 提取成功！\n');
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
      
      // 返回结构化结果给 OpenClaw
      return {
        success: true,
        data: result.data,
        formatted: `📰 **${title}**\n\n✍️ 作者：${author}\n📅 发布时间：${publishTime}\n\n---\n\n${content.substring(0, 2000)}...\n\n---\n\n🔗 原文链接：${url}`
      };
    } else {
      console.error('❌ 提取失败\n');
      console.error(`原因：${result.error}`);
      
      if (result.retryable) {
        console.error('\n💡 建议：');
        console.error('1. 确认浏览器已启动（带调试端口 9222）');
        console.error('2. 确认已登录微信网页版 (https://wx.qq.com)');
        console.error('3. 检查网络连接');
        console.error('4. 重试命令');
      }
      
      return {
        success: false,
        error: result.error,
        retryable: result.retryable,
        guidance: result.retryable ? '请确认 Chrome 已启动并登录微信网页版' : ''
      };
    }
  } catch (error) {
    console.error('❌ 执行出错:', error.message);
    return {
      success: false,
      error: error.message,
      retryable: false
    };
  }
}

// 导出给 OpenClaw 调用
module.exports = { main };

// 如果是直接执行
if (require.main === module) {
  main().then(result => {
    console.log('\n【返回结果】');
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
  }).catch(error => {
    console.error('❌ 未捕获错误:', error.message);
    process.exit(1);
  });
}
