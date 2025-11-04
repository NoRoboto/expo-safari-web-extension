// SecurePass Manager Content Script

(function() {
    'use strict';
    
    console.log('SecurePass Manager content script loaded on:', window.location.hostname);
    
    // Listen for messages from background/popup
    browser.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        switch(request.action) {
            case 'fillLogin':
                fillLoginForm();
                break;
                
            case 'generatePassword':
                generatePasswordForCurrentField();
                break;
                
            case 'showNotification':
                showNotification(request.message);
                break;
                
            case 'saveCurrentForm':
                saveCurrentFormData();
                break;
        }
        
        return true;
    });
    
    // Fill login form
    function fillLoginForm() {
        const forms = window.SecurePassFormDetector ? 
            window.SecurePassFormDetector.getDetectedForms() : [];
            
        if (forms.length > 0) {
            const form = forms[0]; // Use first detected form
            const domain = window.location.hostname;
            
            browser.runtime.sendMessage({
                action: 'getCredentials',
                domain: domain
            }, function(response) {
                if (response.credentials && response.credentials.length > 0) {
                    const cred = response.credentials[0];
                    
                    form.username.value = cred.username;
                    form.password.value = cred.password;
                    
                    // Trigger events
                    form.username.dispatchEvent(new Event('input', { bubbles: true }));
                    form.password.dispatchEvent(new Event('input', { bubbles: true }));
                    
                    // Highlight fields
                    form.username.classList.add('securepass-highlight');
                    form.password.classList.add('securepass-highlight');
                    
                    setTimeout(() => {
                        form.username.classList.remove('securepass-highlight');
                        form.password.classList.remove('securepass-highlight');
                    }, 1000);
                    
                    showNotification(browser.i18n.getMessage('formFilled'));
                } else {
                    showNotification(browser.i18n.getMessage('noCredentials'));
                }
            });
        } else {
            showNotification('No login forms detected');
        }
    }
    
    // Generate password for current field
    function generatePasswordForCurrentField() {
        const activeElement = document.activeElement;
        
        if (activeElement && activeElement.type === 'password') {
            browser.runtime.sendMessage({
                action: 'generatePassword'
            }, function(response) {
                if (response.password) {
                    activeElement.value = response.password;
                    activeElement.dispatchEvent(new Event('input', { bubbles: true }));
                    activeElement.classList.add('securepass-highlight');
                    
                    setTimeout(() => {
                        activeElement.classList.remove('securepass-highlight');
                    }, 1000);
                    
                    showNotification(browser.i18n.getMessage('passwordGenerated'));
                }
            });
        } else {
            showNotification('Focus on a password field first');
        }
    }
    
    // Save current form data
    function saveCurrentFormData() {
        const forms = window.SecurePassFormDetector ? 
            window.SecurePassFormDetector.getDetectedForms() : [];
            
        if (forms.length > 0) {
            const form = forms[0];
            const username = form.username.value;
            const password = form.password.value;
            
            if (username && password) {
                const domain = window.location.hostname;
                
                browser.runtime.sendMessage({
                    action: 'saveCredentials',
                    domain: domain,
                    username: username,
                    password: password
                }, function(response) {
                    if (response.success) {
                        showNotification(browser.i18n.getMessage('loginSaved'));
                    } else {
                        showNotification('Failed to save: ' + (response.error || 'Unknown error'));
                    }
                });
            } else {
                showNotification('Please fill username and password fields');
            }
        } else {
            showNotification('No login forms detected');
        }
    }
    
    // Show notification
    function showNotification(message) {
        // Remove existing notification
        const existing = document.querySelector('.securepass-notification');
        if (existing) {
            existing.remove();
        }
        
        const notification = document.createElement('div');
        notification.className = 'securepass-notification';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }
    
    // Auto-save form on submission
    document.addEventListener('submit', function(e) {
        const form = e.target;
        
        if (form.tagName === 'FORM') {
            const usernameField = form.querySelector('input[type="text"], input[type="email"]');
            const passwordField = form.querySelector('input[type="password"]');
            
            if (usernameField && passwordField && usernameField.value && passwordField.value) {
                const domain = window.location.hostname;
                
                // Check if we already have credentials for this site
                browser.runtime.sendMessage({
                    action: 'getCredentials',
                    domain: domain
                }, function(response) {
                    if (!response.credentials || response.credentials.length === 0) {
                        // Ask user if they want to save
                        setTimeout(() => {
                            showSavePrompt(usernameField.value, passwordField.value);
                        }, 1000);
                    }
                });
            }
        }
    });
    
    // Show save prompt
    function showSavePrompt(username, password) {
        const overlay = document.createElement('div');
        overlay.className = 'securepass-overlay';
        
        const modal = document.createElement('div');
        modal.className = 'securepass-modal';
        modal.innerHTML = `
            <h3 style="margin: 0 0 15px 0; text-transform: uppercase;">save login?</h3>
            <p style="margin: 0 0 15px 0; font-size: 11px;">
                do you want to save these credentials?<br>
                site: ${window.location.hostname}<br>
                user: ${username}
            </p>
            <div style="display: flex; gap: 10px;">
                <button id="securepass-save" style="
                    flex: 1; background: white; color: black; 
                    border: 1px dashed black; padding: 8px; 
                    font-family: monospace; cursor: pointer;
                    text-transform: uppercase;
                ">save</button>
                <button id="securepass-cancel" style="
                    flex: 1; background: white; color: black; 
                    border: 1px dashed black; padding: 8px; 
                    font-family: monospace; cursor: pointer;
                    text-transform: uppercase;
                ">cancel</button>
            </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // Event handlers
        document.getElementById('securepass-save').addEventListener('click', function() {
            browser.runtime.sendMessage({
                action: 'saveCredentials',
                domain: window.location.hostname,
                username: username,
                password: password
            });
            overlay.remove();
        });
        
        document.getElementById('securepass-cancel').addEventListener('click', function() {
            overlay.remove();
        });
        
        // Close on overlay click
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                overlay.remove();
            }
        });
    }
    
})();