# 文本转网页生成器

这是一个基于Azure OpenAI的Web应用，可以将用户输入的文本转换为精美的HTML网页。

## 功能特性

- 📝 支持任意文本输入
- 🎨 AI生成精美的HTML网页
- 📱 响应式设计，支持移动设备
- 🔍 实时预览生成的网页
- 📥 支持下载生成的HTML文件
- 🔗 支持在新窗口打开预览

## 技术栈

- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **后端**: Node.js, Express.js
- **AI服务**: Azure OpenAI GPT-4o
- **依赖**: axios, cors, dotenv

## 安装和运行

1. 安装依赖：
```bash
npm install
```

2. 配置环境变量（已在.env文件中配置）：
- Azure OpenAI 端点
- API密钥
- 部署名称
- API版本

3. 启动服务器：
```bash
npm start
```

4. 打开浏览器访问：
```
http://localhost:3000
```

## 使用说明

1. 在左侧文本框中输入任意内容
2. 点击"生成精美网页"按钮
3. 等待AI处理（通常需要几秒钟）
4. 在右侧预览生成的网页
5. 可以下载HTML文件或在新窗口打开

## API接口

### POST /api/generate-webpage
生成网页内容

**请求体**:
```json
{
  "text": "要转换的文本内容"
}
```

**响应**:
```json
{
  "success": true,
  "html": "生成的HTML内容"
}
```

### GET /api/health
检查服务器状态

**响应**:
```json
{
  "status": "OK",
  "timestamp": "2025-06-28T..."
}
```

## 注意事项

- 确保Azure OpenAI服务可用
- 输入文本不要过长，建议在1000字以内
- 生成的HTML内容在iframe中预览，确保安全性
- 支持快捷键Ctrl+Enter快速提交

## 许可证

MIT License
