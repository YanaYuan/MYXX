@echo off
echo 🚀 启动 TextCraft Studio 服务器（端口3001）...
echo.

echo 📋 检查端口状态...
netstat -ano | findstr :3001 >nul
if %errorlevel% equ 0 (
    echo ⚠️  端口3001已被占用，尝试停止相关进程...
    for /f "tokens=5" %%i in ('netstat -ano ^| findstr :3001') do taskkill /f /pid %%i 2>nul
    timeout /t 2 >nul
)

echo ✅ 启动服务器...
node server.js

if %errorlevel% neq 0 (
    echo.
    echo ❌ 服务器启动失败！
    echo 💡 请检查错误信息并重试
) else (
    echo.
    echo ✅ 服务器已启动成功！
)

pause
