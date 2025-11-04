// Background script for Safari Web Extension

// Listen for messages from popup or content scripts
browser.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log('Background received message:', request);
    
    if (request.type === 'TEST_MESSAGE') {
        // Send response back to popup
        sendResponse({
            message: 'Hello from background script!',
            timestamp: new Date().toISOString()
        });
    }
    
    if (request.type === 'CONTENT_CLICK') {
        console.log('Extension badge clicked on:', request.url);
        
        // Show badge on browser action icon
        browser.browserAction.setBadgeText({
            text: '✓',
            tabId: sender.tab.id
        });
        browser.browserAction.setBadgeBackgroundColor({
            color: '#34C759'
        });
        
        // Clear badge after 3 seconds
        setTimeout(() => {
            browser.browserAction.setBadgeText({
                text: '',
                tabId: sender.tab.id
            });
        }, 3000);
        
        sendResponse({
            message: 'Extension modal activated!',
            timestamp: new Date().toISOString()
        });
    }
    
    return true; // Keep message channel open for async response
});

// Listen for browser action clicks (toolbar button)
browser.browserAction.onClicked.addListener(function(tab) {
    console.log('Browser action clicked for tab:', tab.id);
    
    // Example: Inject content script or show notification
    browser.tabs.executeScript(tab.id, {
        code: 'console.log("Example Safari Extension activated!");'
    });
});

// Example: Listen for tab updates
browser.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && tab.url) {
        console.log('Tab updated:', tab.url);
    }
});

console.log('Example Safari Extension background script loaded!');