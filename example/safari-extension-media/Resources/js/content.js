// Media Showcase Pro - Content Script
// Simple UI for testing comprehensive file type handling

(function() {
    'use strict';
    
    // Localization system
    let currentLocale = 'en';
    let localeMessages = {};
    
    // Load locale messages
    async function loadLocaleMessages(locale) {
        try {
            const response = await fetch(browser.runtime.getURL(`_locales/${locale}/messages.json`));
            const data = await response.json();
            localeMessages[locale] = data;
            return data;
        } catch (error) {
            console.log(`Failed to load locale ${locale}, falling back to en`);
            if (locale !== 'en') {
                return loadLocaleMessages('en');
            }
            return {};
        }
    }
    
    // Get localized message
    function getMessage(key) {
        const messages = localeMessages[currentLocale] || localeMessages['en'] || {};
        return messages[key]?.message || key;
    }
    
    // Change language
    function changeLanguage(locale) {
        console.log('🔄 Starting language change to:', locale);
        console.log('📂 Loading messages from:', `_locales/${locale}/messages.json`);
        currentLocale = locale;
        
        loadLocaleMessages(locale).then((messages) => {
            console.log('✅ Messages loaded for', locale, ':', Object.keys(messages).length, 'keys');
            console.log('🔗 Sample message (audioTest):', messages.audioTest?.message);
            updateModalTexts();
            console.log('🎨 Text update completed');
        }).catch(error => {
            console.error('❌ Error changing language:', error);
        });
    }
    
    // Update modal texts with current locale
    function updateModalTexts() {
        console.log('🎯 updateModalTexts called, current locale:', currentLocale);
        const modal = document.getElementById('media-showcase-modal');
        if (!modal) {
            console.log('❌ Modal not found');
            return;
        }
        
        // Update section headers
        const sections = {
            'audio-header': 'audioTest',
            'video-header': 'videoTest', 
            'image-header': 'imageTest',
            'font-header': 'fontTest',
            'data-header': 'dataPreview',
            'svg-header': 'svgGraphics'
        };
        
        console.log('🔧 Updating section headers...');
        Object.entries(sections).forEach(([id, key]) => {
            const element = document.getElementById(id);
            if (element) {
                const message = getMessage(key);
                console.log(`📝 ${id}: "${message}"`);
                element.innerHTML = `<strong>${message}</strong>`;
            } else {
                console.log(`❌ Element not found: ${id}`);
            }
        });
        
        // Update close button
        const closeBtn = document.querySelector('button[onclick*="remove"]');
        if (closeBtn) {
            closeBtn.textContent = getMessage('close');
        }
        
        // Update language selector label
        const langLabel = modal.querySelector('#language-label');
        if (langLabel) {
            langLabel.textContent = getMessage('languageSelector');
        }
        
        // Update data loading text
        const dataPreview = document.getElementById('data-preview');
        if (dataPreview && dataPreview.innerHTML.includes('loading') || dataPreview.innerHTML.includes('cargando') || dataPreview.innerHTML.includes('chargement') || dataPreview.innerHTML.includes('lade') || dataPreview.innerHTML.includes('読み込み')) {
            dataPreview.innerHTML = `<div style="font-size: 9px;">${getMessage('loadingDataFiles')}</div>`;
        }
    }
    
    console.log('🚀 Media Showcase Pro content script loaded on:', window.location.hostname);
    console.log('📱 User agent:', navigator.userAgent);
    console.log('🌐 Browser extension API available:', typeof browser !== 'undefined');
    
    // Simple badge to show extension is active
    function addMediaBadge() {
        if (document.getElementById('media-showcase-badge')) return;
        
        const badge = document.createElement('div');
        badge.id = 'media-showcase-badge';
        badge.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: white;
            color: black;
            border: 1px dashed black;
            padding: 8px 12px;
            font-family: monospace;
            font-size: 11px;
            z-index: 999999;
            cursor: pointer;
            text-transform: uppercase;
        `;
        badge.textContent = 'media-showcase';
        
        badge.addEventListener('click', function() {
            showMediaInfo();
        });
        
        document.body.appendChild(badge);
        
        // Auto-fade after 5 seconds
        setTimeout(() => {
            if (badge.parentNode) {
                badge.style.opacity = '0.3';
            }
        }, 5000);
    }
    
    // Show comprehensive media preview modal
    async function showMediaInfo() {
        if (document.getElementById('media-showcase-modal')) return;
        
        // Load initial locale messages first
        await loadLocaleMessages(currentLocale);
        
        const modal = document.createElement('div');
        modal.id = 'media-showcase-modal';
        modal.style.cssText = `
            position: fixed;
            top: 5%;
            left: 50%;
            transform: translateX(-50%);
            background: white;
            color: black;
            border: 2px dashed black;
            font-family: monospace;
            font-size: 11px;
            z-index: 1000000;
            width: 500px;
            max-width: 90vw;
            height: 85vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        `;
        
        // Count media elements on page
        const images = document.querySelectorAll('img').length;
        const videos = document.querySelectorAll('video').length;
        const audios = document.querySelectorAll('audio').length;
        
        modal.innerHTML = `
            <div style="padding: 15px; border-bottom: 1px dashed black; flex-shrink: 0;">
                <div style="text-align: center;">
                    <strong>media showcase pro</strong><br>
                    <small>comprehensive file type testing</small>
                </div>
                <div style="margin-top: 10px; font-size: 10px; text-align: center;">
                    <strong>page detection:</strong> images: ${images} | videos: ${videos} | audio: ${audios}
                </div>
                <div style="margin-top: 10px; text-align: center;">
                    <div id="language-label" style="font-size: 8px; margin-bottom: 4px;">${getMessage('languageSelector')}</div>
                    <select style="font-family: monospace; font-size: 8px; border: 1px dashed #ccc; padding: 2px;">
                        <option value="en" ${currentLocale === 'en' ? 'selected' : ''}>English</option>
                        <option value="es" ${currentLocale === 'es' ? 'selected' : ''}>Español</option>
                        <option value="fr" ${currentLocale === 'fr' ? 'selected' : ''}>Français</option>
                        <option value="de" ${currentLocale === 'de' ? 'selected' : ''}>Deutsch</option>
                        <option value="ja" ${currentLocale === 'ja' ? 'selected' : ''}>日本語</option>
                    </select>
                </div>
            </div>
            
            <div style="flex: 1; overflow-y: auto; padding: 15px;" id="modal-content">
                <div style="margin-bottom: 15px;">
                    <div style="margin-bottom: 8px; border-bottom: 1px dashed #ccc; padding-bottom: 3px;">
                        <div id="audio-header"><strong>${getMessage('audioTest')}</strong></div>
                    </div>
                    <div id="audio-preview">
                        <audio controls style="width: 100%; margin-bottom: 8px;">
                            <source src="${browser.runtime.getURL('assets/audio/sample-music.wav')}" type="audio/wav">
                            Audio not supported
                        </audio>
                        <div style="font-size: 9px; color: #666;">sample-music.wav (test audio file)</div>
                    </div>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <div style="margin-bottom: 8px; border-bottom: 1px dashed #ccc; padding-bottom: 3px;">
                        <div id="video-header"><strong>${getMessage('videoTest')}</strong></div>
                    </div>
                    <div id="video-preview">
                        <video controls style="width: 100%; max-height: 120px; margin-bottom: 8px;">
                            <source src="${browser.runtime.getURL('assets/videos/demo-video.mp4')}" type="video/mp4">
                            Video not supported
                        </video>
                        <div style="font-size: 9px; color: #666;">demo-video.mp4 (test video file)</div>
                    </div>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <div style="margin-bottom: 8px; border-bottom: 1px dashed #ccc; padding-bottom: 3px;">
                        <div id="image-header"><strong>${getMessage('imageTest')}</strong></div>
                        <div style="font-size: 8px; color: #999; margin-top: 2px;">Standard assets + Custom folder structure demo</div>
                    </div>
                    <div id="image-preview">
                        <img src="${browser.runtime.getURL('assets/images/photo-sample.jpg')}" style="max-width: 100%; max-height: 80px; border: 1px dashed #ccc; margin-bottom: 8px;" alt="test image">
                        <div style="font-size: 9px; color: #666;">photo-sample.jpg (Creative Commons test image)</div>
                        
                        <img src="${browser.runtime.getURL('my/folder/images/showcase/lake-willoughby.jpg')}" style="max-width: 100%; max-height: 80px; border: 1px dashed #ccc; margin: 8px 0;" alt="lake willoughby">
                        <div style="font-size: 9px; color: #666;">my/folder/images/showcase/lake-willoughby.jpg (Custom folder structure demo)</div>
                        
                        <img src="${browser.runtime.getURL('my/folder/images/showcase/friday-13th-buzzy-crow.gif')}" style="max-width: 100%; max-height: 80px; border: 1px dashed #ccc; margin: 8px 0;" alt="animated gif">
                        <div style="font-size: 9px; color: #666;">my/folder/images/showcase/friday-13th-buzzy-crow.gif (Custom nested folders)</div>
                    </div>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <div style="margin-bottom: 8px; border-bottom: 1px dashed #ccc; padding-bottom: 3px;">
                        <div id="font-header"><strong>${getMessage('fontTest')}</strong></div>
                    </div>
                    <div id="font-preview">
                        <div style="margin-bottom: 5px; font-size: 9px;">loading custom fonts...</div>
                        <div id="font-showcase" style="font-size: 13px; margin-bottom: 8px;">Font Test - Custom Typography</div>
                        <div style="font-size: 9px; color: #666;">showcase-regular.ttf & showcase-bold.woff2</div>
                    </div>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <div style="margin-bottom: 8px; border-bottom: 1px dashed #ccc; padding-bottom: 3px;">
                        <div id="data-header"><strong>${getMessage('dataPreview')}</strong></div>
                    </div>
                    <div id="data-preview" style="font-size: 9px; background: #f9f9f9; padding: 8px; border: 1px dashed #ccc;">
                        <div>loading data files...</div>
                    </div>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <div style="margin-bottom: 8px; border-bottom: 1px dashed #ccc; padding-bottom: 3px;">
                        <div id="svg-header"><strong>${getMessage('svgGraphics')}</strong></div>
                    </div>
                    <div id="svg-preview">
                        <img src="${browser.runtime.getURL('assets/svg/media-icons.svg')}" style="height: 35px; margin-right: 8px; border: 1px dashed #ccc;" alt="svg icons">
                        <img src="${browser.runtime.getURL('assets/svg/logo.svg')}" style="height: 35px; border: 1px dashed #ccc;" alt="svg logo">
                        <div style="font-size: 9px; color: #666; margin-top: 5px;">media-icons.svg & logo.svg</div>
                    </div>
                </div>
            </div>
            
            <div style="padding: 10px; border-top: 1px dashed black; flex-shrink: 0;">
                <button onclick="document.getElementById('media-showcase-modal').remove()" style="
                    width: 100%;
                    background: white;
                    color: black;
                    border: 1px dashed black;
                    padding: 6px;
                    font-family: monospace;
                    cursor: pointer;
                    text-transform: uppercase;
                    font-size: 10px;
                ">${getMessage('close')}</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Make changeLanguage globally available with debugging
        window.changeLanguage = function(locale) {
            console.log('🌍 LANGUAGE SELECTOR CLICKED:', locale);
            console.log('🔍 Current locale before change:', currentLocale);
            changeLanguage(locale);
        };
        
        // Add debugging to dropdown
        const dropdown = modal.querySelector('select');
        if (dropdown) {
            dropdown.addEventListener('change', function(e) {
                console.log('📱 DROPDOWN EVENT FIRED:', e.target.value);
                window.changeLanguage(e.target.value);
            });
            console.log('✅ Dropdown event listener added');
        }
        
        // Load custom fonts
        loadCustomFonts();
        
        // Load data files
        loadDataPreviews();
        
        
        // Auto-close after 30 seconds (more time to test)
        setTimeout(() => {
            if (modal.parentNode) {
                modal.remove();
            }
        }, 30000);
    }
    
    // Load custom fonts for testing
    function loadCustomFonts() {
        const fontFace1 = new FontFace('ShowcaseRegular', `url(${browser.runtime.getURL('assets/fonts/showcase-regular.ttf')})`);
        const fontFace2 = new FontFace('ShowcaseBold', `url(${browser.runtime.getURL('assets/fonts/showcase-bold.woff2')})`);
        
        Promise.all([fontFace1.load(), fontFace2.load()]).then((fonts) => {
            fonts.forEach(font => document.fonts.add(font));
            
            const showcase = document.getElementById('font-showcase');
            if (showcase) {
                showcase.style.fontFamily = 'ShowcaseRegular, monospace';
                showcase.innerHTML = 'Regular Font Loaded! <span style="font-family: ShowcaseBold, monospace;">Bold Font Loaded!</span>';
            }
        }).catch((error) => {
            const showcase = document.getElementById('font-showcase');
            if (showcase) {
                showcase.innerHTML = 'Font loading failed (expected in some contexts)';
            }
        });
    }
    
    // Load and preview data files
    function loadDataPreviews() {
        const preview = document.getElementById('data-preview');
        if (!preview) return;
        
        preview.innerHTML = `<div style="font-size: 9px;">${getMessage('loadingDataFiles')}</div>`;
        
        // Try to load JSON, CSV, and XML data
        const dataFiles = [
            { name: 'sample-data.json', type: 'JSON' },
            { name: 'sample-data.csv', type: 'CSV' }, 
            { name: 'sample-data.xml', type: 'XML' }
        ];
        
        let loadedFiles = 0;
        let results = [];
        
        dataFiles.forEach((fileInfo) => {
            fetch(browser.runtime.getURL(`assets/data/${fileInfo.name}`))
                .then(response => response.text())
                .then(data => {
                    let processedData;
                    
                    if (fileInfo.type === 'JSON') {
                        try {
                            const jsonData = JSON.parse(data);
                            processedData = JSON.stringify(jsonData, null, 2).split('\n').slice(0, 8).join('\n');
                        } catch (e) {
                            processedData = data.split('\n').slice(0, 6).join('\n');
                        }
                    } else if (fileInfo.type === 'CSV') {
                        const lines = data.split('\n').slice(0, 6);
                        processedData = lines.join('\n');
                    } else {
                        processedData = data.split('\n').slice(0, 5).join('\n');
                    }
                    
                    results.push({
                        name: fileInfo.name,
                        type: fileInfo.type,
                        data: processedData,
                        success: true
                    });
                    
                    loadedFiles++;
                    if (loadedFiles === dataFiles.length) {
                        displayDataResults(preview, results);
                    }
                })
                .catch(() => {
                    results.push({
                        name: fileInfo.name,
                        type: fileInfo.type,
                        success: false
                    });
                    
                    loadedFiles++;
                    if (loadedFiles === dataFiles.length) {
                        displayDataResults(preview, results);
                    }
                });
        });
    }
    
    function displayDataResults(preview, results) {
        let html = '';
        
        results.forEach((result, index) => {
            if (result.success) {
                html += `
                    <div style="margin-bottom: ${index < results.length - 1 ? '12px' : '8px'};">
                        <div style="font-weight: bold; margin-bottom: 4px; color: #333;">
                            📄 ${result.name} (${result.type})
                        </div>
                        <pre style="
                            font-size: 7px; 
                            overflow-x: auto; 
                            background: #fff; 
                            border: 1px dashed #ddd; 
                            padding: 6px; 
                            margin: 0;
                            max-height: 80px;
                            color: #333;
                            line-height: 1.2;
                        ">${result.data}</pre>
                    </div>
                `;
            } else {
                html += `
                    <div style="margin-bottom: ${index < results.length - 1 ? '8px' : '4px'};">
                        <div style="color: #666;">📄 ${result.name}: bundled but fetch restricted</div>
                    </div>
                `;
            }
        });
        
        html += '<div style="margin-top: 8px; color: #666; font-size: 8px;">✓ data files accessible from extension bundle</div>';
        
        preview.innerHTML = html;
    }
    
    // Listen for messages from background script
    browser.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        switch(request.action) {
            case 'detectMedia':
                detectMediaOnPage();
                break;
            case 'showVideoPlayer':
                showSimpleNotification('video player would open: ' + request.src);
                break;
            case 'showAudioPlayer':
                showSimpleNotification('audio player would open: ' + request.src);
                break;
        }
        
        return true;
    });
    
    // Detect media elements on page
    function detectMediaOnPage() {
        const mediaElements = [
            ...document.querySelectorAll('img'),
            ...document.querySelectorAll('video'),
            ...document.querySelectorAll('audio')
        ];
        
        mediaElements.forEach(element => {
            const mediaInfo = {
                type: element.tagName.toLowerCase(),
                src: element.src || element.currentSrc,
                name: element.src ? element.src.split('/').pop() : 'unknown',
                requiresProcessing: true
            };
            
            browser.runtime.sendMessage({
                action: 'registerMediaFile',
                fileInfo: mediaInfo
            });
        });
        
        showSimpleNotification(`detected ${mediaElements.length} media elements`);
    }
    
    // Show simple notification
    function showSimpleNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 60px;
            right: 10px;
            background: white;
            color: black;
            border: 1px dashed black;
            padding: 8px 12px;
            font-family: monospace;
            font-size: 10px;
            z-index: 999998;
            max-width: 200px;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }
    
    // Add badge when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addMediaBadge);
    } else {
        addMediaBadge();
    }
    
})();