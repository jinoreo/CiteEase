import { CONVERSION_DIRECTIONS } from '../config/constants.js';

export class ThesisConverter {
    static convert(text, direction, config) {
        const pattern = direction === CONVERSION_DIRECTIONS.LAW_TO_GB
            ? /(.+)：《(.+)》，(.+)(\d{4})年(博士|硕士)学位论文，第(\d+)页。/
            : /(.+)\.(.+)\[D\]\.(.+),(\d{4}):(\d+)\./;

        const match = text.match(pattern);
        if (!match) {
            throw new Error('学位论文格式不正确');
        }

        return direction === CONVERSION_DIRECTIONS.LAW_TO_GB
            ? this.toGB(match)
            : this.toLaw(match);
    }

    static toGB(match) {
        const [_, author, title, school, year, degree, page] = match;
        return `${author}.${title}[D].${school},${year}:${page}.`;
    }

    static toLaw(match) {
        const [_, author, title, school, year, page] = match;
        return `${author}：《${title}》，${school}${year}年博士学位论文，第${page}页。`;
    }
} 