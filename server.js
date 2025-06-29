const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Azure OpenAI配置
const AZURE_CONFIG = {
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    key: process.env.AZURE_OPENAI_KEY,
    deployment: process.env.AZURE_OPENAI_DEPLOYMENT,
    apiVersion: process.env.AZURE_OPENAI_API_VERSION
};

// 存储最后一次使用的prompt（用于调试）
let lastUsedPrompt = {
    systemRole: '',
    userPrompt: '',
    timestamp: null,
    hasImage: false,
    imageUrl: null
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

// 调用Azure OpenAI API生成网页
async function callAzureOpenAI(userText, imageUrl = null) {
    const url = `${AZURE_CONFIG.endpoint}/openai/deployments/${AZURE_CONFIG.deployment}/chat/completions?api-version=${AZURE_CONFIG.apiVersion}`;
    
    // 使用动态prompt配置
    let prompt = DYNAMIC_PROMPT_CONFIG.basePrompt;

    if (imageUrl) {
        prompt += DYNAMIC_PROMPT_CONFIG.imagePrompt.replace('{imageUrl}', imageUrl);
    }

    prompt += `
${imageUrl ? '4' : '3'}${DYNAMIC_PROMPT_CONFIG.endPrompt}

文本内容：${userText}`;

    console.log('当前使用的prompt:', prompt);

    // 记录实际使用的prompt（用于调试）
    lastUsedPrompt = {
        systemRole: DYNAMIC_PROMPT_CONFIG.systemRole,
        userPrompt: prompt,
        timestamp: new Date().toISOString(),
        hasImage: !!imageUrl,
        imageUrl: imageUrl
    };

    try {
        const response = await axios.post(url, {
            messages: [
                {
                    role: "system",
                    content: DYNAMIC_PROMPT_CONFIG.systemRole
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: 4000,
            temperature: 0.7
        }, {
            headers: {
                'Content-Type': 'application/json',
                'api-key': AZURE_CONFIG.key
            }
        });

        // 存储最后一次使用的prompt
        lastUsedPrompt = {
            systemRole: DYNAMIC_PROMPT_CONFIG.systemRole,
            userPrompt: prompt,
            timestamp: new Date(),
            hasImage: !!imageUrl,
            imageUrl: imageUrl || null
        };

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('Azure OpenAI API调用失败:', error.response?.data || error.message);
        throw new Error('生成网页失败，请稍后重试');
    }
}

// 清理HTML响应，移除markdown格式和多余文字
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

// 根据风格生成图片描述
function generateImageDescription(text, style) {
    const stylePrompts = {
        realistic: "photorealistic, high detail, professional photography style",
        illustration: "digital illustration, artistic, vibrant colors, detailed artwork", 
        minimalist: "minimalist design, clean lines, simple composition, modern aesthetic",
        cartoon: "cartoon style, colorful, playful, animated character design",
        watercolor: "watercolor painting style, soft brushstrokes, artistic, dreamy atmosphere",
        cyberpunk: "cyberpunk aesthetic, neon colors, futuristic, sci-fi atmosphere"
    };
    
    const stylePrompt = stylePrompts[style] || stylePrompts.realistic;
    return `${text.substring(0, 100)}, ${stylePrompt}`;
}

// 动态prompt配置（用于调试）
let DYNAMIC_PROMPT_CONFIG = {
    basePrompt: `请根据以下文本内容，创建一个HTML网页来呈现这段话。要求：
1. 设计美观，现代简约风格
2. 如果需要的话，添加纯色图标来增强视觉效果，不要使用彩色图标`,
    systemRole: "你是一个专业的网页设计师，擅长将文本内容转换为美观的HTML网页。",
    imagePrompt: `
3. 在网页中使用图片，图片URL: {imageUrl}
4. 网页的比例是16:9，画出页面边框`,
    endPrompt: `. 请直接返回完整的HTML代码，从<!DOCTYPE html>开始，不要添加任何解释文字或markdown格式`
};

// API路由
app.post('/api/generate-webpage', async (req, res) => {
    try {
        const { text, imageOption = 'yes', imageStyle = 'realistic' } = req.body;
        
        if (!text || text.trim().length === 0) {
            return res.status(400).json({ error: '请输入文本内容' });
        }

        console.log('收到请求，正在生成网页...');
        console.log('配图选项:', imageOption);
        console.log('图片风格:', imageStyle);
        
        let imageUrl = null;
        let shouldGenerateImage = false;
        
        // 根据用户选择决定是否生成图片
        if (imageOption === 'yes') {
            // 包含配图
            shouldGenerateImage = true;
            console.log('用户选择包含配图，风格:', imageStyle);
        } else {
            // 仅文字
            shouldGenerateImage = false;
            console.log('用户选择仅文字，跳过配图');
        }
        
        // 生成图片（如果需要）
        if (shouldGenerateImage) {
            try {
                // 根据风格生成图片描述
                console.log('正在生成图片描述...');
                const imageDescription = generateImageDescription(text, imageStyle);
                
                if (imageDescription) {
                    console.log('正在生成图片:', imageDescription);
                    imageUrl = await generateImage(imageDescription);
                    
                    if (imageUrl) {
                        console.log('图片生成成功:', imageUrl);
                    } else {
                        console.log('图片生成失败，继续生成网页...');
                    }
                }
            } catch (imageError) {
                console.error('图片生成错误:', imageError.message);
                // 即使图片生成失败，也要继续生成网页
            }
        }
        
        // 生成网页内容
        console.log('正在生成网页内容...');
        const htmlContent = await callAzureOpenAI(text, imageUrl);
        
        // 清理HTML响应
        const cleanedHTML = cleanHTMLResponse(htmlContent);
        console.log('网页生成完成');
        
        // 构建状态消息
        let statusMessage = '网页生成成功！';
        if (imageOption === 'yes') {
            if (imageUrl) {
                const styleNames = {
                    realistic: '写实',
                    illustration: '插画', 
                    minimalist: '简约',
                    cartoon: '卡通',
                    watercolor: '水彩',
                    cyberpunk: '赛博朋克'
                };
                const styleName = styleNames[imageStyle] || '写实';
                statusMessage += ` 🖼️ 已包含${styleName}风格配图`;
            } else {
                statusMessage += ' ⚠️ 配图生成失败';
            }
        } else {
            statusMessage += ' 📝 纯文字版本';
        }
        
        res.json({ 
            success: true, 
            html: cleanedHTML,
            hasImage: !!imageUrl,
            imageUrl: imageUrl,
            imageOption: imageOption,
            imageStyle: imageStyle,
            message: statusMessage
        });
    } catch (error) {
        console.error('生成网页错误:', error.message);
        res.status(500).json({ 
            error: error.message || '服务器内部错误' 
        });
    }
});

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 调试端点：动态修改prompt
app.post('/api/debug-prompt', (req, res) => {
    const { basePrompt, systemRole, imagePrompt, endPrompt } = req.body;
    
    if (basePrompt !== undefined) {
        DYNAMIC_PROMPT_CONFIG.basePrompt = basePrompt;
    }
    if (systemRole !== undefined) {
        DYNAMIC_PROMPT_CONFIG.systemRole = systemRole;
    }
    if (imagePrompt !== undefined) {
        DYNAMIC_PROMPT_CONFIG.imagePrompt = imagePrompt;
    }
    if (endPrompt !== undefined) {
        DYNAMIC_PROMPT_CONFIG.endPrompt = endPrompt;
    }
    
    res.json({ 
        success: true, 
        config: DYNAMIC_PROMPT_CONFIG 
    });
});

// 调试端点：更新prompt配置
app.post('/api/debug/update-prompt', (req, res) => {
    try {
        const { basePrompt, systemRole, imagePrompt, endPrompt } = req.body;
        
        if (basePrompt) DYNAMIC_PROMPT_CONFIG.basePrompt = basePrompt;
        if (systemRole) DYNAMIC_PROMPT_CONFIG.systemRole = systemRole;
        if (imagePrompt) DYNAMIC_PROMPT_CONFIG.imagePrompt = imagePrompt;
        if (endPrompt) DYNAMIC_PROMPT_CONFIG.endPrompt = endPrompt;
        
        console.log('Prompt配置已更新:', DYNAMIC_PROMPT_CONFIG);
        
        res.json({ 
            success: true, 
            message: 'Prompt配置已更新',
            currentConfig: DYNAMIC_PROMPT_CONFIG
        });
    } catch (error) {
        console.error('更新Prompt配置失败:', error.message);
        res.status(500).json({ error: '更新失败' });
    }
});

// 调试端点：获取当前prompt配置
app.get('/api/debug/get-prompt', (req, res) => {
    res.json({
        success: true,
        config: DYNAMIC_PROMPT_CONFIG
    });
});

// 调试端点：重置prompt配置
app.post('/api/debug/reset-prompt', (req, res) => {
    DYNAMIC_PROMPT_CONFIG = {
        basePrompt: `请根据以下文本内容，创建一个HTML网页来呈现这段话。要求：
1. 设计美观，现代简约风格
2. 如果需要的话，添加纯色图标来增强视觉效果，不要使用彩色图标`,
        systemRole: "你是一个专业的网页设计师，擅长将文本内容转换为美观的HTML网页。",
        imagePrompt: `
3. 在网页中使用图片，图片URL: {imageUrl}
4. 网页的比例是16:9，画出页面边框`,
        endPrompt: `. 请直接返回完整的HTML代码，从<!DOCTYPE html>开始，不要添加任何解释文字或markdown格式`
    };
    
    console.log('Prompt配置已重置');
    
    res.json({ 
        success: true, 
        message: 'Prompt配置已重置',
        config: DYNAMIC_PROMPT_CONFIG
    });
});

// 调试端点：获取最后一次实际使用的prompt
app.get('/api/debug/last-prompt', (req, res) => {
    res.json({
        success: true,
        lastPrompt: lastUsedPrompt
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log('Azure OpenAI配置:');
    console.log(`- 端点: ${AZURE_CONFIG.endpoint}`);
    console.log(`- 部署: ${AZURE_CONFIG.deployment}`);
    console.log(`- API版本: ${AZURE_CONFIG.apiVersion}`);
});
