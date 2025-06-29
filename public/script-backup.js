document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('textForm');
    const textInput = document.getElementById('textInput');
    const generateBtn = document.getElementById('generateBtn');
    const loadingDiv = document.getElementById('loadingDiv');
    const styleOptions = document.getElementById('styleOptions');
    const resultActions = document.getElementById('resultActions');

    // 配图选项变化处理
    const imageOptionRadios = document.querySelectorAll('input[name="imageOption"]');
    imageOptionRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'yes') {
                styleOptions.style.display = 'block';
            } else {
                styleOptions.style.display = 'none';
            }
        });
    });

    // 表单提交处理
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const text = textInput.value.trim();
        if (!text) {
            showToast('请输入文本内容', 'error');
            return;
        }

        try {
            // 显示加载状态
            showLoading(true);
            hideResultActions();
            
            // 获取用户选择的配图选项和风格
            const imageOption = document.querySelector('input[name="imageOption"]:checked').value;
            const imageStyle = document.querySelector('input[name="imageStyle"]:checked')?.value || 'realistic';
            
            // 调用API
            const response = await fetch('/api/generate-webpage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    text: text,
                    imageOption: imageOption,
                    imageStyle: imageStyle
                })
            });

            const data = await response.json();

            if (data.success) {
                // 保存生成的HTML供其他功能使用
                window.generatedHTML = data.html;
                
                // 直接使用原始HTML，不注入taskbar
                const finalHTML = data.html;
                
                // 添加调试信息
                console.log('生成的HTML长度:', data.html.length);
                console.log('PPT页面将直接显示，无taskbar');
                
                // 在新标签页打开生成的PPT页面
                const newTab = window.open('', '_blank');
                
                // 确保新标签页已打开
                if (newTab) {
                    try {
                        // 写入HTML内容
                        newTab.document.write(finalHTML);
                        newTab.document.close();
                        
                        // 页面加载完成后确认
                        newTab.addEventListener('load', function() {
                            console.log('新标签页加载完成 - 纯净PPT页面显示');
                        });
                        
                        // 显示成功操作区域
                        showResultActions();
                        
                        // 使用服务器返回的消息
                        const message = data.message || 'PPT页面生成成功！已在新标签页打开预览';
                        showToast(message, 'success');
                    } catch (error) {
                        console.error('新标签页内容写入失败:', error);
                        showToast('页面打开失败，请检查浏览器弹窗设置', 'error');
                    }
                } else {
                    showToast('无法打开新标签页，请检查浏览器弹窗拦截设置', 'error');
                }
            } else {
                showToast(data.error || '生成失败，请重试', 'error');
            }
        } catch (error) {
            console.error('请求失败:', error);
            showToast('网络请求失败，请检查连接并重试', 'error');
        } finally {
            showLoading(false);
        }
    });

    // 显示加载状态
    function showLoading(isLoading) {
        if (isLoading) {
            generateBtn.disabled = true;
            generateBtn.innerHTML = '🔄 AI正在创作中...';
            loadingDiv.style.display = 'block';
            
            // 更新加载文字
            const loadingText = loadingDiv.querySelector('p');
            if (loadingText) {
                loadingText.innerHTML = '🎨 AI正在分析内容并生成精美PPT页面...<br>📸 如选择配图会自动生成，请稍候...';
            }
        } else {
            generateBtn.disabled = false;
            generateBtn.innerHTML = '⚡ GENERATE PPT PAGE';
            loadingDiv.style.display = 'none';
        }
    }

    // 显示结果操作区域
    function showResultActions() {
        resultActions.classList.add('show');
        resultActions.scrollIntoView({ behavior: 'smooth' });
    }

    // 隐藏结果操作区域
    function hideResultActions() {
        resultActions.classList.remove('show');
    }

    // 显示Toast消息
    function showToast(message, type = 'info') {
        // 创建toast元素
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 9999;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;

        // 根据类型设置背景色
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            info: '#17a2b8'
        };
        toast.style.backgroundColor = colors[type] || colors.info;
        
        // 设置图标
        const icons = {
            success: '✅',
            error: '❌',
            info: 'ℹ️'
        };
        toast.innerHTML = `${icons[type] || icons.info} ${message}`;

        // 添加到页面
        document.body.appendChild(toast);

        // 动画显示
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);

        // 3秒后自动移除
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    // 输入框自动调整高度
    textInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.max(200, this.scrollHeight) + 'px';
    });

    // 快捷键支持 (Ctrl+Enter 提交)
    textInput.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') {
            form.dispatchEvent(new Event('submit'));
        }
    });
});

