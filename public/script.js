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
            loadingDiv.classList.add('show');
            
            // 启动进度条和状态更新
            startLoadingProgress();
            createParticles();
        } else {
            generateBtn.disabled = false;
            generateBtn.innerHTML = '⚡ GENERATE PPT PAGE';
            loadingDiv.classList.remove('show');
            
            // 清理粒子效果
            clearParticles();
        }
    }

    // 进度条和状态管理
    let progressInterval;
    let currentProgress = 0;
    
    // 判断是否为中文页面
    const isChinese = window.location.pathname.includes('cn') || document.documentElement.lang === 'zh';
    
    const loadingStages = isChinese ? [
        { progress: 15, status: "🧠 神经网络初始化中", subStatus: "加载AI模型和量子处理器..." },
        { progress: 30, status: "📝 内容分析阶段", subStatus: "使用先进NLP算法解析输入数据..." },
        { progress: 50, status: "🎨 创意引擎激活", subStatus: "生成设计模式和视觉布局..." },
        { progress: 70, status: "🖼️ 图像合成模块", subStatus: "创建高质量视觉资源..." },
        { progress: 85, status: "⚡ 最终装配处理", subStatus: "量子优化编译PPT组件..." },
        { progress: 95, status: "🚀 质量保证检查", subStatus: "使用AI质量指标验证输出..." },
        { progress: 100, status: "✅ 生成完成", subStatus: "您精美的PPT页面已准备就绪！" }
    ] : [
        { progress: 15, status: "🧠 Neural Network Initialization", subStatus: "Loading AI models and quantum processors..." },
        { progress: 30, status: "📝 Content Analysis Phase", subStatus: "Parsing input data with advanced NLP algorithms..." },
        { progress: 50, status: "🎨 Creative Engine Activation", subStatus: "Generating design patterns and visual layouts..." },
        { progress: 70, status: "🖼️ Image Synthesis Module", subStatus: "Creating high-quality visual assets..." },
        { progress: 85, status: "⚡ Final Assembly Process", subStatus: "Compiling PPT components with quantum optimization..." },
        { progress: 95, status: "🚀 Quality Assurance Check", subStatus: "Validating output with AI quality metrics..." },
        { progress: 100, status: "✅ Generation Complete", subStatus: "Your stunning PPT page is ready!" }
    ];

    function startLoadingProgress() {
        currentProgress = 0;
        let stageIndex = 0;
        
        const progressFill = document.getElementById('progressFill');
        const progressPercentage = document.getElementById('progressPercentage');
        const statusText = document.getElementById('statusText');
        const subStatus = document.getElementById('subStatus');
        
        // 初始状态
        if (progressFill) progressFill.style.width = '0%';
        if (progressPercentage) progressPercentage.textContent = '0%';
        
        progressInterval = setInterval(() => {
            // 随机增长速度，模拟真实处理过程
            const increment = Math.random() * 3 + 0.5;
            currentProgress = Math.min(currentProgress + increment, 100);
            
            // 更新进度条
            if (progressFill) {
                progressFill.style.width = currentProgress + '%';
            }
            if (progressPercentage) {
                progressPercentage.textContent = Math.floor(currentProgress) + '%';
                progressPercentage.style.left = `calc(${currentProgress}% - 20px)`;
            }
            
            // 更新状态文本
            const currentStage = loadingStages[stageIndex];
            if (currentProgress >= currentStage.progress && stageIndex < loadingStages.length - 1) {
                stageIndex++;
                if (statusText) statusText.textContent = loadingStages[stageIndex].status;
                if (subStatus) subStatus.textContent = loadingStages[stageIndex].subStatus;
            }
            
            // 达到100%时停止
            if (currentProgress >= 100) {
                clearInterval(progressInterval);
                if (statusText) statusText.textContent = loadingStages[loadingStages.length - 1].status;
                if (subStatus) subStatus.textContent = loadingStages[loadingStages.length - 1].subStatus;
            }
        }, 150); // 每150ms更新一次
    }

    // 粒子效果
    function createParticles() {
        const particlesContainer = document.getElementById('particles');
        if (!particlesContainer) return;
        
        // 清理现有粒子
        particlesContainer.innerHTML = '';
        
        // 创建粒子
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.left = Math.random() * 100 + '%';
                particle.style.animationDelay = Math.random() * 8 + 's';
                particle.style.animationDuration = (Math.random() * 4 + 6) + 's';
                
                // 随机颜色
                const colors = ['#00d4ff', '#ff00aa', '#00ff88', '#ffaa00'];
                particle.style.background = colors[Math.floor(Math.random() * colors.length)];
                particle.style.boxShadow = `0 0 6px ${particle.style.background}`;
                
                particlesContainer.appendChild(particle);
            }, i * 200);
        }
    }

    function clearParticles() {
        const particlesContainer = document.getElementById('particles');
        if (particlesContainer) {
            particlesContainer.innerHTML = '';
        }
        if (progressInterval) {
            clearInterval(progressInterval);
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

// 中文版Demo内容（默认为故宫，使用智能配图）
function fillDemoContentCN() {
    console.log('填充中文Demo - 故宫');
    fillDemoContentPalace();
}

// 英文版Demo内容（默认为电车，使用纯文字）
function fillDemoContentEN() {
    console.log('填充英文Demo - 电车');
    fillDemoContentEV();
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

    // 电车demo使用纯文字模式
    fillContentHelper(textInput, demoContent, '电动汽车技术方案已加载！', 'EV tech solution loaded!', false);
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
    // 故宫demo使用智能配图模式
    fillContentHelper(textInput, demoContent, '故宫介绍内容已加载！', 'Palace Museum content loaded!', true);
}

// 通用填充帮助函数
function fillContentHelper(textInput, content, cnMessage, enMessage, useAIImage = false) {
    console.log('执行fillContentHelper, useAIImage:', useAIImage);
    textInput.value = content;
    
    // 根据参数选择配图模式
    if (useAIImage) {
        // 选择AI配图选项
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
    } else {
        // 选择纯文字模式
        const noImageOption = document.querySelector('input[name="imageOption"][value="no"]');
        if (noImageOption) {
            noImageOption.checked = true;
            noImageOption.dispatchEvent(new Event('change'));
        }
    }
    
    textInput.focus();
    
    // 根据页面语言显示提示
    const message = document.title.includes('美页秀秀') ? cnMessage : enMessage;
    showToast(message, 'success');
}

// 在新窗口打开最近生成的PPT页面
function openInNewWindow() {
    console.log('尝试在新窗口打开PPT页面');
    
    if (!window.generatedHTML) {
        console.log('没有可打开的HTML内容');
        showToast('没有可预览的PPT页面，请先生成内容', 'error');
        return;
    }

    try {
        // 直接使用保存的HTML内容，无taskbar
        const finalHTML = window.generatedHTML;
        
        // 在新标签页打开
        const newTab = window.open('', '_blank');
        
        if (newTab) {
            // 写入HTML内容
            newTab.document.write(finalHTML);
            newTab.document.close();
            
            console.log('PPT页面已在新标签页打开');
            showToast('PPT页面已在新标签页打开', 'success');
        } else {
            console.log('无法打开新标签页');
            showToast('无法打开新标签页，请检查浏览器弹窗设置', 'error');
        }
    } catch (error) {
        console.error('打开新窗口失败:', error);
        showToast('打开预览失败，请重试', 'error');
    }
}
