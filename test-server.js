const express = require('express');
const path = require('path');

const app = express();
const port = 3001; // 使用不同端口避免冲突

app.use(express.static('public'));
app.use(express.json());

// 模拟生成页面的API
app.post('/api/generate-webpage', (req, res) => {
    const { text, imageOption, imageStyle } = req.body;
    
    // 生成简单的HTML页面用于测试
    const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>生成的PPT页面</title>
    <style>
        body {
            margin: 0;
            padding: 50px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            font-family: 'Segoe UI', sans-serif;
            min-height: 100vh;
            box-sizing: border-box;
        }
        
        .container {
            max-width: 1000px;
            margin: 0 auto;
            text-align: center;
        }
        
        h1 {
            font-size: 3rem;
            margin-bottom: 2rem;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .content {
            font-size: 1.2rem;
            line-height: 1.8;
            background: rgba(255, 255, 255, 0.1);
            padding: 30px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
            margin-bottom: 30px;
        }
        
        .feature {
            background: rgba(255, 255, 255, 0.2);
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>✨ 测试PPT页面</h1>
        <div class="content">
            <p><strong>用户输入内容：</strong></p>
            <p>${text}</p>
        </div>
        
        <div class="feature">
            <h3>🎨 配图选项</h3>
            <p>配图: ${imageOption === 'yes' ? '是' : '否'}</p>
            ${imageOption === 'yes' ? `<p>风格: ${imageStyle}</p>` : ''}
        </div>
        
        <div class="feature">
            <h3>🚀 TextCraft Studio</h3>
            <p>AI驱动的PPT页面生成器 - 让创作更简单</p>
        </div>
        
        <div style="margin-top: 50px; opacity: 0.8;">
            <p>⬇️ 使用底部工具栏下载此页面为图片</p>
        </div>
    </div>
</body>
</html>`;
    
    setTimeout(() => {
        res.json({
            success: true,
            html: html,
            message: 'PPT页面生成成功！已自动注入底部工具栏'
        });
    }, 1500); // 模拟生成时间
});

// 健康检查API
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(port, () => {
    console.log(`测试服务器运行在 http://localhost:${port}`);
    console.log('可以访问主页面测试taskbar功能');
});
