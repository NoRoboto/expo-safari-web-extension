// QuickTranslate Core Translation Engine
// Handles text detection, translation API calls, and language management

class TranslatorCore {
    constructor() {
        this.supportedLanguages = {
            'auto': 'Detect Language',
            'en': 'English',
            'es': 'Spanish', 
            'fr': 'French',
            'de': 'German',
            'it': 'Italian',
            'pt': 'Portuguese',
            'ru': 'Russian',
            'ja': 'Japanese',
            'ko': 'Korean',
            'zh': 'Chinese (Simplified)',
            'zh-tw': 'Chinese (Traditional)',
            'ar': 'Arabic',
            'hi': 'Hindi',
            'nl': 'Dutch',
            'sv': 'Swedish',
            'da': 'Danish',
            'no': 'Norwegian',
            'fi': 'Finnish',
            'pl': 'Polish',
            'tr': 'Turkish',
            'he': 'Hebrew',
            'th': 'Thai',
            'vi': 'Vietnamese'
        };

        this.translationCache = new Map();
        this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
    }

    // Detect language of given text
    async detectLanguage(text) {
        if (!text || text.trim().length < 3) {
            return 'en'; // Default to English for very short text
        }

        // Simple language detection patterns
        const patterns = {
            'zh': /[\u4e00-\u9fff]/,
            'ja': /[\u3040-\u309f\u30a0-\u30ff]/,
            'ko': /[\uac00-\ud7af]/,
            'ar': /[\u0600-\u06ff]/,
            'ru': /[\u0400-\u04ff]/,
            'he': /[\u0590-\u05ff]/,
            'th': /[\u0e00-\u0e7f]/,
            'hi': /[\u0900-\u097f]/
        };

        for (const [lang, pattern] of Object.entries(patterns)) {
            if (pattern.test(text)) {
                return lang;
            }
        }

        // For Latin-based languages, use simple word patterns
        const words = text.toLowerCase().split(/\s+/).slice(0, 10);
        
        const commonWords = {
            'es': ['el', 'la', 'de', 'que', 'y', 'en', 'un', 'es', 'se', 'no', 'te', 'lo', 'le', 'da', 'su', 'por', 'son', 'con', 'para', 'del'],
            'fr': ['le', 'de', 'et', 'à', 'un', 'il', 'être', 'et', 'en', 'avoir', 'que', 'pour', 'dans', 'ce', 'son', 'une', 'sur', 'avec', 'ne', 'se'],
            'de': ['der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das', 'mit', 'sich', 'des', 'auf', 'für', 'ist', 'im', 'dem', 'nicht', 'ein', 'eine', 'als'],
            'it': ['il', 'di', 'che', 'e', 'la', 'il', 'un', 'a', 'per', 'non', 'in', 'da', 'su', 'con', 'dei', 'del', 'le', 'al', 'si', 'dei'],
            'pt': ['o', 'de', 'e', 'do', 'da', 'em', 'um', 'para', 'é', 'com', 'não', 'uma', 'os', 'no', 'se', 'na', 'por', 'mais', 'as', 'dos']
        };

        let maxMatches = 0;
        let detectedLang = 'en';

        for (const [lang, commonWordList] of Object.entries(commonWords)) {
            const matches = words.filter(word => commonWordList.includes(word)).length;
            if (matches > maxMatches) {
                maxMatches = matches;
                detectedLang = lang;
            }
        }

        return maxMatches > 0 ? detectedLang : 'en';
    }

    // Generate cache key for translation
    getCacheKey(text, fromLang, toLang) {
        return `${fromLang}-${toLang}-${text.substring(0, 100)}`;
    }

    // Check if translation is cached and still valid
    getCachedTranslation(text, fromLang, toLang) {
        const cacheKey = this.getCacheKey(text, fromLang, toLang);
        const cached = this.translationCache.get(cacheKey);
        
        if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
            return cached.translation;
        }
        
