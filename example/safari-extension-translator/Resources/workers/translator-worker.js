// QuickTranslate Worker for background translation processing

self.addEventListener('message', function(event) {
    const { action, data } = event.data;
    
    switch(action) {
        case 'translate':
            handleTranslation(data);
            break;
        case 'detect':
            handleLanguageDetection(data);
            break;
        case 'cache':
            handleCacheOperation(data);
            break;
    }
});

async function handleTranslation(data) {
    const { text, sourceLang, targetLang, service, requestId } = data;
    
    try {
        let translation;
        
        switch(service) {
            case 'mymemory':
                translation = await translateWithMyMemory(text, sourceLang, targetLang);
                break;
            case 'google':
                translation = await translateWithGoogle(text, sourceLang, targetLang);
                break;
            default:
                throw new Error('Unknown translation service');
        }
        
        self.postMessage({
            type: 'translation_result',
            requestId: requestId,
            success: true,
            data: translation
        });
        
    } catch (error) {
        self.postMessage({
            type: 'translation_error',
            requestId: requestId,
            success: false,
            error: error.message
        });
    }
}

async function translateWithMyMemory(text, sourceLang, targetLang) {
    const langPair = sourceLang === 'auto' ? `auto|${targetLang}` : `${sourceLang}|${targetLang}`;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;
    
    const response = await fetch(url);
    const result = await response.json();
    
    if (result.responseStatus === 200) {
        return {
            text: result.responseData.translatedText,
            detectedLanguage: result.responseData.detectedLanguage || sourceLang,
            confidence: result.responseData.match || 0,
            service: 'mymemory'
        };
    } else {
        throw new Error('Translation failed: ' + result.responseDetails);
    }
}

async function translateWithGoogle(text, sourceLang, targetLang) {
    // Note: This would require API key in real implementation
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    
    const response = await fetch(url);
    const result = await response.json();
    
    if (result && result[0]) {
        let translatedText = '';
        result[0].forEach(item => {
            if (item[0]) {
                translatedText += item[0];
            }
        });
        
        return {
            text: translatedText,
            detectedLanguage: result[2] || sourceLang,
            confidence: 1.0,
            service: 'google'
        };
    } else {
        throw new Error('Google translation failed');
    }
}

async function handleLanguageDetection(data) {
    const { text, requestId } = data;
    
    try {
        const detectedLang = detectLanguage(text);
        
        self.postMessage({
            type: 'detection_result',
            requestId: requestId,
            success: true,
            data: { language: detectedLang, confidence: 0.8 }
        });
        
    } catch (error) {
        self.postMessage({
            type: 'detection_error', 
            requestId: requestId,
            success: false,
            error: error.message
        });
    }
}

function detectLanguage(text) {
    // Simple pattern-based language detection
    const patterns = {
        'en': /\b(the|and|or|but|in|on|at|to|for|with|by)\b/gi,
        'es': /\b(el|la|de|que|y|a|en|un|es|se|por|para)\b/gi,
        'fr': /\b(le|de|et|à|un|il|être|en|avoir|que|pour)\b/gi,
        'de': /\b(der|die|und|in|den|von|zu|das|mit|sich)\b/gi,
        'it': /\b(il|di|che|e|la|per|una|in|con|da)\b/gi,
        'pt': /\b(o|de|que|e|do|da|em|um|para|é|com)\b/gi,
        'ru': /\b(в|и|не|на|я|быть|с|а|как|из)\b/gi
    };
    
    let maxMatches = 0;
    let detectedLang = 'en';
    
    for (const [lang, pattern] of Object.entries(patterns)) {
        const matches = (text.match(pattern) || []).length;
        if (matches > maxMatches) {
            maxMatches = matches;
            detectedLang = lang;
        }
    }
    
    return detectedLang;
}

function handleCacheOperation(data) {
    const { operation, key, value, requestId } = data;
    
    // Simple in-memory cache for worker
    if (!self.translationCache) {
        self.translationCache = new Map();
    }
    
    switch(operation) {
        case 'set':
            self.translationCache.set(key, {
                value: value,
                timestamp: Date.now()
            });
            break;
            
        case 'get':
            const cached = self.translationCache.get(key);
            const result = cached && (Date.now() - cached.timestamp < 86400000) ? cached.value : null;
            
            self.postMessage({
                type: 'cache_result',
                requestId: requestId,
                data: result
            });
            break;
            
        case 'clear':
            self.translationCache.clear();
            break;
    }
}

console.log('QuickTranslate worker initialized');