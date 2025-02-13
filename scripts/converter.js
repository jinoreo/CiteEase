const publisherCityMap = {
    "法律": "北京",
    "中国政法大学": "北京",
    "北京大学": "北京",
    "清华大学": "北京",
    "中国人民大学": "北京",
    "社会科学文献": "北京",
    "商务印书馆": "北京",
    "中信": "北京",
    "人民": "北京",
    "复旦大学": "上海",
    "上海人民": "上海",
    "上海三联书店": "上海",
    "格致": "上海",
    "浙江大学": "杭州",
    "武汉大学": "武汉",
    "南京大学": "南京",
    "江苏人民": "南京",
    "广东人民": "广州",
    "四川人民": "成都",
    "重庆大学": "重庆"
};

const getPublisherCity = (publisher) => {
    for (const key in publisherCityMap) {
        if (publisher.includes(key)) {
            return publisherCityMap[key];
        }
    }
    return null;
};

const converter = {
    // 在 converter 对象的顶部添加配置选项
    config: {
        keepNumbers: true // 默认保留序号
    },

    // 添加配置方法
    setConfig: (options) => {
        // 如果传入了 keepNumbers，则取反其值，因为现在勾选表示不保留序号
        if (options.hasOwnProperty('keepNumbers')) {
            options.keepNumbers = !options.keepNumbers;
        }
        converter.config = { ...converter.config, ...options };
    },

    // 识别文献类型
    identifyType: (text) => {
        // 通用的标点符号模式
        const punctuation = {
            colon: '[：:．.]',  // 冒号
            comma: '[，,．.]',  // 逗号
            period: '[．.。]',  // 句号
            quotes: ['《', '》'] // 书名号
        };

        // 先检查是否是 GB/T7714-2015 格式
        if (text.includes('[M]')) {
            return 'book';
        }
        if (text.includes('博士学位论文') || text.includes('硕士学位论文')) {
            return 'thesis';
        } else if (text.includes('版。') || text.includes('版．') || text.includes('版.')) {
            return 'newspaper';
        } else if (text.includes('http') || text.includes('www')) {
            return 'web';
        } else if ((text.includes('载《') || text.includes('载"')) && text.includes('期')) {
            return 'journal';
        } else if ((text.includes('《') || text.includes('"')) && text.includes('出版社')) {
            return 'book';
        } else {
            throw new Error('无法识别的文献类型');
        }
    },

    // 转换图书格式
    convertBook: (text) => {
        // 修改 convertBook 方法中的正则表达式部分
        const patterns = [
            // 带序号的格式
            /^\[(\d+)\]\s*(.+?)：《(.+?)》，(.+?)出版社(\d{4})年版。$/,
            // 不带序号的格式
            /^(.+?)：《(.+?)》，(.+?)出版社(\d{4})年版。$/
        ];

        let match;
        for (const pattern of patterns) {
            match = text.match(pattern);
            if (match) break;
        }

        if (!match) {
            throw new Error('图书格式不正确');
        }

        // 根据匹配结果的长度判断是否包含序号
        if (match.length === 6) {
            // 带序号的格式
            const [_, number, author, title, publisher, year] = match;
            // 根据配置决定是否保留序号
            const prefix = converter.config.keepNumbers ? `[${number}]` : '';
            return `${prefix}${author}：《${title}》，${publisher}出版社${year}年版。`;
        } else {
            // 不带序号的格式
            const [_, author, title, publisher, year] = match;
            return `${author}：《${title}》，${publisher}出版社${year}年版。`;
        }
    },

    // 转换期刊格式
    convertJournal: (text) => {
        // 匹配法学引注手册格式的期刊
        const patterns = [
            // 带范围页码和加号页码
            /^(?:\[(\d+)\])?(.*?)：《(.*?)》，载《(.*?)》(\d{4})年第(\d+)期，第(\d+)-(\d+)\+(\d+)页。$/,
            // 带范围页码
            /^(?:\[(\d+)\])?(.*?)：《(.*?)》，载《(.*?)》(\d{4})年第(\d+)期，第(\d+)-(\d+)页。$/,
            // 带单页码
            /^(?:\[(\d+)\])?(.*?)：《(.*?)》，载《(.*?)》(\d{4})年第(\d+)期，第(\d+)页。$/,
            // 不带页码
            /^(?:\[(\d+)\])?(.*?)：《(.*?)》，载《(.*?)》(\d{4})年第(\d+)期。$/
        ];

        let match;
        for (const pattern of patterns) {
            match = text.match(pattern);
            if (match) break;
        }

        if (!match) {
            throw new Error('期刊格式不正确');
        }

        // 在返回结果之前，将作者之间的标点转换为半角逗号
        const convertAuthors = (authors) => {
            return authors.replace(/[、，]/g, ',');
        };

        // 根据匹配结果处理不同情况
        const [_, number, author, title, journal, year, issue, startPage, endPage, extraPage] = match;
        const prefix = number && converter.config.keepNumbers ? `[${number}]` : '';
        const formattedIssue = issue.padStart(2, '0');
        
        if (extraPage) {
            // 带范围页码和加号页码
            return `${prefix}${convertAuthors(author)}.${title}[J].${journal},${year},(${formattedIssue}):${startPage}-${endPage}+${extraPage}.`;
        } else if (endPage) {
            // 带范围页码
            return `${prefix}${convertAuthors(author)}.${title}[J].${journal},${year},(${formattedIssue}):${startPage}-${endPage}.`;
        } else if (startPage) {
            // 带单页码
            return `${prefix}${convertAuthors(author)}.${title}[J].${journal},${year},(${formattedIssue}):${startPage}.`;
        } else {
            // 不带页码
            return `${prefix}${convertAuthors(author)}.${title}[J].${journal},${year},(${formattedIssue}).`;
        }
    },

    // 转换学位论文格式
    convertThesis: (text) => {
        // 匹配作者、标题、学校、年份、页码
        const pattern = /(.+)：《(.+)》，(.+)(\d{4})年(博士|硕士)学位论文，第(\d+)页。/;
        const match = text.match(pattern);

        if (!match) {
            throw new Error('学位论文格式不正确');
        }

        // 使用不同的变量名来避免重复声明
        const [_match, author, title, school, year, degree, page] = match;
        return `${author}.${title}[D].${school},${year}:${page}.`;
    },

    // 转换报纸格式
    convertNewspaper: (text) => {
        // 匹配作者、标题、报纸名、年月日、版次
        const pattern = /(.+)：《(.+)》，载《(.+)》(\d{4})年(\d+)月(\d+)日，第(\d+)版。/;
        const match = text.match(pattern);
        
        if (!match) {
            throw new Error('报纸格式不正确。正确格式示例：胡云腾：《正确把握认罪认罚从宽保证严格公正高效司法》，载《人民法院报》2019年10月24日，第5版。');
        }

        const [_, author, title, newspaper, year, month, day, page] = match;
        return `${author}.${title}[N].${newspaper},${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}(${page.padStart(3, '0')}).`;
    },

    // 转换网络文献格式
    convertWeb: (text) => {
        // 匹配标题、网站、年月日、URL
        const pattern = /《(.+)》，载(.+?)(\d{4})年(\d+)月(\d+)日，(http.+?)。/;
        const match = text.match(pattern);
        
        if (!match) {
            throw new Error('网络文献格式不正确。正确格式示例：《春节期间全国刑事、治安警情同比分别下降20.9%、14.3%》，载人民网2025年2月5日，http://society.people.com.cn/n1/2025/0205/c1008-40412338.html。');
        }

        const [_, title, website, year, month, day, url] = match;
        const citationDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        return `${title}[EB/OL].(${citationDate})[${citationDate}].${url}.`;
    },

    // 反向转换：GB/T7714-2015 转 法学引注手册
    convertGBToLaw: {
        // 转换图书格式
        book: (text) => {
            // 匹配 GB/T7714-2015 格式的图书
            const patterns = [
                // 带序号的完整格式（带出版地）：[数字] 作者.书名[M].出版地:出版社,年份.
                /^\[(\d+)\]\s*(.+?)[．.]\s*(.+?)\s*\[M\][．.]\s*(.+?)[：:]\s*(.+?)出版社[，,]\s*(\d{4})[．.]\s*$/,
                // 更宽松的带序号完整格式（处理可能的标点变体）
                /^\[(\d+)\]\s*(.+?)[．.．]\s*(.+?)\s*\[M\][．.．]\s*(.+?)[：:]\s*(.+?)出版社[，,]\s*(\d{4})[．.．]\s*$/,
                // 带序号的简单格式：[数字] 作者.书名[M].出版社,年份.
                /^\[(\d+)\]\s*(.+?)[．.]\s*(.+?)\s*\[M\][．.]\s*(.+?)出版社[，,]\s*(\d{4})[．.]\s*$/,
                // 不带序号的完整格式（带出版地）：作者.书名[M].出版地:出版社,年份.
                /^(.+?)[．.]\s*(.+?)\s*\[M\][．.]\s*(.+?)[：:]\s*(.+?)出版社[，,]\s*(\d{4})[．.]\s*$/,
                // 不带序号的简单格式：作者.书名[M].出版社,年份.
                /^(.+?)[．.]\s*(.+?)\s*\[M\][．.]\s*(.+?)出版社[，,]\s*(\d{4})[．.]\s*$/
            ];
            
            // 去除可能的首尾空格和不可见字符
            text = text.trim().replace(/\u200B/g, ''); // 移除零宽空格
            
            let match;
            for (const pattern of patterns) {
                match = text.match(pattern);
                if (match) {
                    console.log('Matched pattern:', pattern);
                    console.log('Match result:', match);
                    break;
                }
            }
            
            if (!match) {
                console.log('Failed to match text:', text);
                console.log('Text length:', text.length);
                console.log('Text character codes:', Array.from(text).map(c => c.charCodeAt(0)));
                throw new Error('GB/T7714-2015图书格式不正确。示例格式：\n' +
                    '[1] 作者.书名[M].出版地:出版社,年份.\n' +
                    '[5] 陈瑞华．刑事程序的法理[M]．北京：商务印书馆，2021．');
            }

            // 根据匹配组的数量判断格式类型
            if (match.length === 7) {
                // 带序号的完整格式（带出版地）
                const [_, number, author, title, city, publisher, year] = match;
                // 根据配置决定是否保留序号
                const prefix = converter.config.keepNumbers ? `[${number}]` : '';
                return `${prefix}${author}：《${title}》，${publisher}出版社${year}年版。`;
            } else if (match.length === 6) {
                if (text.includes('：') || text.includes(':')) {
                    // 不带序号的完整格式（带出版地）
                    const [_, author, title, city, publisher, year] = match;
                    return `${author}：《${title}》，${publisher}出版社${year}年版。`;
                } else {
                    // 带序号的简单格式
                    const [_, number, author, title, publisher, year] = match;
                    // 根据配置决定是否保留序号
                    const prefix = converter.config.keepNumbers ? `[${number}]` : '';
                    return `${prefix}${author}：《${title}》，${publisher}出版社${year}年版。`;
                }
            } else if (match.length === 5) {
                // 不带序号的简单格式
                const [_, author, title, publisher, year] = match;
                return `${author}：《${title}》，${publisher}出版社${year}年版。`;
            }
        },

        // 转换期刊格式
        journal: (text) => {
            // 匹配 GB/T7714-2015 格式的期刊
            const patterns = [
                // 带范围页码和加号页码
                /^(?:\[(\d+)\])?(.*?)[．.]\s*(.*?)\s*\[J\][．.]\s*(.*?)[，,]\s*(\d{4})[，,]\s*\(?(\d+)\)?[：:]\s*(\d+)-(\d+)\+(\d+)[．.]\s*$/,
                // 带范围页码
                /^(?:\[(\d+)\])?(.*?)[．.]\s*(.*?)\s*\[J\][．.]\s*(.*?)[，,]\s*(\d{4})[，,]\s*\(?(\d+)\)?[：:]\s*(\d+)-(\d+)[．.]\s*$/,
                // 带单页码
                /^(?:\[(\d+)\])?(.*?)[．.]\s*(.*?)\s*\[J\][．.]\s*(.*?)[，,]\s*(\d{4})[，,]\s*\(?(\d+)\)?[：:]\s*(\d+)[．.]\s*$/,
                // 不带页码
                /^(?:\[(\d+)\])?(.*?)[．.]\s*(.*?)\s*\[J\][．.]\s*(.*?)[，,]\s*(\d{4})[，,]\s*\(?(\d+)\)?[．.]\s*$/
            ];

            let match;
            for (const pattern of patterns) {
                match = text.match(pattern);
                if (match) break;
            }

            if (!match) {
                throw new Error('期刊格式不正确');
            }

            // 在返回结果之前，将作者之间的标点转换为顿号
            const convertAuthors = (authors) => {
                return authors.replace(/[，,]/g, '、');
            };

            // 根据匹配结果处理不同情况
            const [_, number, author, title, journal, year, issue, startPage, endPage, extraPage] = match;
            const prefix = number && converter.config.keepNumbers ? `[${number}]` : '';
            
            if (extraPage) {
                // 带范围页码和加号页码
                return `${prefix}${convertAuthors(author)}：《${title}》，载《${journal}》${year}年第${Number(issue)}期，第${startPage}-${endPage}+${extraPage}页。`;
            } else if (endPage) {
                // 带范围页码
                return `${prefix}${convertAuthors(author)}：《${title}》，载《${journal}》${year}年第${Number(issue)}期，第${startPage}-${endPage}页。`;
            } else if (startPage) {
                // 带单页码
                return `${prefix}${convertAuthors(author)}：《${title}》，载《${journal}》${year}年第${Number(issue)}期，第${startPage}页。`;
            } else {
                // 不带页码
                return `${prefix}${convertAuthors(author)}：《${title}》，载《${journal}》${year}年第${Number(issue)}期。`;
            }
        },

        // 转换学位论文格式
        thesis: (text) => {
            // 匹配 GB/T7714-2015 格式的学位论文
            const pattern = /(.+)\.(.+)\[D\]\.(.+),(\d{4}):(\d+)\./;
            const match = text.match(pattern);

            if (!match) {
                throw new Error('GB/T7714-2015学位论文格式不正确');
            }

            const [_, author, title, school, year, page] = match;
            return `${author}：《${title}》，${school}${year}年博士学位论文，第${page}页。`;
        },

        // 转换报纸格式
        newspaper: (text) => {
            // 匹配 GB/T7714-2015 格式的报纸
            const pattern = /(.+)\.(.+)\[N\]\.(.+),(\d{4})-(\d{2})-(\d{2})\((\d{3})\)\./;
            const match = text.match(pattern);

            if (!match) {
                throw new Error('GB/T7714-2015报纸格式不正确');
            }

            const [_, author, title, newspaper, year, month, day, page] = match;
            return `${author}：《${title}》，载《${newspaper}》${year}年${Number(month)}月${Number(day)}日，第${Number(page)}版。`;
        },

        // 转换网络文献格式
        web: (text) => {
            // 匹配 GB/T7714-2015 格式的网络文献
            const pattern = /(.+)\[EB\/OL\]\.?\((\d{4})-(\d{2})-(\d{2})\)\[(\d{4})-(\d{2})-(\d{2})\]\.(.+)\./;
            const match = text.match(pattern);

            if (!match) {
                throw new Error('GB/T7714-2015网络文献格式不正确');
            }

            const [_match, title, year, month, day, _y, _m, _d, url] = match;
            return `《${title}》，载人民网${year}年${Number(month)}月${Number(day)}日，${url}。`;
        }
    },

    // 识别 GB/T7714-2015 格式类型
    identifyGBType: (text) => {
        if (text.includes('[D]')) {
            return 'thesis';
        } else if (text.includes('[N]')) {
            return 'newspaper';
        } else if (text.includes('[EB/OL]')) {
            return 'web';
        } else if (text.includes('[J]')) {
            return 'journal';
        } else if (text.includes('[M]')) {
            return 'book';
        } else {
            throw new Error('无法识别的GB/T7714-2015格式类型');
        }
    },

    // 主转换函数
    convert: (text, direction = 'law2gb', options = {}) => {
        // 更新配置
        converter.setConfig(options);
        
        try {
            if (direction === 'law2gb') {
                const type = converter.identifyType(text);
                switch (type) {
                    case 'book':
                        return converter.convertBook(text);
                    case 'journal':
                        return converter.convertJournal(text);
                    case 'thesis':
                        return converter.convertThesis(text);
                    case 'newspaper':
                        return converter.convertNewspaper(text);
                    case 'web':
                        return converter.convertWeb(text);
                    default:
                        throw new Error('无法识别的文献类型');
                }
            } else {
                const type = converter.identifyGBType(text);
                // 确保在调用转换方法前已经设置了正确的配置
                switch (type) {
                    case 'book':
                        return converter.convertGBToLaw.book(text);
                    case 'journal':
                        return converter.convertGBToLaw.journal(text);
                    case 'thesis':
                        return converter.convertGBToLaw.thesis(text);
                    case 'newspaper':
                        return converter.convertGBToLaw.newspaper(text);
                    case 'web':
                        return converter.convertGBToLaw.web(text);
                    default:
                        throw new Error('无法识别的文献类型');
                }
            }
        } catch (error) {
            throw error;
        }
    },

    // 批量转换
    convertBatch: (text, direction = 'law2gb', options = {}) => {
        // 更新配置
        converter.setConfig(options);

        const lines = text.split('\n').filter(line => line.trim());
        const results = [];
        const errors = [];

        lines.forEach((line, index) => {
            try {
                const result = converter.convert(line.trim(), direction);
                results.push(result);
            } catch (error) {
                errors.push(`第 ${index + 1} 行: ${error.message}`);
            }
        });

        return {
            results: results.join('\n'),
            errors: errors
        };
    }
}; 