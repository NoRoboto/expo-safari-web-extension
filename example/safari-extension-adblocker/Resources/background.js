// AdBlock Pro Background Script

let blockedCount = 0;
let isEnabled = true;

// Initialize extension
browser.runtime.onInstalled.addListener(function() {
    browser.storage.local.set({
        enabled: true,
        blockedCount: 0,
        filters: []
    });
});

// Web request blocking
browser.webRequest.onBeforeRequest.addListener(
    function(details) {
        if (!isEnabled) return;
        
        const url = details.url;
        const blocked = shouldBlock(url);
        
        if (blocked) {
            blockedCount++;
            updateBadge();
            return { cancel: true };
        }
    },
    { urls: ["<all_urls>"] },
    ["blocking"]
);

// Check if URL should be blocked
function shouldBlock(url) {
    const blockPatterns = [
        /googletagmanager\.com/,
        /google-analytics\.com/,
        /doubleclick\.net/,
        /facebook\.com\/tr/,
        /ads\./,
        /advertisement/
    ];
    
    return blockPatterns.some(pattern => pattern.test(url));
}

// Update badge with blocked count
function updateBadge() {
    browser.browserAction.setBadgeText({
        text: blockedCount.toString()
    });
    browser.browserAction.setBadgeBackgroundColor({
        color: "#ff4444"
    });
}

// Handle messages from popup/content
browser.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    switch(request.action) {
        case 'getStats':
            sendResponse({
                enabled: isEnabled,
                blockedCount: blockedCount
            });
            break;
            
        case 'toggle':
            isEnabled = !isEnabled;
            browser.storage.local.set({ enabled: isEnabled });
            sendResponse({ enabled: isEnabled });
            break;
            
        case 'reset':
            blockedCount = 0;
            updateBadge();
            sendResponse({ blockedCount: 0 });
            break;
    }
    
    return true;
});

console.log('AdBlock Pro background script loaded');