document.addEventListener('DOMContentLoaded', function() {
    const fromLang = document.getElementById('fromLang');
    const toLang = document.getElementById('toLang');
    const swapBtn = document.getElementById('swapBtn');
    const inputText = document.getElementById('inputText');
    const outputText = document.getElementById('outputText');
    const translateBtn = document.getElementById('translateBtn');
    const copyBtn = document.getElementById('copyBtn');
    const clearBtn = document.getElementById('clearBtn');
    const status = document.getElementById('status');
    const translateSelection = document.getElementById('translateSelection');
    const translatePage = document.getElementById('translatePage');
    const openOptions = document.getElementById('openOptions');

    // Load saved settings
    loadSettings();

    // Event listeners
    translateBtn.addEventListener('click', translateText);
    copyBtn.addEventListener('click', copyTranslation);
    clearBtn.addEventListener('click', clearText);
    swapBtn.addEventListener('click', swapLanguages);
    translateSelection.addEventListener('click', handleTranslateSelection);
    translatePage.addEventListener('click', handleTranslatePage);
    openOptions.addEventListener('click', openOptionsPage);

    // Auto-translate on input (debounced)
    let translateTimeout;
    inputText.addEventListener('input', function() {
        clearTimeout(translateTimeout);
        if (inputText.value.trim()) {
            translateTimeout = setTimeout(translateText, 1000);
        } else {
            outputText.value = '';
            hideStatus();
        }
    });

    // Save language preferences on change
    fromLang.addEventListener('change', saveSettings);
    toLang.addEventListener('change', saveSettings);

    function loadSettings() {
        browser.storage.local.get(['fromLang', 'toLang'], function(result) {
            if (result.fromLang) fromLang.value = result.fromLang;
            if (result.toLang) toLang.value = result.toLang;
        });
    }

    function saveSettings() {
        browser.storage.local.set({
            fromLang: fromLang.value,
            toLang: toLang.value
        });
    }

    function swapLanguages() {
        if (fromLang.value === 'auto') {
            showStatus('Cannot swap when auto-detect is enabled', 'error');
            return;
        }

        const temp = fromLang.value;
        fromLang.value = toLang.value;
        toLang.value = temp;

        // Also swap the text
        const tempText = inputText.value;
        inputText.value = outputText.value;
        outputText.value = tempText;

        saveSettings();
        
        if (inputText.value.trim()) {
            translateText();
        }
    }

    async function translateText() {
        const text = inputText.value.trim();
        if (!text) {
            outputText.value = '';
            hideStatus();
            return;
        }

        if (fromLang.value === toLang.value) {
            outputText.value = text;
            showStatus('Same language selected', 'error');
            return;
        }

        showStatus('Translating...', 'loading');

        try {
            // Send message to background script for translation
            const response = await sendMessage({
                action: 'translate',
                text: text,
                from: fromLang.value,
                to: toLang.value
            });

            if (response.success) {
                outputText.value = response.translation;
                showStatus('Translation completed', 'success');
                
                // Auto-hide success message
                setTimeout(() => hideStatus(), 2000);
            } else {
                showStatus(response.error || 'Translation failed', 'error');
            }
        } catch (error) {
            console.error('Translation error:', error);
            showStatus('Translation service unavailable', 'error');
        }
    }

    function copyTranslation() {
        if (!outputText.value.trim()) {
            showStatus('Nothing to copy', 'error');
            return;
        }

        navigator.clipboard.writeText(outputText.value).then(() => {
            showStatus('Copied to clipboard', 'success');
            setTimeout(() => hideStatus(), 1500);
        }).catch(() => {
            // Fallback for older browsers
            outputText.select();
            document.execCommand('copy');
            showStatus('Copied to clipboard', 'success');
            setTimeout(() => hideStatus(), 1500);
        });
    }

    function clearText() {
        inputText.value = '';
        outputText.value = '';
        hideStatus();
        inputText.focus();
    }

    async function handleTranslateSelection() {
        try {
            // Get active tab
            const tabs = await browser.tabs.query({ active: true, currentWindow: true });
            if (tabs[0]) {
                // Send message to content script to get selected text
                const response = await browser.tabs.sendMessage(tabs[0].id, {
                    action: 'getSelectedText'
                });

                if (response && response.text) {
                    inputText.value = response.text;
                    translateText();
                } else {
                    showStatus('No text selected on page', 'error');
                }
            }
        } catch (error) {
            console.error('Error getting selected text:', error);
            showStatus('Could not access page content', 'error');
        }
    }

    async function handleTranslatePage() {
        try {
            const tabs = await browser.tabs.query({ active: true, currentWindow: true });
            if (tabs[0]) {
                await browser.tabs.sendMessage(tabs[0].id, {
                    action: 'translatePage',
                    targetLang: toLang.value
                });
                showStatus('Page translation started...', 'loading');
                
                // Close popup after initiating page translation
                setTimeout(() => window.close(), 1000);
            }
        } catch (error) {
            console.error('Error translating page:', error);
            showStatus('Could not translate page', 'error');
        }
    }

    function openOptionsPage() {
        if (browser.runtime.openOptionsPage) {
            browser.runtime.openOptionsPage();
        } else {
            browser.tabs.create({ url: browser.runtime.getURL('options.html') });
        }
        window.close();
    }

    function showStatus(message, type) {
        status.textContent = message;
        status.className = `status ${type}`;
        status.style.display = 'block';
    }

    function hideStatus() {
        status.style.display = 'none';
    }

    // Helper function to send messages to background script
    function sendMessage(message) {
        return new Promise((resolve) => {
            browser.runtime.sendMessage(message, resolve);
        });
    }

    // Focus input on load
    inputText.focus();
});