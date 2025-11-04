// AdBlock Pro Content Script

(function() {
    'use strict';
    
    let blockedElements = 0;
    
    console.log('AdBlock Pro content script loaded on:', window.location.hostname);
    
    // DOM-based ad blocking
    function blockAds() {
        const adSelectors = [
            '.advertisement',
            '.ad-banner', 
            '.ads',
            '[id*="advertisement"]',
            '[class*="ad-"]',
            '.google-ads',
            '.sponsored-content'
        ];
        
        adSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                if (!element.classList.contains('adblock-pro-blocked')) {
                    element.style.display = 'none';
                    element.classList.add('adblock-pro-blocked');
                    blockedElements++;
                }
            });
        });
        
        // Block iframes with ad-like sources
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(iframe => {
            const src = iframe.src || '';
            if (src.includes('ads') || src.includes('doubleclick') || src.includes('googlesyndication')) {
                iframe.style.display = 'none';
                iframe.classList.add('adblock-pro-blocked');
                blockedElements++;
            }
        });
    }
    
    // Monitor for new ad elements
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length > 0) {
                blockAds();
            }
        });
    });
    
    // Start blocking
    blockAds();
    
    // Observe DOM changes
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Add indicator badge
    function addBlockedIndicator() {
        if (blockedElements > 0 && !document.getElementById('adblock-pro-indicator')) {
            const indicator = document.createElement('div');
            indicator.id = 'adblock-pro-indicator';
            indicator.style.cssText = `
                position: fixed;
                bottom: 10px;
                right: 10px;
                background: white;
                color: red;
                border: 1px dashed red;
                padding: 5px 8px;
                font-family: monospace;
                font-size: 11px;
                z-index: 999999;
                opacity: 0.8;
            `;
            indicator.textContent = `blocked: ${blockedElements}`;
            document.body.appendChild(indicator);
            
            // Auto-hide after 3 seconds
            setTimeout(() => {
                if (indicator.parentNode) {
                    indicator.style.opacity = '0.3';
                }
            }, 3000);
        }
    }
    
    // Add indicator when blocking is done
    setTimeout(addBlockedIndicator, 1000);
    
    // Listen for messages
    browser.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.action === 'getBlockedCount') {
            sendResponse({ blockedElements: blockedElements });
        }
        return true;
    });
    
})();