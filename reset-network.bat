@echo off
echo 🔧 清理网络端口占用...
echo.

echo 📋 重置网络端口...
netsh int ip reset reset.log
netsh winsock reset

echo ✅ 网络端口已重置
echo.
echo 💡 建议重启计算机以完全生效
echo 💡 或者直接使用端口3001启动服务器

pause
