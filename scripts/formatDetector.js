const formatDetector = {
    // 格式类型检测
    detectFormatType(text) {
        if (!text.trim()) {
            return {
                mainFormat: null,
                subType: null,
                confidence: 0
            };
        }

        let mainFormat = 'unknown';
        let subType = 'unknown';
        let confidence = 0;

        // 检测 GB/T7714-2015 格式
        if (text.includes('[M]') || text.includes('[J]') || text.includes('[D]') || 
            text.includes('[N]') || text.includes('[EB/OL]')) {
            mainFormat = 'gb';
            confidence = 90;

            // 识别具体类型
            if (text.includes('[M]')) subType = 'book';
            else if (text.includes('[J]')) subType = 'journal';
            else if (text.includes('[D]')) subType = 'thesis';
            else if (text.includes('[N]')) subType = 'newspaper';
            else if (text.includes('[EB/OL]')) subType = 'web';
        }
        // 检测法学引注手册格式
        else if (text.includes('：《') || text.includes('："')) {
            mainFormat = 'law';
            confidence = 80;

            // 识别具体类型
            if (text.includes('出版社') && !text.includes('载《')) subType = 'book';
            else if (text.includes('学位论文')) subType = 'thesis';
            else if (text.includes('载《') && text.includes('期')) subType = 'journal';
            else if (text.includes('报》') && text.includes('版')) subType = 'newspaper';
            else if (text.includes('http') || text.includes('www')) subType = 'web';
        }

        return { mainFormat, subType, confidence };
    },

    // 完整性检查
    checkCompleteness(text, format) {
        const issues = {
            missingElements: [],
            wrongPunctuation: [],
            formatIssues: []
        };

        if (format.mainFormat === 'law') {
            // 检查法学引注格式
            if (!text.includes('：')) {
                issues.wrongPunctuation.push('缺少作者与标题之间的全角冒号');
            }
            if (!text.includes('《') || !text.includes('》')) {
                issues.wrongPunctuation.push('缺少书名号');
            }
            if (!text.match(/\d{4}年/)) {
                issues.missingElements.push('缺少年份信息');
            }
            if (format.subType === 'book' && !text.includes('出版社')) {
                issues.missingElements.push('缺少出版社信息');
            }
        } else if (format.mainFormat === 'gb') {
            // 检查 GB/T7714-2015 格式
            if (!text.match(/\[\w+\]/)) {
                issues.formatIssues.push('缺少文献类型标识');
            }
            if (!text.match(/\d{4}/)) {
                issues.missingElements.push('缺少年份信息');
            }
            if (!text.endsWith('.')) {
                issues.wrongPunctuation.push('引用末尾应以英文句点结束');
            }
        }

        return issues;
    },

    // 智能修正建议
    getSuggestions(text, format, issues) {
        const suggestions = [];

        // 处理标点符号问题
        issues.wrongPunctuation.forEach(issue => {
            if (issue.includes('全角冒号')) {
                suggestions.push({
                    type: 'punctuation',
                    message: '将半角冒号替换为全角冒号"："',
                    fix: text.replace(/:/g, '：')
                });
            }
            if (issue.includes('句点')) {
                suggestions.push({
                    type: 'punctuation',
                    message: '在引用末尾添加英文句点',
                    fix: text.endsWith('.') ? text : text + '.'
                });
            }
        });

        // 处理缺失元素
        issues.missingElements.forEach(issue => {
            if (issue.includes('年份')) {
                suggestions.push({
                    type: 'missing',
                    message: '请添加出版年份信息',
                    fix: null // 需要用户手动添加
                });
            }
            if (issue.includes('出版社')) {
                suggestions.push({
                    type: 'missing',
                    message: '请添加出版社信息',
                    fix: null // 需要用户手动添加
                });
            }
        });

        return suggestions;
    }
}; 