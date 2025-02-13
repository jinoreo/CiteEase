import { CONVERSION_DIRECTIONS } from '../config/constants.js';
import { convertAuthorsToGB, convertAuthorsToLaw } from '../utils/stringUtils.js';

export class NewspaperConverter {
    static convert(text, direction, config) {
        const pattern = direction === CONVERSION_DIRECTIONS.LAW_TO_GB
            ? /(.+)：《(.+)》，载《(.+)》(\d{4})年(\d+)月(\d+)日，第(\d+)版。/
            : /(.+)\.(.+)\[N\]\.(.+),(\d{4})-(\d{2})-(\d{2})\((\d{3})\)\./;

        const match = text.match(pattern);
        if (!match) {
            throw new Error('报纸格式不正确');
        }

        return direction === CONVERSION_DIRECTIONS.LAW_TO_GB
            ? this.toGB(match, config)
            : this.toLaw(match, config);
    }

    static toGB(match, config) {
        const [_, author, title, newspaper, year, month, day, page] = match;
        const formattedAuthor = convertAuthorsToGB(author);
        return `${formattedAuthor}.${title}[N].${newspaper},${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}(${page.padStart(3, '0')}).`;
    }

    static toLaw(match, config) {
        const [_, author, title, newspaper, year, month, day, page] = match;
        const formattedAuthor = convertAuthorsToLaw(author);
        return `${formattedAuthor}：《${title}》，载《${newspaper}》${year}年${Number(month)}月${Number(day)}日，第${Number(page)}版。`;
    }
} 