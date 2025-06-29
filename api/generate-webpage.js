// Vercel无服务器函数 - 使用CommonJS语法
const https = require('https');

// 动态prompt配置（与本地server.js保持一致）
const DYNAMIC_PROMPT_CONFIG = {
    basePrompt: `请根据以下文本内容，设计一页PPT，突出关键信息，使用图标

🎨 **设计标准**：
1. 采用16:9比例，模拟真实PPT页面尺寸(1920x1080px的视觉效果)
2. 参考Gamma App、Pitch、Beautiful.ai的顶级设计美学
3. 应用极简主义原则：大量留白，聚焦核心信息
4. 使用专业的企业级配色方案

🖼️ **视觉层次**：
5. 构建清晰的信息层级：主标题->副标题->正文->装饰
6. 运用黄金比例和网格系统进行布局
7. 标题使用48-72px大字体，正文使用24-32px
8. 行间距设置为1.6-1.8倍，确保阅读舒适性

🎯 **现代设计元素**：
9. 添加微妙的渐变背景(线性或径向渐变)
10. 使用圆角矩形、几何图形作为装饰元素
11. 应用现代阴影效果(box-shadow: 0 20px 40px rgba(0,0,0,0.1))
12. 添加精美的图标(优先使用Font Awesome或简洁的SVG图标)。如果这个页面配有图片，则不要添加图标。

🎨 **配色与字体**：
13. 主色调：选择专业配色(如#667eea, #764ba2, #00c9ff, #92fe9d等现代渐变)
14. 辅助色：灰度系统(#333, #666, #999, #f8f9fa)
15. 字体：使用现代无衬线字体('Segoe UI', 'SF Pro Display', 'Roboto')
16. 确保足够的对比度，文字清晰易读。用半透明色块高亮重点信息词汇或数字。

🖼️ **布局创新**：
17. 使用非对称但平衡的布局设计
18. 左右分栏或上下分层的现代布局
19. 内容区域添加精美的卡片设计和边框，使用半透明的卡片颜色
20. 巧妙运用负空间，避免视觉拥挤

📱 **技术实现**：
21. 使用CSS Grid和Flexbox实现精确布局
22. 添加CSS动画和过渡效果(transition, transform)
23. 确保在大屏幕上的完美展示效果
24. 页面边框和容器使用微妙的边框线`,
    systemRole: "你是世界顶级的演示文稿设计大师，专精于创造苹果、Google、微软等顶级公司级别的PPT页面设计。你深谙现代设计美学，擅长：\n- Gamma App、Beautiful.ai、Pitch等顶级PPT工具的设计风格\n- 极简主义设计原则和现代视觉传达\n- 专业配色理论和视觉层次构建\n- 响应式布局和用户体验设计",
    imagePrompt: `25. 将提供的图片作为视觉焦点巧妙融入设计
26. 图片使用现代的圆角、阴影或遮罩效果
27. 确保图文搭配协调，图片不喧宾夺主
28. 图片周围保持充足的留白空间
图片URL:{imageUrl}`,
    endPrompt: `.请直接返回完整的HTML代码，从<DOCTYPE html>开始，不要添加任何解释文字或markdown格式`
};

// 发送HTTP请求的辅助函数
function makeRequest(url, options, data) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(responseData));
                } catch (error) {
                    reject(new Error('Invalid JSON response'));
                }
            });
        });
        
        req.on('error', reject);
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

// Azure OpenAI配置
const getAzureConfig = () => ({
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    key: process.env.AZURE_OPENAI_KEY,
    deployment: process.env.AZURE_OPENAI_DEPLOYMENT,
    apiVersion: process.env.AZURE_OPENAI_API_VERSION
});

// 生成图片
async function generateImage(description) {
    const config = getAzureConfig();
    const url = new URL(`${config.endpoint}/openai/deployments/dall-e-3/images/generations?api-version=2024-02-01`);
    
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'api-key': config.key
        }
    };
    
    const data = {
        prompt: description,
        size: "1024x1024",
        quality: "standard",
        n: 1
    };
    
    try {
        const response = await makeRequest(url, options, data);
        return response.data[0].url;
    } catch (error) {
        console.error('图片生成失败:', error.message);
        return null;
    }
}

