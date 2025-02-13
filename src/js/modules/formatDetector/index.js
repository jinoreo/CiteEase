import { patterns } from './patterns.js';
import { CITATION_TYPES, CONVERSION_DIRECTIONS } from '../config/constants.js';

class FormatDetector {
    identifyType(text, direction) {
        const patternSet = direction === CONVERSION_DIRECTIONS.LAW_TO_GB ? patterns.law : patterns.gb;
        
        if (text.includes('[M]') || text.includes('出版社')) {
            return CITATION_TYPES.BOOK;
        }
        if (text.includes('博士学位论文') || text.includes('硕士学位论文') || text.includes('[D]')) {
            return CITATION_TYPES.THESIS;
        }
        if (text.includes('版。') || text.includes('版．') || text.includes('版.') || text.includes('[N]')) {
            return CITATION_TYPES.NEWSPAPER;
        }
        if (text.includes('http') || text.includes('www') || text.includes('[EB/OL]')) {
            return CITATION_TYPES.WEB;
        }
        if ((text.includes('载《') || text.includes('载"')) && text.includes('期') || text.includes('[J]')) {
            return CITATION_TYPES.JOURNAL;
        }
        
        throw new Error('无法识别的文献类型');
    }
}

export default new FormatDetector(); 