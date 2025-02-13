import { BookConverter } from './bookConverter.js';
import { JournalConverter } from './journalConverter.js';
import { ThesisConverter } from './thesisConverter.js';
import { NewspaperConverter } from './newspaperConverter.js';
import { WebConverter } from './webConverter.js';
import { DEFAULT_CONFIG, CITATION_TYPES } from '../config/constants.js';
import formatDetector from '../formatDetector/index.js';

class CitationConverter {
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    setConfig(options) {
        if (options.hasOwnProperty('keepNumbers')) {
            options.keepNumbers = !options.keepNumbers;
        }
        this.config = { ...this.config, ...options };
    }

    convert(text, direction, options = {}) {
        this.setConfig(options);
        
        try {
            const type = formatDetector.identifyType(text, direction);
            return this.convertByType(text, type, direction);
        } catch (error) {
            throw error;
        }
    }

    convertByType(text, type, direction) {
        switch (type) {
            case CITATION_TYPES.BOOK:
                return BookConverter.convert(text, direction, this.config);
            case CITATION_TYPES.JOURNAL:
                return JournalConverter.convert(text, direction, this.config);
            case CITATION_TYPES.THESIS:
                return ThesisConverter.convert(text, direction, this.config);
            case CITATION_TYPES.NEWSPAPER:
                return NewspaperConverter.convert(text, direction, this.config);
            case CITATION_TYPES.WEB:
                return WebConverter.convert(text, direction, this.config);
            default:
                throw new Error('不支持的文献类型');
        }
    }
}

export default new CitationConverter(); 