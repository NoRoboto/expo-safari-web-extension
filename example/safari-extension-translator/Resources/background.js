// QuickTranslate Background Script
// Compatible with non-persistent background pages (required for Safari iOS)

// DEMO PLACEHOLDER - Translation service not implemented
// In a real implementation, this would connect to a translation API service
async function translateText(text, fromLang = 'auto', toLang = 'en') {
    if (!text || !text.trim()) {
        throw new Error('No text provided for translation');
    }

    if (fromLang === toLang) {
        return text;
    }

    const cleanText = text.trim().substring(0, 5000);
    
    // Auto-detect language if needed (simple detection)
    if (fromLang === 'auto') {
        fromLang = detectLanguage(cleanText);
        if (fromLang === toLang) {
            return cleanText;
        }
    }

    console.log(`[QuickTranslate DEMO] Translating "${cleanText.substring(0, 30)}..." from ${fromLang} to ${toLang}`);

    // Simulate API delay for realistic demo experience
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));

    return generateDemoTranslation(cleanText, fromLang, toLang);
}

// PLACEHOLDER: Demo translation generator
// TODO: Replace with real translation API (Google Translate, DeepL, etc.)
function generateDemoTranslation(text, fromLang, toLang) {
    console.log('[QuickTranslate DEMO] Generating placeholder translation');
    
    // DEMO: Limited translation dictionary for showcase purposes
    // This is a placeholder - real implementation would use translation APIs
    const demoTranslations = {
        'en-es': {
            'hello': 'hola', 'world': 'mundo', 'good': 'bueno', 'bad': 'malo', 'yes': 'sí', 'no': 'no',
            'thank you': 'gracias', 'please': 'por favor', 'today': 'hoy', 'water': 'agua', 'house': 'casa'
        },
        'es-en': {
            'hola': 'hello', 'mundo': 'world', 'bueno': 'good', 'malo': 'bad', 'sí': 'yes', 'no': 'no',
            'gracias': 'thank you', 'por favor': 'please', 'hoy': 'today', 'agua': 'water', 'casa': 'house'
        },
        'en-fr': {
            'hello': 'bonjour', 'world': 'monde', 'good': 'bon', 'bad': 'mauvais', 'yes': 'oui', 'no': 'non'
        },
        'en-de': {
            'hello': 'hallo', 'world': 'welt', 'good': 'gut', 'bad': 'schlecht', 'yes': 'ja', 'no': 'nein'
        }
    };

    // Lorem ipsum generator for unknown text
    const loremWords = [
        'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do',
        'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua', 'enim',
        'ad', 'minim', 'veniam', 'quis', 'nostrud', 'exercitation', 'ullamco', 'laboris', 'nisi',
        'aliquip', 'ex', 'ea', 'commodo', 'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit',
        'voluptate', 'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
        'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia', 'deserunt',
        'mollit', 'anim', 'id', 'est', 'laborum'
    ];

    const langPair = `${fromLang}-${toLang}`;
    const langTranslations = demoTranslations[langPair];
    
    // Language names for display
    const languageNames = {
        'en': 'English', 'es': 'Spanish', 'fr': 'French', 'de': 'German', 'it': 'Italian',
        'pt': 'Portuguese', 'ru': 'Russian', 'ja': 'Japanese', 'ko': 'Korean', 'zh': 'Chinese',
        'ar': 'Arabic', 'hi': 'Hindi', 'th': 'Thai', 'vi': 'Vietnamese', 'nl': 'Dutch'
    };
    
    const fromName = languageNames[fromLang] || fromLang.toUpperCase();
    const toName = languageNames[toLang] || toLang.toUpperCase();
    
    // If no translation dictionary available, generate Lorem ipsum
    if (!langTranslations) {
        const wordCount = text.split(/\s+/).length;
        const loremText = generateLoremIpsum(wordCount);
        return `[DEMO ${fromName} → ${toName}] ${loremText}`;
    }

    // Try basic word/phrase replacement for known words
    let translatedText = text;
    const sortedPhrases = Object.keys(langTranslations).sort((a, b) => b.length - a.length);
    
    for (const phrase of sortedPhrases) {
        const translation = langTranslations[phrase];
        const regex = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        translatedText = translatedText.replace(regex, (match) => {
            // Preserve case
            if (match === match.toUpperCase()) return translation.toUpperCase();
            if (match[0] === match[0].toUpperCase()) return translation.charAt(0).toUpperCase() + translation.slice(1);
            return translation;
        });
    }
    
    // If no known words were found, generate lorem ipsum placeholder
    if (translatedText === text) {
        const wordCount = text.split(/\s+/).length;
        const loremText = generateLoremIpsum(wordCount);
        return `[DEMO ${fromName} → ${toName}] ${loremText}`;
    }
    
    // For partially translated text, indicate it's a demo
    return `[DEMO] ${translatedText}`;

    // Helper function to generate lorem ipsum
    function generateLoremIpsum(wordCount) {
        const result = [];
        for (let i = 0; i < Math.min(wordCount, 20); i++) {
            const randomIndex = Math.floor(Math.random() * loremWords.length);
            result.push(loremWords[randomIndex]);
        }
        return result.join(' ');
    }
}

