// Vercel无服务器函数 - 使用CommonJS语法
const https = require('https');

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

// 生成文本
async function generateText(systemRole, userPrompt) {
    const config = getAzureConfig();
    const url = new URL(`${config.endpoint}/openai/deployments/${config.deployment}/chat/completions?api-version=${config.apiVersion}`);
    
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'api-key': config.key
        }
    };
    
    const data = {
        messages: [
            { role: "system", content: systemRole },
            { role: "user", content: userPrompt }
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

        // 系统角色
        const systemRole = language === 'zh' 
            ? `你是一个专业的PPT页面设计师。用户会给你一段文字描述，你需要将其转换为一个美观的、现代化的PPT页面的HTML代码。

要求：
1. 生成完整的HTML页面，包含<!DOCTYPE html>标签
2. 使用现代化、简洁的设计风格
3. 确保在1920x1080分辨率下完美显示
4. 包含合适的字体、颜色搭配和布局
5. 添加适当的CSS动画和过渡效果
6. 确保内容层次清晰，重点突出
7. 使用响应式设计
8. 如果用户要求配图，请在合适位置添加<img>标签，src属性设为"IMAGE_PLACEHOLDER"

请直接返回完整的HTML代码，不要有任何其他解释文字。`
            : `You are a professional PPT page designer. Users will give you a text description, and you need to convert it into beautiful, modern PPT page HTML code.

Requirements:
1. Generate complete HTML page including <!DOCTYPE html> tag
2. Use modern, clean design style
3. Ensure perfect display at 1920x1080 resolution
4. Include appropriate fonts, color schemes and layouts
5. Add appropriate CSS animations and transitions
6. Ensure clear content hierarchy with highlighted key points
7. Use responsive design
8. If user requests images, add <img> tags in appropriate positions with src="IMAGE_PLACEHOLDER"

Please return the complete HTML code directly without any other explanatory text.`;

        // 用户提示
        const userPrompt = withImage 
            ? `${text}\n\n请为这个内容生成一个包含配图的PPT页面，在合适的位置添加图片。图片风格要求：${imageStyle || '现代简洁'}。`
            : `${text}\n\n请为这个内容生成一个纯文字的PPT页面。`;

        console.log('开始生成HTML内容...');

        // 生成HTML
        const htmlContent = await generateText(systemRole, userPrompt);

        let finalHtml = htmlContent;

        // 如果需要图片，生成并替换
        if (withImage && finalHtml.includes('IMAGE_PLACEHOLDER')) {
            console.log('开始生成配图...');
            const imageDescription = language === 'zh'
                ? `为以下PPT内容生成一张配图：${text}。图片应该是高质量、专业的，符合商务或教育场景。风格：${imageStyle || '现代简洁'}。`
                : `Generate an illustration for the following PPT content: ${text}. The image should be high-quality, professional, suitable for business or educational scenarios. Style: ${imageStyle || 'modern and clean'}.`;
            
            const imageUrl = await generateImage(imageDescription);
            
            if (imageUrl) {
                finalHtml = finalHtml.replace(/IMAGE_PLACEHOLDER/g, imageUrl);
                console.log('配图生成成功');
            } else {
                // 如果图片生成失败，移除img标签
                finalHtml = finalHtml.replace(/<img[^>]*src="IMAGE_PLACEHOLDER"[^>]*>/g, '');
                console.log('配图生成失败，移除图片标签');
            }
        }

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
