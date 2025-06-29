@echo off
echo 🚀 启动 TextCraft Studio 服务器...
echo.

echo 📋 检查配置文件...
if exist .env (
    echo ✅ .env 文件存在
) else (
    echo ❌ .env 文件缺失
    pause
    exit
)

if exist server.js (
    echo ✅ server.js 文件存在
) else (
    echo ❌ server.js 文件缺失
    pause
    exit
)

echo.
echo 🔧 启动服务器...
node server.js

echo.
echo ❌ 服务器启动失败或已停止
pause