// Simple language detection function
function detectLanguage(text) {
    if (!text || text.trim().length < 3) {
        return 'en';
    }

    // Simple patterns for major languages
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

    // For Latin-based languages, check common words
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

// Initialize extension
browser.runtime.onInstalled.addListener(function() {
    // Create context menu
    browser.contextMenus.create({
        id: 'translate-selection',
        title: 'Translate "%s"',
        contexts: ['selection']
    });
    
    // Initialize default settings
    browser.storage.local.get(['defaultFromLang', 'defaultToLang', 'autoTranslate'], function(result) {
        if (result.defaultFromLang === undefined) {
            browser.storage.local.set({
                defaultFromLang: 'auto',
                defaultToLang: 'en',
                autoTranslate: true,
                showPopup: true,
                enableCache: true,
                translationDelay: 1000,
                primaryService: 'mymemory',
                enableFallback: true
            });
        }
    });
    
    console.log('QuickTranslate extension installed');
});

// Helper function to get settings from storage
async function getSettings() {
    return new Promise((resolve) => {
        browser.storage.local.get([
            'defaultFromLang',
            'defaultToLang',
            'autoTranslate',
            'showPopup', 
            'enableCache',
            'translationDelay',
            'primaryService',
            'enableFallback'
        ], function(result) {
            resolve({
                defaultFromLang: result.defaultFromLang || 'auto',
                defaultToLang: result.defaultToLang || 'en',
                autoTranslate: result.autoTranslate !== false,
                showPopup: result.showPopup !== false,
                enableCache: result.enableCache !== false,
                translationDelay: result.translationDelay || 1000,
                primaryService: result.primaryService || 'mymemory',
                enableFallback: result.enableFallback !== false
            });
        });
    });
}

// Context menu handler
browser.contextMenus.onClicked.addListener(async function(info, tab) {
    if (info.menuItemId === 'translate-selection' && info.selectionText) {
        const settings = await getSettings();
        
        try {
            const translation = await translateText(
                info.selectionText,
                settings.defaultFromLang,
                settings.defaultToLang
            );
            
            // Send translation to content script for display
            browser.tabs.sendMessage(tab.id, {
                action: 'showTranslation',
                originalText: info.selectionText,
                translatedText: translation,
                fromLang: settings.defaultFromLang,
                toLang: settings.defaultToLang
            });
            
        } catch (error) {
            console.error('Translation failed:', error);
            browser.tabs.sendMessage(tab.id, {
                action: 'showError',
                message: 'Translation failed: ' + error.message
            });
        }
    }
});

// Keyboard shortcuts
browser.commands.onCommand.addListener(async function(command) {
    if (command === 'translate-selection') {
        browser.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            if (tabs[0]) {
                browser.tabs.sendMessage(tabs[0].id, {
                    action: 'translateSelection'
                });
            }
        });
    }
});

// Message handler - async to work with storage and translation
browser.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    // Handle async operations
    handleMessage(request, sender).then(sendResponse);
    return true; // Keep message channel open for async response
});

async function handleMessage(request, sender) {
    switch(request.action) {
        case 'translate':
            try {
                const translation = await translateText(
                    request.text,
                    request.from || 'auto',
                    request.to || 'en'
                );
                
                // Update translation statistics
                await updateTranslationStats(request.from, request.to);
                
                return {
                    success: true,
                    translation: translation,
                    fromLang: request.from,
                    toLang: request.to
                };
                
            } catch (error) {
                console.error('Translation error:', error);
                return {
                    success: false,
                    error: error.message || 'Translation failed'
                };
            }
            
        case 'detectLanguage':
            try {
                const detectedLang = detectLanguage(request.text);
                return {
                    success: true,
                    language: detectedLang
                };
            } catch (error) {
                return {
                    success: false,
                    error: error.message
                };
            }
            
        case 'getSettings':
            const settings = await getSettings();
            return settings;
            
        case 'saveSettings':
            return new Promise((resolve) => {
                browser.storage.local.set(request.settings, function() {
                    resolve({ success: true });
                });
            });
            
        case 'getStats':
            return new Promise((resolve) => {
                browser.storage.local.get(['translationStats'], function(result) {
                    resolve(result.translationStats || {
                        total: 0,
                        today: 0,
                        languages: {}
                    });
                });
            });
            
        default:
            return { error: 'Unknown action' };
    }
}

// Update translation statistics
async function updateTranslationStats(fromLang, toLang) {
    return new Promise((resolve) => {
        browser.storage.local.get(['translationStats'], function(result) {
            const stats = result.translationStats || {
                total: 0,
                today: 0,
                lastDate: new Date().toDateString(),
                languages: {}
            };
            
            // Reset daily count if it's a new day
            const today = new Date().toDateString();
            if (stats.lastDate !== today) {
                stats.today = 0;
                stats.lastDate = today;
            }
            
            // Update counters
            stats.total++;
            stats.today++;
            
            // Update language usage
            const langPair = `${fromLang}-${toLang}`;
            stats.languages[langPair] = (stats.languages[langPair] || 0) + 1;
            
            // Save updated stats
            browser.storage.local.set({ translationStats: stats }, resolve);
        });
    });
}

// Handle background script startup (for non-persistent background pages)
browser.runtime.onStartup.addListener(function() {
    console.log('QuickTranslate background script started');
});

console.log('QuickTranslate background script loaded (non-persistent)');