        return null;
    }

    // Cache translation result
    cacheTranslation(text, fromLang, toLang, translation) {
        const cacheKey = this.getCacheKey(text, fromLang, toLang);
        this.translationCache.set(cacheKey, {
            translation,
            timestamp: Date.now()
        });

        // Limit cache size to prevent memory issues
        if (this.translationCache.size > 1000) {
            const oldestKey = this.translationCache.keys().next().value;
            this.translationCache.delete(oldestKey);
        }
    }

    // Main translation function
    async translate(text, fromLang = 'auto', toLang = 'en') {
        if (!text || !text.trim()) {
            throw new Error('No text provided for translation');
        }

        if (fromLang === toLang) {
            return text;
        }

        // Clean and prepare text
        const cleanText = text.trim().substring(0, 5000); // Limit text length

        // Auto-detect language if needed
        if (fromLang === 'auto') {
            fromLang = await this.detectLanguage(cleanText);
            
            // If detected language is same as target, return original
            if (fromLang === toLang) {
                return cleanText;
            }
        }

        // Check cache first
        const cached = this.getCachedTranslation(cleanText, fromLang, toLang);
        if (cached) {
            return cached;
        }

        // Try multiple translation services
        const translationServices = [
            () => this.translateWithMyMemory(cleanText, fromLang, toLang),
            () => this.translateWithLibreTranslate(cleanText, fromLang, toLang),
            () => this.translateWithMicrosoft(cleanText, fromLang, toLang)
        ];

        for (const service of translationServices) {
            try {
                const translation = await service();
                if (translation && translation.trim()) {
                    // Cache successful translation
                    this.cacheTranslation(cleanText, fromLang, toLang, translation);
                    return translation;
                }
            } catch (error) {
                console.warn('Translation service failed:', error);
            }
        }

        throw new Error('All translation services failed');
    }

    // MyMemory Translation API (free, no key required)
    async translateWithMyMemory(text, fromLang, toLang) {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${fromLang}|${toLang}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`MyMemory API error: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.responseStatus === 200 && data.responseData && data.responseData.translatedText) {
            return data.responseData.translatedText;
        }

        throw new Error('MyMemory translation failed');
    }

    // LibreTranslate API (self-hosted or public instances)
    async translateWithLibreTranslate(text, fromLang, toLang) {
        // Using public LibreTranslate instance - in production, consider self-hosting
        const url = 'https://libretranslate.de/translate';
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                q: text,
                source: fromLang === 'auto' ? 'auto' : fromLang,
                target: toLang,
                format: 'text'
            })
        });

        if (!response.ok) {
            throw new Error(`LibreTranslate API error: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.translatedText) {
            return data.translatedText;
        }

        throw new Error('LibreTranslate translation failed');
    }

    // Microsoft Translator API (requires API key)
    async translateWithMicrosoft(text, fromLang, toLang) {
        // This would require an API key from Azure Cognitive Services
        // For now, return a placeholder
        throw new Error('Microsoft Translator requires API key configuration');
    }

    // Utility function to clean text for translation
    cleanTextForTranslation(text) {
        return text
            .trim()
            .replace(/\s+/g, ' ') // Normalize whitespace
            .replace(/\n{3,}/g, '\n\n') // Limit consecutive newlines
            .substring(0, 5000); // Limit length
    }

    // Get list of supported languages
    getSupportedLanguages() {
        return { ...this.supportedLanguages };
    }

    // Check if language is supported
    isLanguageSupported(langCode) {
        return langCode in this.supportedLanguages;
    }

    // Convert language name to code
    getLanguageCode(languageName) {
        for (const [code, name] of Object.entries(this.supportedLanguages)) {
            if (name.toLowerCase() === languageName.toLowerCase()) {
                return code;
            }
        }
        return null;
    }

    // Get language name from code
    getLanguageName(langCode) {
        return this.supportedLanguages[langCode] || langCode;
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TranslatorCore;
} else if (typeof window !== 'undefined') {
    window.TranslatorCore = TranslatorCore;
}