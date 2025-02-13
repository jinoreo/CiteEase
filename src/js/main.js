import converter from './modules/converter/index.js';
import { CONVERSION_DIRECTIONS } from './modules/config/constants.js';

document.addEventListener('DOMContentLoaded', () => {
    const inputText = document.getElementById('inputText');
    const outputText = document.getElementById('outputText');
    const convertBtn = document.getElementById('convertBtn');
    const clearBtn = document.getElementById('clearBtn');
    const copyBtn = document.getElementById('copyBtn');
    const keepNumbersCheckbox = document.getElementById('keepNumbers');
    const formatButton = document.getElementById('formatButton');
    const formatDropdown = document.getElementById('formatDropdown');
    const formatInfo = document.getElementById('formatInfo');

    // 转换按钮点击事件
    convertBtn.addEventListener('click', () => {
        try {
            const direction = document.querySelector('.select-option.selected').dataset.value;
            const keepNumbers = keepNumbersCheckbox.checked;
            
            const result = converter.convert(inputText.value, direction, { keepNumbers });
            outputText.value = result;
        } catch (error) {
            outputText.value = `错误：${error.message}`;
        }
    });

    // 清空按钮点击事件
    clearBtn.addEventListener('click', () => {
        inputText.value = '';
        outputText.value = '';
        formatInfo.textContent = '等待输入...';
    });

    // 复制按钮点击事件
    copyBtn.addEventListener('click', () => {
        outputText.select();
        document.execCommand('copy');
    });

    // 格式选择下拉菜单
    formatButton.addEventListener('click', () => {
        formatDropdown.classList.toggle('show');
    });

    // 选择格式
    formatDropdown.addEventListener('click', (e) => {
        if (e.target.classList.contains('select-option')) {
            const options = formatDropdown.querySelectorAll('.select-option');
            options.forEach(opt => opt.classList.remove('selected'));
            e.target.classList.add('selected');
            formatButton.querySelector('.selected-text').textContent = e.target.textContent;
            formatDropdown.classList.remove('show');
        }
    });

    // 点击其他地方关闭下拉菜单
    document.addEventListener('click', (e) => {
        if (!formatButton.contains(e.target)) {
            formatDropdown.classList.remove('show');
        }
    });
}); 