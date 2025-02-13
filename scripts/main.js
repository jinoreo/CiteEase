document.addEventListener('DOMContentLoaded', () => {
    // 获取DOM元素
    const inputText = document.getElementById('inputText');
    const outputText = document.getElementById('outputText');
    const convertBtn = document.getElementById('convertBtn');
    const clearBtn = document.getElementById('clearBtn');
    const copyBtn = document.getElementById('copyBtn');
    const formatButton = document.getElementById('formatButton');
    const formatDropdown = document.getElementById('formatDropdown');
    const formatInfo = document.getElementById('formatInfo');
    let currentFormat = 'law2gb';

    // 实时识别格式
    const detectFormat = (text) => {
        if (!text.trim()) {
            return '等待输入...';
        }
        // 不管当前选择的转换方向如何，都尝试识别输入的实际格式
        // 首先尝试识别 GB/T7714-2015 格式
        if (text.includes('[D]')) {
            return 'GB/T7714-2015 - 学位论文格式';
        } else if (text.includes('[J]')) {
            return 'GB/T7714-2015 - 期刊论文格式';
        } else if (text.includes('[M]')) {
            return 'GB/T7714-2015 - 图书格式';
        } else if (text.includes('[N]')) {
            return 'GB/T7714-2015 - 报纸格式';
        } else if (text.includes('[EB/OL]')) {
            return 'GB/T7714-2015 - 网络文献格式';
        }

        // 然后尝试识别法学引注手册格式
        if (text.includes('博士学位论文') || text.includes('硕士学位论文')) {
            return '法学引注手册 - 学位论文格式';
        } else if (text.includes('载《') && text.includes('版')) {
            return '法学引注手册 - 报纸格式';
        } else if (text.includes('http') || text.includes('www')) {
            return '法学引注手册 - 网络文献格式';
        } else if (text.includes('载《') || text.includes('期')) {
            return '法学引注手册 - 期刊论文格式';
        } else if (text.includes('：《') && text.includes('出版社')) {
            return '法学引注手册 - 图书格式';
        }
        return '未识别的格式';
    };

    // 更新格式检测逻辑
    const updateFormatInfo = (text) => {
        if (!text.trim()) {
            formatInfo.textContent = '等待输入...';
            return;
        }

        const { mainFormat, subType, confidence } = formatDetector.detectFormatType(text);
        const issues = formatDetector.checkCompleteness(text, { mainFormat, subType });
        const suggestions = formatDetector.getSuggestions(text, { mainFormat, subType }, issues);

        // 更新格式信息显示
        let formatText = mainFormat === 'law' ? '法学引注手册' : 
                        mainFormat === 'gb' ? 'GB/T7714-2015' : 
                        '未知格式';
        
        let typeText = '';
        switch (subType) {
            case 'book': typeText = '图书'; break;
            case 'journal': typeText = '期刊论文'; break;
            case 'thesis': typeText = '学位论文'; break;
            case 'newspaper': typeText = '报纸'; break;
            case 'web': typeText = '网络文献'; break;
            default: typeText = '未知类型';
        }

        formatInfo.innerHTML = `
            <div class="format-detail">
                <div class="format-main">${formatText} - ${typeText}</div>
                <div class="format-confidence">可信度: ${confidence}%</div>
            </div>
        `;

        // 显示问题和建议
        if (issues.missingElements.length > 0 || 
            issues.wrongPunctuation.length > 0 || 
            issues.formatIssues.length > 0) {
            
            const issueContainer = document.createElement('div');
            issueContainer.className = 'format-issues';
            
            const issuesList = [...issues.missingElements, ...issues.wrongPunctuation, ...issues.formatIssues];
            issuesList.forEach(issue => {
                const issueItem = document.createElement('div');
                issueItem.className = 'issue-item';
                issueItem.textContent = `⚠️ ${issue}`;
                issueContainer.appendChild(issueItem);
            });

            formatInfo.appendChild(issueContainer);
        }
    };

    // 更新输入框事件监听
    inputText.addEventListener('input', () => {
        updateFormatInfo(inputText.value);
    });

    // 下拉菜单控制
    formatButton.addEventListener('click', (e) => {
        e.stopPropagation();
        const isExpanded = formatButton.getAttribute('aria-expanded') === 'true';
        formatButton.setAttribute('aria-expanded', !isExpanded);
        formatDropdown.classList.toggle('show');
    });

    // 点击选项
    formatDropdown.addEventListener('click', (e) => {
        const option = e.target.closest('.select-option');
        if (!option) return;

        // 更新选中状态
        formatDropdown.querySelectorAll('.select-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        option.classList.add('selected');

        // 更新按钮文本和当前值
        currentFormat = option.dataset.value;
        formatButton.querySelector('.selected-text').textContent = option.textContent.trim();

        // 关闭下拉菜单
        formatDropdown.classList.remove('show');
        formatButton.setAttribute('aria-expanded', 'false');
        // 更新格式提示
        updateFormatInfo(inputText.value);
    });

    // 点击其他地方关闭下拉菜单
    document.addEventListener('click', () => {
        formatDropdown.classList.remove('show');
        formatButton.setAttribute('aria-expanded', 'false');
    });

    // 获取转换方向和保留序号的选项
    const getConvertOptions = () => {
        const direction = document.querySelector('input[name="direction"]:checked').value;
        const keepNumbers = document.getElementById('keepNumbers').checked || false;
        return { direction, keepNumbers };
    };

    // 处理单条转换
    const handleSingleConvert = () => {
        const input = document.getElementById('input').value.trim();
        if (!input) {
            utils.showMessage('请输入需要转换的文献引用格式', 'error');
            return;
        }

        try {
            const { direction, keepNumbers } = getConvertOptions();
            const result = converter.convert(input, direction, { keepNumbers });
            document.getElementById('output').value = result;
            utils.showMessage('转换成功', 'success');
        } catch (error) {
            utils.showMessage(error.message, 'error');
        }
    };

    // 处理批量转换
    const handleBatchConvert = () => {
        const input = document.getElementById('input').value.trim();
        if (!input) {
            utils.showMessage('请输入需要转换的文献引用格式', 'error');
            return;
        }

        try {
            const { direction, keepNumbers } = getConvertOptions();
            const { results, errors } = converter.convertBatch(input, direction, { keepNumbers });
            
            document.getElementById('output').value = results;
            
            if (errors.length > 0) {
                utils.showMessage('部分转换失败：\n' + errors.join('\n'), 'warning');
            } else {
                utils.showMessage('转换成功', 'success');
            }
        } catch (error) {
            utils.showMessage(error.message, 'error');
        }
    };

    // 转换按钮点击事件
    convertBtn.addEventListener('click', () => {
        const input = inputText.value.trim();
        const direction = currentFormat;
        const keepNumbers = document.getElementById('keepNumbers').checked || false;
        
        if (!input) {
            utils.showMessage('请输入需要转换的文本', 'error');
            return;
        }

        try {
            const { results, errors } = converter.convertBatch(input, direction, { keepNumbers });
            outputText.value = results;
            
            if (errors.length > 0) {
                utils.showMessage(errors.join('\n'), 'warning');
            } else {
                utils.showMessage('转换成功！', 'success');
            }
        } catch (error) {
            utils.showMessage(error.message, 'error');
        }
    });

    // 清空按钮点击事件
    clearBtn.addEventListener('click', () => {
        inputText.value = '';
        outputText.value = '';
        utils.showMessage('已清空内容');
    });

    // 复制按钮点击事件
    copyBtn.addEventListener('click', async () => {
        const output = outputText.value.trim();
        if (!output) {
            utils.showMessage('没有可复制的内容', 'error');
            return;
        }

        const success = await utils.copyToClipboard(output);
        if (success) {
            utils.showMessage('复制成功！', 'success');
        } else {
            utils.showMessage('复制失败，请手动复制', 'error');
        }
    });
}); 