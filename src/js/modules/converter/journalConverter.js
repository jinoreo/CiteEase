import { convertAuthorsToGB, convertAuthorsToLaw, formatIssueNumber } from '../utils/stringUtils.js';
import { CONVERSION_DIRECTIONS } from '../config/constants.js';

export class JournalConverter {
    static convert(text, direction, config) {
        const patterns = direction === CONVERSION_DIRECTIONS.LAW_TO_GB ? this.lawPatterns : this.gbPatterns;
        
        let match;
        for (const pattern of patterns) {
            match = text.match(pattern);
            if (match) break;
        }

        if (!match) {
            throw new Error('期刊格式不正确');
        }

        return direction === CONVERSION_DIRECTIONS.LAW_TO_GB 
            ? this.toGB(match, config)
            : this.toLaw(match, config);
    }

    static lawPatterns = [
        // 带范围页码和加号页码
        /^(?:\[(\d+)\])?(.*?)：《(.*?)》，载《(.*?)》(\d{4})年第(\d+)期，第(\d+)-(\d+)\+(\d+)页。$/,
        // 带范围页码
        /^(?:\[(\d+)\])?(.*?)：《(.*?)》，载《(.*?)》(\d{4})年第(\d+)期，第(\d+)-(\d+)页。$/,
        // 带单页码
        /^(?:\[(\d+)\])?(.*?)：《(.*?)》，载《(.*?)》(\d{4})年第(\d+)期，第(\d+)页。$/,
        // 不带页码
        /^(?:\[(\d+)\])?(.*?)：《(.*?)》，载《(.*?)》(\d{4})年第(\d+)期。$/
    ];

    static gbPatterns = [
        // 带范围页码和加号页码
        /^(?:\[(\d+)\])?(.*?)[．.]\s*(.*?)\s*\[J\][．.]\s*(.*?)[，,]\s*(\d{4})[，,]\s*\(?(\d+)\)?[：:]\s*(\d+)-(\d+)\+(\d+)[．.]\s*$/,
        // 带范围页码
        /^(?:\[(\d+)\])?(.*?)[．.]\s*(.*?)\s*\[J\][．.]\s*(.*?)[，,]\s*(\d{4})[，,]\s*\(?(\d+)\)?[：:]\s*(\d+)-(\d+)[．.]\s*$/,
        // 带单页码
        /^(?:\[(\d+)\])?(.*?)[．.]\s*(.*?)\s*\[J\][．.]\s*(.*?)[，,]\s*(\d{4})[，,]\s*\(?(\d+)\)?[：:]\s*(\d+)[．.]\s*$/,
        // 不带页码
        /^(?:\[(\d+)\])?(.*?)[．.]\s*(.*?)\s*\[J\][．.]\s*(.*?)[，,]\s*(\d{4})[，,]\s*\(?(\d+)\)?[．.]\s*$/
    ];

    static toGB(match, config) {
        const [_, number, author, title, journal, year, issue, startPage, endPage, extraPage] = match;
        const prefix = number && config.keepNumbers ? `[${number}]` : '';
        const formattedAuthor = convertAuthorsToGB(author);
        const formattedIssue = formatIssueNumber(issue);

        let pageInfo = '';
        if (extraPage) {
            pageInfo = `:${startPage}-${endPage}+${extraPage}`;
        } else if (endPage) {
            pageInfo = `:${startPage}-${endPage}`;
        } else if (startPage) {
            pageInfo = `:${startPage}`;
        }

        return `${prefix}${formattedAuthor}.${title}[J].${journal},${year},(${formattedIssue})${pageInfo}.`;
    }

    static toLaw(match, config) {
        const [_, number, author, title, journal, year, issue, startPage, endPage, extraPage] = match;
        const prefix = number && config.keepNumbers ? `[${number}]` : '';
        const formattedAuthor = convertAuthorsToLaw(author);

        let pageInfo = '';
        if (extraPage) {
            pageInfo = `，第${startPage}-${endPage}+${extraPage}页`;
        } else if (endPage) {
            pageInfo = `，第${startPage}-${endPage}页`;
        } else if (startPage) {
            pageInfo = `，第${startPage}页`;
        }

        return `${prefix}${formattedAuthor}：《${title}》，载《${journal}》${year}年第${Number(issue)}期${pageInfo}。`;
    }
} 