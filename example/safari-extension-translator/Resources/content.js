// QuickTranslate Content Script

(function() {
    'use strict';
    
    console.log('QuickTranslate content script loaded on:', window.location.hostname);
    
    let isTranslating = false;
    let translationPopup = null;
    let settings = null;
    
    // Load extension settings
    loadSettings();
    
    async function loadSettings() {
        try {
            settings = await browser.runtime.sendMessage({ action: 'getSettings' });
        } catch (error) {
            console.warn('Could not load QuickTranslate settings:', error);
            settings = {
                showPopup: true,
                defaultFromLang: 'auto',
                defaultToLang: 'en'
            };
        }
    }
    
    // Listen for text selection
    document.addEventListener('mouseup', function(e) {
        if (!settings || !settings.showPopup) return;
        
        setTimeout(() => {
            const selectedText = window.getSelection().toString().trim();
            if (selectedText.length > 3 && selectedText.length < 500) {
                showTranslationButton(e.pageX, e.pageY, selectedText);
            } else {
                hideTranslationButton();
            }
        }, 100);
    });
    
    // Listen for messages from background/popup
    browser.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        switch(request.action) {
            case 'translateSelection':
                const selection = request.text || window.getSelection().toString().trim();
                if (selection) {
                    translateText(selection);
                }
                sendResponse({ success: true });
                break;
                
            case 'showTranslation':
                showTranslationPopup(
                    request.originalText,
                    request.translatedText,
                    request.fromLang,
                    request.toLang
                );
                sendResponse({ success: true });
                break;
                
            case 'showError':
                showErrorPopup(request.message);
                sendResponse({ success: true });
                break;
                
            case 'getSelectedText':
                const selectedText = window.getSelection().toString().trim();
                sendResponse({ text: selectedText });
                break;
                
            case 'translatePage':
                translatePageContent(request.targetLang);
                sendResponse({ success: true });
                break;
        }
        
        return true;
    });
    
    function showTranslationButton(x, y, text) {
        hideTranslationButton();
        
        const button = document.createElement('div');
        button.id = 'quicktranslate-button';
        button.style.cssText = `
            position: absolute;
            left: ${x + 10}px;
            top: ${y - 35}px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 12px;
            padding: 6px 12px;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            font-size: 11px;
            font-weight: 500;
            cursor: pointer;
            z-index: 999999;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            transition: all 0.2s ease;
        `;
        button.textContent = '🌐 Translate';
        
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            translateText(text);
            hideTranslationButton();
        });
        
        button.addEventListener('mouseenter', function() {
            button.style.transform = 'scale(1.05)';
        });
        
        button.addEventListener('mouseleave', function() {
            button.style.transform = 'scale(1)';
        });
        
        document.body.appendChild(button);
        
        // Auto-hide after 3 seconds
        setTimeout(hideTranslationButton, 3000);
    }
    
    function hideTranslationButton() {
        const existing = document.getElementById('quicktranslate-button');
        if (existing) {
            existing.remove();
        }
    }
    
    async function translateText(text) {
        if (isTranslating) return;
        isTranslating = true;
        
        showTranslationPopup(text, 'Translating...', 'auto', settings?.defaultToLang || 'en');
        
        try {
            const response = await browser.runtime.sendMessage({
                action: 'translate',
                text: text,
                from: settings?.defaultFromLang || 'auto',
                to: settings?.defaultToLang || 'en'
            });
            
            isTranslating = false;
            
            if (response && response.success) {
                updateTranslationPopup(text, response.translation, response.fromLang, response.toLang);
            } else {
                updateTranslationPopup(text, response?.error || 'Translation failed', null, null);
            }
        } catch (error) {
            isTranslating = false;
            console.error('Translation error:', error);
            updateTranslationPopup(text, 'Translation service unavailable', null, null);
        }
    }
    
    function showTranslationPopup(originalText, translatedText, fromLang, toLang) {
        hideTranslationPopup();
        
        const popup = document.createElement('div');
        popup.id = 'quicktranslate-popup';
        popup.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 320px;
            max-width: 90vw;
            background: white;
            color: #333;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.15);
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            font-size: 14px;
            z-index: 1000000;
            line-height: 1.5;
            border: 1px solid #e2e8f0;
        `;
        
        popup.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 12px 16px;
                border-radius: 12px 12px 0 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <strong style="font-size: 14px; font-weight: 600;">QuickTranslate</strong>
                <button id="close-translation" style="
                    background: rgba(255,255,255,0.2);
                    border: none;
                    color: white;
                    cursor: pointer;
                    padding: 4px 8px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 500;
                ">✕</button>
            </div>
            
            <div style="padding: 16px;">
                <div style="margin-bottom: 12px;">
                    <div style="
                        font-size: 11px;
                        color: #718096;
                        text-transform: uppercase;
                        font-weight: 600;
                        letter-spacing: 0.5px;
                        margin-bottom: 4px;
                    ">Original ${fromLang && fromLang !== 'auto' ? `(${fromLang.toUpperCase()})` : ''}</div>
                    <div id="original-text" style="
                        background: #f7fafc;
                        padding: 8px 12px;
                        border-radius: 6px;
                        border-left: 3px solid #667eea;
                        word-wrap: break-word;
                    ">${originalText}</div>
                </div>
                
                <div>
                    <div style="
                        font-size: 11px;
                        color: #718096;
                        text-transform: uppercase;
                        font-weight: 600;
                        letter-spacing: 0.5px;
                        margin-bottom: 4px;
                    ">Translation ${toLang ? `(${toLang.toUpperCase()})` : ''}</div>
                    <div id="translated-text" style="
                        background: #f0fff4;
                        padding: 8px 12px;
                        border-radius: 6px;
                        border-left: 3px solid #48bb78;
                        word-wrap: break-word;
                        min-height: 20px;
                    ">${translatedText}</div>
                </div>
                
                ${translatedText !== 'Translating...' && !translatedText.includes('failed') ? `
                    <div style="margin-top: 12px; display: flex; gap: 8px;">
                        <button id="copy-translation" style="
                            background: #e2e8f0;
                            border: none;
                            color: #4a5568;
                            padding: 6px 12px;
                            border-radius: 6px;
                            font-size: 12px;
                            cursor: pointer;
                            font-weight: 500;
                        ">Copy</button>
                        <button id="speak-translation" style="
                            background: #e2e8f0;
                            border: none;
                            color: #4a5568;
                            padding: 6px 12px;
                            border-radius: 6px;
                            font-size: 12px;
                            cursor: pointer;
                            font-weight: 500;
                        ">🔊</button>
                    </div>
                ` : ''}
            </div>
        `;
        
        document.body.appendChild(popup);
        translationPopup = popup;
        
        // Event listeners
        document.getElementById('close-translation').addEventListener('click', hideTranslationPopup);
        
        const copyBtn = document.getElementById('copy-translation');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => copyToClipboard(translatedText));
        }
        
        const speakBtn = document.getElementById('speak-translation');
        if (speakBtn) {
            speakBtn.addEventListener('click', () => speakText(translatedText, toLang));
        }
        
        // Auto-hide after 15 seconds
        setTimeout(hideTranslationPopup, 15000);
    }
    
    function updateTranslationPopup(originalText, translatedText, fromLang, toLang) {
        if (translationPopup) {
            const translatedEl = document.getElementById('translated-text');
            if (translatedEl) {
                translatedEl.textContent = translatedText;
                
                // Update language labels if available
                if (fromLang && fromLang !== 'auto') {
                    const originalLabel = translationPopup.querySelector('.lang-label-original');
                    if (originalLabel) {
                        originalLabel.textContent = `Original (${fromLang.toUpperCase()})`;
                    }
                }
            }
            
            // Re-add action buttons if translation was successful
            if (!translatedText.includes('failed') && !translatedText.includes('Translating')) {
                const actionsDiv = translationPopup.querySelector('.actions');
                if (!actionsDiv) {
                    const container = translationPopup.querySelector('div[style*="padding: 16px"]');
                    const actionsHTML = `
                        <div class="actions" style="margin-top: 12px; display: flex; gap: 8px;">
                            <button id="copy-translation-updated" style="
                                background: #e2e8f0; border: none; color: #4a5568;
                                padding: 6px 12px; border-radius: 6px; font-size: 12px;
                                cursor: pointer; font-weight: 500;
                            ">Copy</button>
                            <button id="speak-translation-updated" style="
                                background: #e2e8f0; border: none; color: #4a5568;
                                padding: 6px 12px; border-radius: 6px; font-size: 12px;
                                cursor: pointer; font-weight: 500;
                            ">🔊</button>
                        </div>
                    `;
                    container.insertAdjacentHTML('beforeend', actionsHTML);
                    
                    document.getElementById('copy-translation-updated').addEventListener('click', 
                        () => copyToClipboard(translatedText));
                    document.getElementById('speak-translation-updated').addEventListener('click', 
                        () => speakText(translatedText, toLang));
                }
            }
        }
    }
    
    function showErrorPopup(message) {
        showTranslationPopup('Error', message, null, null);
    }
    
    function hideTranslationPopup() {
        if (translationPopup) {
            translationPopup.remove();
            translationPopup = null;
        }
    }
    
    function copyToClipboard(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                showNotification('Copied to clipboard!');
            });
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showNotification('Copied to clipboard!');
        }
    }
    
    function speakText(text, lang) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            if (lang) {
                utterance.lang = lang;
            }
            speechSynthesis.speak(utterance);
        } else {
            showNotification('Speech synthesis not supported');
        }
    }
    
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #48bb78;
            color: white;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 12px;
            z-index: 1000001;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 2000);
    }
    
    async function translatePageContent(targetLang) {
        // Simple page translation - translate main text content
        const textNodes = [];
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    if (node.parentElement.tagName.match(/SCRIPT|STYLE|NOSCRIPT/i)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    if (node.textContent.trim().length > 10) {
                        return NodeFilter.FILTER_ACCEPT;
                    }
                    return NodeFilter.FILTER_REJECT;
                }
            }
        );
        
        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }
        
        showNotification(`Translating ${textNodes.length} text sections...`);
        
        // Translate in batches to avoid overwhelming the API
        for (let i = 0; i < Math.min(textNodes.length, 20); i++) {
            const textNode = textNodes[i];
            const originalText = textNode.textContent.trim();
            
            if (originalText.length > 10 && originalText.length < 200) {
                try {
                    const response = await browser.runtime.sendMessage({
                        action: 'translate',
                        text: originalText,
                        from: 'auto',
                        to: targetLang
                    });
                    
                    if (response && response.success) {
                        textNode.textContent = response.translation;
                    }
                } catch (error) {
                    console.warn('Page translation error:', error);
                }
                
                // Small delay between translations
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        showNotification('Page translation completed!');
    }
    
    // Hide popup when clicking outside
    document.addEventListener('click', function(e) {
        if (translationPopup && !translationPopup.contains(e.target)) {
            hideTranslationPopup();
        }
        // Also hide translation button
        hideTranslationButton();
    });
    
    // Hide popup on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            hideTranslationPopup();
            hideTranslationButton();
        }
    });
    
})();