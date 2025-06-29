// 测试基本功能的简化版script.js
document.addEventListener('DOMContentLoaded', function() {
    console.log('页面加载完成，开始初始化...');
    
    const form = document.getElementById('textForm');
    const textInput = document.getElementById('textInput');
    const generateBtn = document.getElementById('generateBtn');
    const loadingDiv = document.getElementById('loadingDiv');
    const styleOptions = document.getElementById('styleOptions');
    const resultActions = document.getElementById('resultActions');

    // 检查所有元素是否存在
    console.log('表单元素检查:', {
        form: !!form,
        textInput: !!textInput,
        generateBtn: !!generateBtn,
        loadingDiv: !!loadingDiv,
        styleOptions: !!styleOptions,
        resultActions: !!resultActions
    });

    // 配图选项变化处理
    const imageOptionRadios = document.querySelectorAll('input[name="imageOption"]');
    console.log('找到配图选项按钮数量:', imageOptionRadios.length);
    
    imageOptionRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            console.log('配图选项改变:', this.value);
            if (this.value === 'yes') {
                styleOptions.style.display = 'block';
            } else {
                styleOptions.style.display = 'none';
            }
        });
    });

    // 表单提交处理
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('表单提交事件触发');
            
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
                const imageOption = document.querySelector('input[name="imageOption"]:checked')?.value || 'no';
                const imageStyle = document.querySelector('input[name="imageStyle"]:checked')?.value || 'realistic';
                
                console.log('提交参数:', { text, imageOption, imageStyle });
                
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
    }

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
        if (resultActions) {
            resultActions.classList.add('show');
            resultActions.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // 隐藏结果操作区域
    function hideResultActions() {
        if (resultActions) {
            resultActions.classList.remove('show');
        }
    }

    // 输入框自动调整高度
    if (textInput) {
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
    }
});

// Toast消息函数（全局使用）
function showToast(message, type = 'info') {
    console.log('显示Toast:', message, type);
    
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

// Demo内容填充函数 - 智能检测页面语言
function fillDemoContent() {
    console.log('填充Demo内容');
    // 检查页面标题或URL来判断语言
    if (document.title.includes('美页秀秀') || window.location.href.includes('index-cn.html')) {
        fillDemoContentCN();
    } else {
        fillDemoContentEN();
    }
}

// 电动汽车技术方案 Demo
function fillDemoContentEV() {
    console.log('填充电动汽车Demo');
    const textInput = document.getElementById('textInput');
    if (!textInput) {
        console.error('找不到textInput元素');
        return;
    }
    
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
    console.log('填充故宫Demo');
    const textInput = document.getElementById('textInput');
    if (!textInput) {
        console.error('找不到textInput元素');
        return;
    }
    
    const demoContent = `介绍故宫`;
    fillContentHelper(textInput, demoContent, '故宫介绍内容已加载！', 'Palace Museum content loaded!');
}

// 通用填充帮助函数
function fillContentHelper(textInput, content, cnMessage, enMessage) {
    console.log('执行fillContentHelper');
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