// Toast消息函数（全局使用）
function showToast(message, type = 'info') {
    // 创建toast元素
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 9999;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;

    // 根据类型设置背景色
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        info: '#17a2b8'
    };
    toast.style.backgroundColor = colors[type] || colors.info;
    
    // 设置图标
    const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️'
    };
    toast.innerHTML = `${icons[type] || icons.info} ${message}`;

    // 添加到页面
    document.body.appendChild(toast);

    // 动画显示
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 100);

    // 3秒后自动移除
    setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// 错误处理
window.addEventListener('error', function(e) {
    console.error('页面错误:', e.error);
});

// 检查服务器状态
async function checkServerStatus() {
    try {
        const response = await fetch('/api/health');
        const data = await response.json();
        console.log('服务器状态:', data.status);
    } catch (error) {
        console.warn('无法连接到服务器');
    }
}

// 页面加载完成后检查服务器状态
checkServerStatus();

// 为生成的HTML注入taskbar（当前已禁用，PPT页面将显示纯净内容）
// 如需重新启用taskbar功能，请取消下面函数的注释并在生成页面时调用
/*
function injectTaskbar(html) {
    const taskbarHTML = `
    <!-- TextCraft Studio Taskbar - 确保布局正确 -->
    <div id="textcraft-taskbar" style="
        position: fixed !important;
        bottom: 0 !important;
        left: 0 !important;
        right: 0 !important;
        width: 100% !important;
        height: 70px !important;
        background: linear-gradient(135deg, rgba(5, 5, 15, 0.98), rgba(15, 15, 25, 0.98)) !important;
        backdrop-filter: blur(25px) !important;
        border-top: 2px solid rgba(0, 212, 255, 0.4) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        z-index: 999999 !important;
        font-family: 'Segoe UI', 'SF Pro Display', 'Roboto', sans-serif !important;
        box-shadow: 0 -8px 40px rgba(0, 0, 0, 0.4), 0 -2px 10px rgba(0, 212, 255, 0.1) !important;
        overflow: hidden !important;
        margin: 0 !important;
        padding: 0 20px !important;
        box-sizing: border-box !important;
    ">
        <!-- 背景动效 -->
        <div style="
            position: absolute !important;
            top: 0 !important;
            left: -100% !important;
            width: 100% !important;
            height: 100% !important;
            background: linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.1), transparent) !important;
            animation: scan 4s infinite ease-in-out !important;
            pointer-events: none !important;
        "></div>
        
        <!-- 品牌标识 -->
        <div style="
            position: absolute !important;
            left: 30px !important;
            display: flex !important;
            align-items: center !important;
            gap: 12px !important;
            color: rgba(0, 212, 255, 0.9) !important;
            font-size: 14px !important;
            font-weight: 600 !important;
            letter-spacing: 0.5px !important;
            z-index: 1 !important;
        ">
            <div style="
                width: 24px !important;
                height: 24px !important;
                background: linear-gradient(135deg, #00d4ff, #ff00aa) !important;
                border-radius: 50% !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                font-size: 12px !important;
                animation: rotate 8s linear infinite !important;
                box-shadow: 0 0 15px rgba(0, 212, 255, 0.4) !important;
            ">✨</div>
            <span>TextCraft Studio</span>
        </div>
        
        <!-- 中央品牌展示区域 -->
        <div style="
            position: absolute !important;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important;
            z-index: 2 !important;
            display: flex !important;
            align-items: center !important;
            gap: 15px !important;
            color: rgba(0, 212, 255, 0.9) !important;
            font-size: 16px !important;
            font-weight: 600 !important;
            letter-spacing: 1px !important;
        ">
            <div style="
                width: 28px !important;
                height: 28px !important;
                background: linear-gradient(135deg, #00d4ff, #ff00aa) !important;
                border-radius: 50% !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                font-size: 14px !important;
                animation: rotate 8s linear infinite !important;
                box-shadow: 0 0 20px rgba(0, 212, 255, 0.5) !important;
            ">✨</div>
            <span style="text-shadow: 0 0 10px rgba(0, 212, 255, 0.3) !important;">AI Powered PPT Studio</span>
        </div>
        
        <!-- 状态指示器 -->
        <div style="
            position: absolute !important;
            right: 30px !important;
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
            color: rgba(0, 255, 136, 0.8) !important;
            font-size: 12px !important;
            font-weight: 500 !important;
            z-index: 1 !important;
        ">
            <div style="
                width: 8px !important;
                height: 8px !important;
                background: #00ff88 !important;
                border-radius: 50% !important;
                animation: pulse 2s infinite !important;
                box-shadow: 0 0 15px rgba(0, 255, 136, 0.6) !important;
            "></div>
            <span>PPT Ready</span>
        </div>
    </div>

    <style>
        /* 确保动画样式正确应用 */
        @keyframes scan {
            0% { left: -100% !important; }
            50% { left: 0% !important; }
            100% { left: 100% !important; }
        }
        
        @keyframes rotate {
            from { transform: rotate(0deg) !important; }
            to { transform: rotate(360deg) !important; }
        }
        
        @keyframes gradientShift {
            0%, 100% { background-position: 0% 50% !important; }
            50% { background-position: 100% 50% !important; }
        }
        
        @keyframes pulse {
            0%, 100% { 
                opacity: 1 !important; 
                transform: scale(1) !important; 
            }
            50% { 
                opacity: 0.6 !important; 
                transform: scale(1.2) !important; 
            }
        }
        
        /* 防止任何样式被覆盖 */
        #textcraft-taskbar {
            position: fixed !important;
            bottom: 0 !important;
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
        }
        
        /* 确保页面内容不被taskbar覆盖 */
        body {
            padding-bottom: 90px !important;
            margin-bottom: 0 !important;
        }
    </style>

    <script>
        // 确保页面加载完成后立即应用样式
        (function() {
            // 立即为页面内容添加底部边距
            document.body.style.paddingBottom = '90px';
            document.body.style.marginBottom = '0';
            
            // DOM加载完成后确保taskbar显示
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', ensureTaskbarDisplay);
            } else {
                ensureTaskbarDisplay();
            }
            
            // 页面完全加载后再次确保
            window.addEventListener('load', ensureTaskbarDisplay);
            
            function ensureTaskbarDisplay() {
                const taskbar = document.getElementById('textcraft-taskbar');
                if (taskbar) {
                    taskbar.style.display = 'flex';
                    taskbar.style.position = 'fixed';
                    taskbar.style.bottom = '0';
                    taskbar.style.zIndex = '999999';
                    console.log('Taskbar 确保显示正确');
                }
            }
        })();
        
        // 确保taskbar始终可见
        window.addEventListener('load', function() {
            const taskbar = document.getElementById('textcraft-taskbar');
            if (taskbar) {
                taskbar.style.display = 'flex';
                console.log('✓ TextCraft Studio Taskbar 已正确显示');
            }
        });
    </script>
    `;
    
    // 在body结束标签前插入taskbar
    if (html.includes('</body>')) {
        return html.replace('</body>', taskbarHTML + '</body>');
    } else {
        // 如果没有找到</body>标签，就添加到最后
        return html + taskbarHTML;
    }
}
*/

// Demo内容填充函数 - 智能检测页面语言
function fillDemoContent() {
    // 检查页面标题或URL来判断语言
    if (document.title.includes('美页秀秀') || window.location.href.includes('index-cn.html')) {
        fillDemoContentCN();
    } else {
        fillDemoContentEN();
    }
}

// 电动汽车技术方案 Demo
function fillDemoContentEV() {
    const textInput = document.getElementById('textInput');
    const demoContent = `电动汽车技术方案
