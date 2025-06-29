const { spawn } = require('child_process');

console.log('🚀 启动 TextCraft Studio 服务器...');

const server = spawn('node', ['server.js'], {
    stdio: 'inherit',
    cwd: process.cwd()
});

server.on('error', (error) => {
    console.error('❌ 服务器启动失败:', error);
});

server.on('close', (code) => {
    console.log(`📱 服务器进程退出，代码: ${code}`);
});

console.log('✅ 服务器启动命令已执行');
