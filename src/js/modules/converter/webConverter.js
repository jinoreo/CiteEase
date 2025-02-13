import { CONVERSION_DIRECTIONS } from '../config/constants.js';

export class WebConverter {
    static convert(text, direction, config) {
        const pattern = direction === CONVERSION_DIRECTIONS.LAW_TO_GB
            ? /《(.+)》，载(.+?)(\d{4})年(\d+)月(\d+)日，(http.+?)。/
            : /(.+)\[EB\/OL\]\.?\((\d{4})-(\d{2})-(\d{2})\)\[(\d{4})-(\d{2})-(\d{2})\]\.(.+)\./;

        const match = text.match(pattern);
        if (!match) {
            throw new Error('网络文献格式不正确');
        }

        return direction === CONVERSION_DIRECTIONS.LAW_TO_GB
            ? this.toGB(match)
            : this.toLaw(match);
    }

    static toGB(match) {
        const [_, title, website, year, month, day, url] = match;
        const date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        return `${title}[EB/OL].(${date})[${date}].${url}.`;
    }

    static toLaw(match) {
        const [_, title, year, month, day, _y, _m, _d, url] = match;
        return `《${title}》，载人民网${year}年${Number(month)}月${Number(day)}日，${url}。`;
    }
} 