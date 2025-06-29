document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('textForm');
    const textInput = document.getElementById('textInput');
    const generateBtn = document.getElementById('generateBtn');
    const result = document.getElementById('result');
    const loadingDiv = document.getElementById('loadingDiv');

    // 表单提交处理
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const text = textInput.value.trim();
        if (!text) {
            showError('请输入文本内容');
            return;
        }

        try {
            // 显示加载状态
            showLoading(true);
            
            // 获取用户选择的配图选项
            const imageOption = document.querySelector('input[name="imageOption"]:checked').value;
            
            // 调用API
            const response = await fetch('/api/generate-webpage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    text: text,
                    imageOption: imageOption 
                })
            });

            const data = await response.json();

            if (data.success) {
                displayResult(data.html);
                let message = '网页生成成功！';
                
                if (data.imageOption === 'yes') {
                    message += data.hasImage ? ' 🖼️ 已包含配图' : ' ⚠️ 配图生成失败';
                } else {
                    message += ' 📝 纯文字版本';
                }
                
                showSuccess(message);
            } else {
                showError(data.error || '生成失败，请重试');
            }
        } catch (error) {
            console.error('请求失败:', error);
            showError('网络请求失败，请检查连接并重试');
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
                loadingText.innerHTML = '🎨 AI正在分析内容并生成精美网页...<br>📸 如选择配图会自动生成，请稍候...';
            }
        } else {
            generateBtn.disabled = false;
            generateBtn.innerHTML = '🎨 生成精美网页';
            loadingDiv.style.display = 'none';
        }
    }

    // 显示结果
    function displayResult(html) {
        // 创建iframe来安全地显示生成的HTML
        const iframe = document.createElement('iframe');
        iframe.className = 'preview-frame';
        iframe.srcdoc = html;
        iframe.style.width = '100%';
        iframe.style.height = '400px';
        iframe.style.border = '2px solid #e9ecef';
        iframe.style.borderRadius = '10px';

        // 清空之前的结果并添加新的iframe
        result.innerHTML = '';
        result.appendChild(iframe);

        // 添加操作按钮
        const actions = document.createElement('div');
        actions.className = 'actions';
        actions.innerHTML = `
            <button class="btn btn-secondary" onclick="downloadHTML()">📥 下载HTML</button>
            <button class="btn btn-secondary" onclick="openInNewTab()">🔗 新窗口打开</button>
        `;
        result.appendChild(actions);

        // 保存生成的HTML供其他功能使用
        window.generatedHTML = html;
    }

    // 显示错误消息
    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.innerHTML = `❌ ${message}`;
        
        result.innerHTML = '';
        result.appendChild(errorDiv);
        
        // 3秒后自动清除错误消息
        setTimeout(() => {
            if (result.contains(errorDiv)) {
                result.innerHTML = `
                    <div style="text-align: center; padding: 50px; color: #999; border: 2px dashed #ddd; border-radius: 10px;">
                        <p>🎯 在左侧输入文本并点击生成按钮</p>
                        <p>AI将为您创建精美的网页内容</p>
                    </div>
                `;
            }
        }, 3000);
    }

    // 显示成功消息
    function showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success';
        successDiv.innerHTML = `✅ ${message}`;
        
        // 插入到结果顶部
        result.insertBefore(successDiv, result.firstChild);
        
        // 3秒后自动清除成功消息
        setTimeout(() => {
            if (result.contains(successDiv)) {
                result.removeChild(successDiv);
            }
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

// 下载HTML文件
function downloadHTML() {
    if (!window.generatedHTML) {
        alert('没有可下载的HTML内容');
        return;
    }

    const blob = new Blob([window.generatedHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated-webpage.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// 在新窗口打开
function openInNewTab() {
    if (!window.generatedHTML) {
        alert('没有可打开的HTML内容');
        return;
    }

    const newWindow = window.open();
    newWindow.document.write(window.generatedHTML);
    newWindow.document.close();
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
