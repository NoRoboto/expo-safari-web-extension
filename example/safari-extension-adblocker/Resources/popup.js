// AdBlock Pro Popup Script

document.addEventListener('DOMContentLoaded', function() {
    const statusEl = document.getElementById('status');
    const blockedCountEl = document.getElementById('blocked-count');
    const currentSiteEl = document.getElementById('current-site');
    const toggleBtn = document.getElementById('toggle-btn');
    const resetBtn = document.getElementById('reset-btn');
    const optionsBtn = document.getElementById('options-btn');
    
    // Get current tab info
    browser.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        const currentTab = tabs[0];
        const url = new URL(currentTab.url);
        currentSiteEl.textContent = url.hostname;
    });
    
    // Load stats
    browser.runtime.sendMessage({ action: 'getStats' }, function(response) {
        if (response) {
            updateUI(response.enabled, response.blockedCount);
        }
    });
    
    // Toggle button
    toggleBtn.addEventListener('click', function() {
        browser.runtime.sendMessage({ action: 'toggle' }, function(response) {
            if (response) {
                updateUI(response.enabled);
            }
        });
    });
    
    // Reset button
    resetBtn.addEventListener('click', function() {
        browser.runtime.sendMessage({ action: 'reset' }, function(response) {
            if (response) {
                blockedCountEl.textContent = response.blockedCount;
            }
        });
    });
    
    // Options button
    optionsBtn.addEventListener('click', function() {
        browser.runtime.openOptionsPage();
        window.close();
    });
    
    function updateUI(enabled, blockedCount) {
        if (enabled) {
            statusEl.textContent = 'status: enabled';
            statusEl.className = 'status enabled';
            toggleBtn.textContent = 'disable';
        } else {
            statusEl.textContent = 'status: disabled';
            statusEl.className = 'status disabled';
            toggleBtn.textContent = 'enable';
        }
        
        if (blockedCount !== undefined) {
            blockedCountEl.textContent = blockedCount;
        }
    }
});