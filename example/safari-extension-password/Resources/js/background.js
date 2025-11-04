// SecurePass Manager Background Script
// Compatible with non-persistent background pages (required for Safari iOS)

// Initialize extension
browser.runtime.onInstalled.addListener(function() {
    // Initialize storage if needed
    browser.storage.local.get(['isLocked', 'credentials'], function(result) {
        if (result.isLocked === undefined) {
            browser.storage.local.set({ 
                isLocked: true,
                credentials: []
            });
        }
    });
    
    // Create context menu
    browser.contextMenus.create({
        id: 'fill-login',
        title: browser.i18n.getMessage('fillFormCommand'),
        contexts: ['editable']
    });
    
    browser.contextMenus.create({
        id: 'generate-password',
        title: browser.i18n.getMessage('generatePasswordCommand'),
        contexts: ['editable']
    });
});

// Helper function to get current state from storage
async function getStorageData() {
    return new Promise((resolve) => {
        browser.storage.local.get(['isLocked', 'credentials'], function(result) {
            resolve({
                isLocked: result.isLocked !== false,
                credentials: result.credentials || []
            });
        });
    });
}

// Context menu handler
browser.contextMenus.onClicked.addListener(async function(info, tab) {
    const { isLocked } = await getStorageData();
    
    switch(info.menuItemId) {
        case 'fill-login':
            if (!isLocked) {
                browser.tabs.sendMessage(tab.id, { action: 'fillLogin' });
            } else {
                browser.tabs.sendMessage(tab.id, { 
                    action: 'showNotification', 
                    message: 'Please unlock the vault first' 
                });
            }
            break;
        case 'generate-password':
            browser.tabs.sendMessage(tab.id, { action: 'generatePassword' });
            break;
    }
});

// Keyboard shortcuts
browser.commands.onCommand.addListener(async function(command) {
    const { isLocked } = await getStorageData();
    
    browser.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        const tab = tabs[0];
        
        switch(command) {
            case 'fill-form':
                if (!isLocked) {
                    browser.tabs.sendMessage(tab.id, { action: 'fillLogin' });
                } else {
                    browser.tabs.sendMessage(tab.id, { 
                        action: 'showNotification', 
                        message: 'Please unlock the vault first' 
                    });
                }
                break;
            case 'generate-password':
                browser.tabs.sendMessage(tab.id, { action: 'generatePassword' });
                break;
        }
    });
});

// Message handler - async to work with storage
browser.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    // Handle async operations
    handleMessage(request, sender).then(sendResponse);
    return true; // Keep message channel open for async response
});

async function handleMessage(request, sender) {
    const { isLocked, credentials } = await getStorageData();
    
    switch(request.action) {
        case 'getCredentials':
            if (isLocked) {
                return { error: 'Vault is locked' };
            } else {
                const siteCredentials = credentials.filter(cred => 
                    cred.domain === request.domain
                );
                return { credentials: siteCredentials };
            }
            
        case 'saveCredentials':
            if (!isLocked) {
                const newCred = {
                    id: Date.now().toString(),
                    domain: request.domain,
                    username: request.username,
                    password: request.password,
                    created: new Date().toISOString()
                };
                
                const updatedCredentials = [...credentials, newCred];
                browser.storage.local.set({ credentials: updatedCredentials });
                
                // Show notification
                browser.tabs.sendMessage(sender.tab.id, {
                    action: 'showNotification',
                    message: browser.i18n.getMessage('loginSaved')
                });
                
                return { success: true };
            } else {
                return { error: 'Vault is locked' };
            }
            
        case 'generatePassword':
            const password = generateStrongPassword();
            return { password: password };
            
        case 'getStatus':
            return { 
                locked: isLocked,
                credentialCount: credentials.length
            };
            
        case 'unlock':
            // In a real app, verify master password here
            browser.storage.local.set({ isLocked: false });
            return { success: true };
            
        case 'lock':
            browser.storage.local.set({ isLocked: true });
            return { success: true };
            
        default:
            return { error: 'Unknown action' };
    }
}

// Password generator
function generateStrongPassword(length = 16) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return password;
}

// Handle background script startup (for non-persistent background pages)
browser.runtime.onStartup.addListener(function() {
    console.log('SecurePass Manager background script started');
});

console.log('SecurePass Manager background script loaded (non-persistent)');