主要围绕"四电系统"展开：
动力电池采用高能量密度锂离子电池组，搭配智能BMS管理系统实现精准充放电控制；
驱动系统集成高效永磁同步电机，配合多档变速器提升能效；
电控系统通过域控制器实现整车能量管理，支持V2G车网互动技术。
智电系统采用人工智能技术，跟用户对话实现智能控制`;

    fillContentHelper(textInput, demoContent, '电动汽车技术方案已加载！', 'EV tech solution loaded!');
}

// 故宫介绍 Demo
function fillDemoContentPalace() {
    const textInput = document.getElementById('textInput');
    const demoContent = `介绍故宫`;

    fillContentHelper(textInput, demoContent, '故宫介绍内容已加载！', 'Palace Museum content loaded!');
}

// 通用填充帮助函数
function fillContentHelper(textInput, content, cnMessage, enMessage) {
    textInput.value = content;
    
    // 自动选择AI配图选项来展示最佳效果
    const imageOption = document.querySelector('input[name="imageOption"][value="yes"]');
    if (imageOption) {
        imageOption.checked = true;
        imageOption.dispatchEvent(new Event('change'));
        
        setTimeout(() => {
            const realisticStyle = document.querySelector('input[name="imageStyle"][value="realistic"]');
            if (realisticStyle) {
                realisticStyle.checked = true;
            }
        }, 100);
    }
    
    textInput.focus();
    
    // 根据页面语言显示提示
    const message = document.title.includes('美页秀秀') ? cnMessage : enMessage;
    showToast(message, 'success');
}






