const axios = require('axios');

// Azure OpenAI配置
const AZURE_CONFIG = {
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    key: process.env.AZURE_OPENAI_KEY,
    deployment: process.env.AZURE_OPENAI_DEPLOYMENT,
    apiVersion: process.env.AZURE_OPENAI_API_VERSION
};

// 生成图片
async function generateImage(description) {
    const url = `${AZURE_CONFIG.endpoint}/openai/deployments/dall-e-3/images/generations?api-version=2024-02-01`;
    
    try {
        const response = await axios.post(url, {
            prompt: description,
            size: "1024x1024",
            quality: "standard",
            n: 1
        }, {
            headers: {
                'Content-Type': 'application/json',
                'api-key': AZURE_CONFIG.key
            }
        });

        return response.data.data[0].url;
    } catch (error) {
        console.error('图片生成失败:', error.response?.data || error.message);
        return null;
    }
}

// 生成文本
async function generateText(systemRole, userPrompt) {
    const url = `${AZURE_CONFIG.endpoint}/openai/deployments/${AZURE_CONFIG.deployment}/chat/completions?api-version=${AZURE_CONFIG.apiVersion}`;
    
    try {
        const response = await axios.post(url, {
            messages: [
                { role: "system", content: systemRole },
                { role: "user", content: userPrompt }
            ],
            max_tokens: 4000,
            temperature: 0.7
        }, {
            headers: {
                'Content-Type': 'application/json',
                'api-key': AZURE_CONFIG.key
            }
        });

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('文本生成失败:', error.response?.data || error.message);
        throw error;
    }
}

// Vercel API端点
export default async function handler(req, res) {
    // 设置CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { text, withImage, language = 'en' } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        // 检查Azure配置
        if (!AZURE_CONFIG.endpoint || !AZURE_CONFIG.key || !AZURE_CONFIG.deployment) {
            return res.status(500).json({ error: 'Azure OpenAI configuration missing' });
        }

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
            ? `${text}\n\n请为这个内容生成一个包含配图的PPT页面，在合适的位置添加图片。`
            : `${text}\n\n请为这个内容生成一个纯文字的PPT页面。`;

        // 生成HTML
        const htmlContent = await generateText(systemRole, userPrompt);

        let finalHtml = htmlContent;

        // 如果需要图片，生成并替换
        if (withImage && finalHtml.includes('IMAGE_PLACEHOLDER')) {
            const imageDescription = language === 'zh'
                ? `为以下PPT内容生成一张配图：${text}。图片应该是高质量、专业的，符合商务或教育场景。`
                : `Generate an illustration for the following PPT content: ${text}. The image should be high-quality, professional, suitable for business or educational scenarios.`;
            
            const imageUrl = await generateImage(imageDescription);
            
            if (imageUrl) {
                finalHtml = finalHtml.replace(/IMAGE_PLACEHOLDER/g, imageUrl);
            } else {
                // 如果图片生成失败，移除img标签
                finalHtml = finalHtml.replace(/<img[^>]*src="IMAGE_PLACEHOLDER"[^>]*>/g, '');
            }
        }

        res.status(200).json({ html: finalHtml });

    } catch (error) {
        console.error('API错误:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
}
