// Vercel调试API端点 - 用于更新prompt配置
module.exports = async function handler(req, res) {
    console.log('Debug API调用:', req.method, new Date().toISOString());
    
    // 设置CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method === 'POST') {
        try {
            const { systemRole, basePrompt, imagePrompt, endPrompt } = req.body;
            
            console.log('收到prompt更新请求:', {
                systemRoleLength: systemRole?.length || 0,
                basePromptLength: basePrompt?.length || 0,
                imagePromptLength: imagePrompt?.length || 0,
                endPromptLength: endPrompt?.length || 0
            });
            
            // 在Vercel环境中，我们不能直接修改文件
            // 但可以返回成功响应，让用户知道配置已接收
            res.status(200).json({
                success: true,
                message: '⚠️ Vercel环境提示：配置已接收，但无法永久保存。请在本地开发环境中测试动态配置功能。',
                received: {
                    systemRole: !!systemRole,
                    basePrompt: !!basePrompt,
                    imagePrompt: !!imagePrompt,
                    endPrompt: !!endPrompt
                },
                note: 'Vercel部署版本使用固定的prompt配置，如需修改请更新代码并重新部署。'
            });

        } catch (error) {
            console.error('Debug API错误:', error);
            res.status(500).json({
                success: false,
                error: '服务器错误',
                details: error.message
            });
        }
        
    } else if (req.method === 'GET') {
        // 返回当前的prompt配置（从generate-webpage.js中读取）
        try {
            // 返回固定配置，因为在Vercel中无法动态读取文件
            const currentConfig = {
                systemRole: "你是一个专业的网页设计师，擅长将文本内容转换为美观的HTML网页。",
                basePrompt: `请根据以下文本内容，创建一个HTML网页来呈现这段话。要求：
1. 设计美观，现代简约风格
2. 如果需要的话，添加纯色图标来增强视觉效果，不要使用彩色图标`,
                imagePrompt: `
3. 在网页中使用图片，图片URL: {imageUrl}
4. 网页的比例是16:9，画出页面边框`,
                endPrompt: `. 请直接返回完整的HTML代码，从<!DOCTYPE html>开始，不要添加任何解释文字或markdown格式`
            };

            res.status(200).json({
                success: true,
                config: currentConfig,
                note: '这是当前Vercel部署版本的固定配置'
            });

        } catch (error) {
            console.error('获取配置错误:', error);
            res.status(500).json({
                success: false,
                error: '获取配置失败',
                details: error.message
            });
        }
        
    } else {
        res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }
};