// 生成文本（使用动态prompt配置）
async function generateText(userText, imageUrl = null) {
    const config = getAzureConfig();
    const url = new URL(`${config.endpoint}/openai/deployments/${config.deployment}/chat/completions?api-version=${config.apiVersion}`);
    
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'api-key': config.key
        }
    };

    // 使用动态prompt配置构建prompt
    let prompt = DYNAMIC_PROMPT_CONFIG.basePrompt;

    if (imageUrl) {
        prompt += DYNAMIC_PROMPT_CONFIG.imagePrompt.replace('{imageUrl}', imageUrl);
    }

    prompt += `
${imageUrl ? '4' : '3'}${DYNAMIC_PROMPT_CONFIG.endPrompt}

文本内容：${userText}`;

    console.log('使用的prompt:', prompt);

    const data = {
        messages: [
            { role: "system", content: DYNAMIC_PROMPT_CONFIG.systemRole },
            { role: "user", content: prompt }
        ],
        max_tokens: 4000,
        temperature: 0.7
    };

    try {
        const response = await makeRequest(url, options, data);
        return response.choices[0].message.content;
    } catch (error) {
        console.error('文本生成失败:', error.message);
        throw error;
    }
}

// 清理HTML响应，移除markdown格式和多余文字（与本地server.js保持一致）
function cleanHTMLResponse(response) {
    // 移除可能的markdown代码块标记
    let cleaned = response.replace(/```html\s*/g, '').replace(/```\s*$/g, '');
    
    // 查找第一个<!DOCTYPE html>的位置
    const doctypeIndex = cleaned.indexOf('<!DOCTYPE html>');
    if (doctypeIndex !== -1) {
        cleaned = cleaned.substring(doctypeIndex);
    } else {
        // 如果没有找到<!DOCTYPE html>，查找<html>
        const htmlIndex = cleaned.indexOf('<html');
        if (htmlIndex !== -1) {
            cleaned = cleaned.substring(htmlIndex);
        }
    }
    
    // 查找最后一个</html>的位置
    const lastHtmlIndex = cleaned.lastIndexOf('</html>');
    if (lastHtmlIndex !== -1) {
        cleaned = cleaned.substring(0, lastHtmlIndex + 7); // 7 是 '</html>' 的长度
    }
    
    return cleaned.trim();
}

// Vercel API端点 - 主函数
module.exports = async function handler(req, res) {
    console.log('API调用开始 - 方法:', req.method, '时间:', new Date().toISOString());
    
    // 设置CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        console.log('处理OPTIONS请求');
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        console.log('方法不允许:', req.method);
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        console.log('请求体:', req.body);
        
        // 从请求体获取参数（兼容现有前端）
        const { text, imageOption, imageStyle, language = 'zh' } = req.body;

        if (!text) {
            console.log('缺少text参数');
            return res.status(400).json({ success: false, error: 'Text is required' });
        }

        // 检查Azure配置
        const config = getAzureConfig();
        console.log('Azure配置检查:', {
            hasEndpoint: !!config.endpoint,
            hasKey: !!config.key,
            hasDeployment: !!config.deployment,
            hasApiVersion: !!config.apiVersion
        });
        
        if (!config.endpoint || !config.key || !config.deployment) {
            console.error('Azure OpenAI配置缺失:', config);
            return res.status(500).json({ success: false, error: 'Azure OpenAI configuration missing' });
        }

        console.log('收到生成请求:', { 
            textLength: text.length, 
            imageOption, 
            imageStyle, 
            language,
            timestamp: new Date().toISOString()
        });

        // 判断是否需要图片
        const withImage = imageOption === 'yes';
        let imageUrl = null;

        // 如果需要图片，生成配图
        if (withImage) {
            console.log('开始生成配图...');
            const imageDescription = language === 'zh'
                ? `为以下内容生成一张配图：${text}。图片应该是高质量、专业的，符合商务或教育场景。风格：${imageStyle || '现代简洁'}。`
                : `Generate an illustration for the following content: ${text}. The image should be high-quality, professional, suitable for business or educational scenarios. Style: ${imageStyle || 'modern and clean'}.`;
            
            imageUrl = await generateImage(imageDescription);
            
            if (imageUrl) {
                console.log('配图生成成功');
            } else {
                console.log('配图生成失败，继续生成纯文字版本');
            }
        }

        console.log('开始生成HTML内容...');

        // 使用动态prompt生成HTML
        const htmlContent = await generateText(text, imageUrl);

        // 清理HTML响应
        const finalHtml = cleanHTMLResponse(htmlContent);

        console.log('PPT页面生成完成');
        res.status(200).json({ 
            success: true,
            html: finalHtml 
        });

    } catch (error) {
        console.error('API错误:', error);
        res.status(500).json({ 
            success: false,
            error: 'Internal server error', 
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
};
