// SecurePass Manager Popup Script

document.addEventListener('DOMContentLoaded', function() {
    const lockedView = document.getElementById('locked-view');
    const unlockedView = document.getElementById('unlocked-view');
    const actionsContainer = document.getElementById('actions-container');
    const currentSiteEl = document.getElementById('current-site');
    const credentialCountEl = document.getElementById('credential-count');
    const credentialsListEl = document.getElementById('credentials-list');
    
    // Get current tab info
    browser.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        const currentTab = tabs[0];
        const url = new URL(currentTab.url);
        currentSiteEl.textContent = url.hostname;
        
        // Load credentials for this site
        loadSiteCredentials(url.hostname);
    });
    
    // Check vault status
    browser.runtime.sendMessage({ action: 'getStatus' }, function(response) {
        if (response.locked) {
            showLockedView();
        } else {
            showUnlockedView(response.credentialCount);
        }
    });
    
    // Event listeners
    document.getElementById('unlock-btn').addEventListener('click', function() {
        // In a real app, show password prompt
        browser.runtime.sendMessage({ action: 'unlock' }, function(response) {
            if (response.success) {
                browser.runtime.sendMessage({ action: 'getStatus' }, function(statusResponse) {
                    showUnlockedView(statusResponse.credentialCount);
                });
            }
        });
    });
    
    document.getElementById('lock-btn').addEventListener('click', function() {
        browser.runtime.sendMessage({ action: 'lock' }, function(response) {
            if (response.success) {
                showLockedView();
            }
        });
    });
    
    document.getElementById('fill-form-btn').addEventListener('click', function() {
        browser.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            browser.tabs.sendMessage(tabs[0].id, { action: 'fillLogin' });
            window.close();
        });
    });
    
    document.getElementById('generate-password-btn').addEventListener('click', function() {
        browser.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            browser.tabs.sendMessage(tabs[0].id, { action: 'generatePassword' });
            window.close();
        });
    });
    
    document.getElementById('save-current-btn').addEventListener('click', function() {
        browser.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            browser.tabs.sendMessage(tabs[0].id, { action: 'saveCurrentForm' });
            window.close();
        });
    });
    
    function showLockedView() {
        lockedView.style.display = 'block';
        unlockedView.style.display = 'none';
        actionsContainer.style.display = 'none';
    }
    
    function showUnlockedView(credentialCount) {
        lockedView.style.display = 'none';
        unlockedView.style.display = 'block';
        actionsContainer.style.display = 'block';
        credentialCountEl.textContent = credentialCount || 0;
    }
    
    function loadSiteCredentials(domain) {
        browser.runtime.sendMessage({
            action: 'getCredentials',
            domain: domain
        }, function(response) {
            if (response.credentials && response.credentials.length > 0) {
                showCredentialsList(response.credentials);
            }
        });
    }
    
    function showCredentialsList(credentials) {
        credentialsListEl.style.display = 'block';
        credentialsListEl.innerHTML = '';
        
        credentials.forEach(function(cred) {
            const item = document.createElement('div');
            item.className = 'credential-item';
            item.innerHTML = `
                <strong>${cred.username}</strong><br>
                <small>created: ${new Date(cred.created).toLocaleDateString()}</small>
            `;
            
            item.addEventListener('click', function() {
                // Fill form with this credential
                browser.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                    browser.tabs.sendMessage(tabs[0].id, { 
                        action: 'fillSpecificLogin',
                        credential: cred
                    });
                    window.close();
                });
            });
            
            credentialsListEl.appendChild(item);
        });
    }
    
    // Internationalization
    function setI18nText() {
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(function(element) {
            const key = element.getAttribute('data-i18n');
            const message = browser.i18n.getMessage(key);
            if (message) {
                element.textContent = message;
            }
        });
    }
    
    setI18nText();
});