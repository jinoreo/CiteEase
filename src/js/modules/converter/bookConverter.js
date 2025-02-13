import { convertAuthorsToGB, convertAuthorsToLaw } from '../utils/stringUtils.js';
import { CONVERSION_DIRECTIONS } from '../config/constants.js';
import { getPublisherCity } from '../utils/publisherMap.js';

export class BookConverter {
    static convert(text, direction, config) {
        const patterns = direction === CONVERSION_DIRECTIONS.LAW_TO_GB ? this.lawPatterns : this.gbPatterns;
        
        let match;
        for (const pattern of patterns) {
            match = text.match(pattern);
            if (match) break;
        }

        if (!match) {
            throw new Error('图书格式不正确');
        }

        return direction === CONVERSION_DIRECTIONS.LAW_TO_GB 
            ? this.toGB(match, config)
            : this.toLaw(match, config);
    }

    static lawPatterns = [
        // 带页码
        /^(?:\[(\d+)\])?\s*(.+?)：《(.+?)》，(.+?)出版社(\d{4})年版，第(\d+)页。$/,
        // 不带页码
        /^(?:\[(\d+)\])?\s*(.+?)：《(.+?)》，(.+?)出版社(\d{4})年版。$/
    ];

    static gbPatterns = [
        // 带页码
        /^(.+?)[．.]\s*(.+?)\s*\[M\][．.]\s*(?:([^:：]+)[：:])?(.+?)出版社[，,](\d{4})[：:](\d+)[．.]\s*$/
    ];

    static toGB(match, config) {
        console.log('GB match:', match); // 添加调试日志
        const hasCityInfo = match[3] !== undefined;
        
        let author, title, city, publisher, year, page;
        
        if (hasCityInfo) {
            [_, author, title, city, publisher, year, page] = match;
        } else {
            [_, author, title, publisher, year, page] = match;
        }

        const formattedAuthor = convertAuthorsToGB(author);
        const cityInfo = hasCityInfo ? city : getPublisherCity(publisher);
        const publisherInfo = cityInfo 
            ? `${cityInfo}:${publisher}出版社`
            : `${publisher}出版社`;
        
        return `${formattedAuthor}.${title}[M].${publisherInfo},${year}:${page}.`;
    }

    static toLaw(match, config) {
        console.log('Law match:', match); // 添加调试日志
        const hasCityInfo = match[3] !== undefined;
        
        let author, title, publisher, year, page;
        
        if (hasCityInfo) {
            [_, author, title, _city, publisher, year, page] = match;
        } else {
            [_, author, title, publisher, year, page] = match;
        }

        const formattedAuthor = convertAuthorsToLaw(author);
        return `${formattedAuthor}：《${title}》，${publisher}出版社${year}年版，第${page}页。`;
    }
} 