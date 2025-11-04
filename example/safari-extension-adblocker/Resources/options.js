// AdBlock Pro Options Script

document.addEventListener('DOMContentLoaded', function() {
    const blockAdsEl = document.getElementById('block-ads');
    const blockSocialEl = document.getElementById('block-social');
    const blockTrackingEl = document.getElementById('block-tracking');
    const blockPopupsEl = document.getElementById('block-popups');
    const customFiltersEl = document.getElementById('custom-filters');
    const saveFiltersBtn = document.getElementById('save-filters');
    const resetFiltersBtn = document.getElementById('reset-filters');
    const clearStatsBtn = document.getElementById('clear-stats');
    const statsEl = document.getElementById('stats');
    
    // Load saved settings
    browser.storage.local.get([
        'blockAds',
        'blockSocial', 
        'blockTracking',
        'blockPopups',
        'customFilters',
        'blockedCount'
    ], function(result) {
        blockAdsEl.checked = result.blockAds !== false;
        blockSocialEl.checked = result.blockSocial !== false;
        blockTrackingEl.checked = result.blockTracking !== false;
        blockPopupsEl.checked = result.blockPopups !== false;
        customFiltersEl.value = result.customFilters || '';
        
        updateStats(result.blockedCount || 0);
    });
    
    // Save settings when changed
    [blockAdsEl, blockSocialEl, blockTrackingEl, blockPopupsEl].forEach(checkbox => {
        checkbox.addEventListener('change', saveSettings);
    });
    
    function saveSettings() {
        browser.storage.local.set({
            blockAds: blockAdsEl.checked,
            blockSocial: blockSocialEl.checked,
            blockTracking: blockTrackingEl.checked,
            blockPopups: blockPopupsEl.checked
        });
    }
    
    // Save custom filters
    saveFiltersBtn.addEventListener('click', function() {
        const filters = customFiltersEl.value;
        browser.storage.local.set({ customFilters: filters }, function() {
            alert('filters saved successfully');
        });
    });
    
    // Reset filters
    resetFiltersBtn.addEventListener('click', function() {
        if (confirm('reset all custom filters?')) {
            customFiltersEl.value = '';
            browser.storage.local.remove('customFilters');
        }
    });
    
    // Clear statistics
    clearStatsBtn.addEventListener('click', function() {
        if (confirm('clear all statistics?')) {
            browser.storage.local.set({ blockedCount: 0 }, function() {
                updateStats(0);
            });
        }
    });
    
    function updateStats(blockedCount) {
        const now = new Date();
        statsEl.innerHTML = `
            total blocked: ${blockedCount}<br>
            last updated: ${now.toLocaleString()}<br>
            extension version: 2.1.0<br>
            status: active
        `;
    }
});