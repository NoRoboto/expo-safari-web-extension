// SecurePass Form Detection Module

(function() {
    'use strict';
    
    let detectedForms = [];
    
    // Form detection patterns
    const loginPatterns = {
        username: [
            'input[type="text"][name*="user"]',
            'input[type="text"][name*="login"]', 
            'input[type="text"][name*="email"]',
            'input[type="email"]',
            'input[id*="user"]',
            'input[id*="login"]',
            'input[id*="email"]'
        ],
        password: [
            'input[type="password"]'
        ]
    };
    
    // Detect login forms
    function detectLoginForms() {
        const forms = document.querySelectorAll('form');
        detectedForms = [];
        
        forms.forEach((form, index) => {
            const usernameField = findField(form, loginPatterns.username);
            const passwordField = findField(form, loginPatterns.password);
            
            if (usernameField && passwordField) {
                const formData = {
                    form: form,
                    username: usernameField,
                    password: passwordField,
                    id: `form-${index}`
                };
                
                detectedForms.push(formData);
                addFormButtons(formData);
            }
        });
        
        return detectedForms;
    }
    
    function findField(form, selectors) {
        for (const selector of selectors) {
            const field = form.querySelector(selector);
            if (field) return field;
        }
        return null;
    }
    
    // Add fill buttons to form fields
    function addFormButtons(formData) {
        // Add button to username field
        addFillButton(formData.username, 'user', 'Fill username');
        
        // Add button to password field
        addFillButton(formData.password, 'pass', 'Fill password');
    }
    
    function addFillButton(field, type, tooltip) {
        // Make parent relative for positioning
        const parent = field.parentElement;
        if (parent && getComputedStyle(parent).position === 'static') {
            parent.style.position = 'relative';
        }
        
        const button = document.createElement('div');
        button.className = 'securepass-button';
        button.textContent = type === 'user' ? 'U' : 'P';
        button.setAttribute('data-type', type);
        button.setAttribute('data-field-id', field.id || Math.random().toString(36));
        
        const tooltipEl = document.createElement('div');
        tooltipEl.className = 'securepass-tooltip';
        tooltipEl.textContent = tooltip;
        button.appendChild(tooltipEl);
        
        // Position button
        const rect = field.getBoundingClientRect();
        button.style.right = '5px';
        
        // Add click handler
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            if (type === 'user') {
                fillUsername(field);
            } else {
                fillPassword(field);
            }
        });
        
        field.parentElement.appendChild(button);
    }
    
    // Fill functions
    function fillUsername(field) {
        const domain = window.location.hostname;
        
        browser.runtime.sendMessage({
            action: 'getCredentials',
            domain: domain
        }, function(response) {
            if (response.credentials && response.credentials.length > 0) {
                field.value = response.credentials[0].username;
                field.dispatchEvent(new Event('input', { bubbles: true }));
                showNotification('Username filled');
            } else {
                showNotification('No saved credentials');
            }
        });
    }
    
    function fillPassword(field) {
        const domain = window.location.hostname;
        
        browser.runtime.sendMessage({
            action: 'getCredentials',
            domain: domain
        }, function(response) {
            if (response.credentials && response.credentials.length > 0) {
                field.value = response.credentials[0].password;
                field.dispatchEvent(new Event('input', { bubbles: true }));
                showNotification('Password filled');
            } else {
                // Offer to generate password
                browser.runtime.sendMessage({
                    action: 'generatePassword'
                }, function(genResponse) {
                    if (genResponse.password) {
                        field.value = genResponse.password;
                        field.dispatchEvent(new Event('input', { bubbles: true }));
                        showNotification('Strong password generated');
                    }
                });
            }
        });
    }
    
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'securepass-notification';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    // Auto-detect forms when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', detectLoginForms);
    } else {
        detectLoginForms();
    }
    
    // Re-detect on DOM changes
    const observer = new MutationObserver(function(mutations) {
        let shouldRedetect = false;
        
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1 && (node.tagName === 'FORM' || node.querySelector('form'))) {
                        shouldRedetect = true;
                    }
                });
            }
        });
        
        if (shouldRedetect) {
            setTimeout(detectLoginForms, 500);
        }
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Export for use by content script
    window.SecurePassFormDetector = {
        detectForms: detectLoginForms,
        getDetectedForms: () => detectedForms
    };
    
})();