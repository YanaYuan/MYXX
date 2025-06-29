// Vercel调试API端点 - 获取最后使用的prompt信息
module.exports = async function handler(req, res) {
    console.log('Last prompt API调用:', req.method, new Date().toISOString());
    
    // 设置CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method === 'GET') {
        try {
            // 在Vercel环境中，我们无法跟踪状态
            // 返回示例信息让用户了解功能
            const sampleLastPrompt = {
                systemRole: "你是一个专业的网页设计师，擅长将文本内容转换为美观的HTML网页。",
                userPrompt: `请根据以下文本内容，创建一个HTML网页来呈现这段话。要求：
1. 设计美观，现代简约风格
2. 如果需要的话，添加纯色图标来增强视觉效果，不要使用彩色图标
3. 请直接返回完整的HTML代码，从<!DOCTYPE html>开始，不要添加任何解释文字或markdown格式

文本内容：欢迎来到我的个人博客！这里记录了我的学习心得和生活感悟。`,
                timestamp: new Date().toISOString(),
                hasImage: false,
                imageUrl: null,
                note: "⚠️ Vercel环境提示：这是示例数据。在本地开发环境中，这里会显示实际发送给AI的prompt。"
            };

            res.status(200).json({
                success: true,
                lastPrompt: sampleLastPrompt,
                environment: 'vercel',
                message: 'Vercel环境中无法跟踪实时状态，显示的是示例数据'
            });

        } catch (error) {
            console.error('获取last prompt错误:', error);
            res.status(500).json({
                success: false,
                error: '获取信息失败',
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
