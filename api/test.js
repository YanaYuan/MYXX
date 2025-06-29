// 简单的测试API端点
module.exports = async function handler(req, res) {
    console.log('测试API被调用:', req.method, new Date().toISOString());
    
    // 设置CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    // 检查环境变量
    const envCheck = {
        hasEndpoint: !!process.env.AZURE_OPENAI_ENDPOINT,
        hasKey: !!process.env.AZURE_OPENAI_KEY,
        hasDeployment: !!process.env.AZURE_OPENAI_DEPLOYMENT,
        hasApiVersion: !!process.env.AZURE_OPENAI_API_VERSION,
        nodeVersion: process.version,
        platform: process.platform
    };
    
    console.log('环境变量检查:', envCheck);
    
    res.status(200).json({
        success: true,
        message: '测试API正常工作',
        timestamp: new Date().toISOString(),
        method: req.method,
        env: envCheck
    });
};
