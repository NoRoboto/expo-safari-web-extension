// Content script for Safari Web Extension
// This script runs in the context of web pages

(function() {
    'use strict';
    
    console.log('Example Safari Extension content script loaded!');
    
    // Example: Add a floating badge to show the extension is active
    function addExtensionBadge() {
        // Check if badge already exists
        if (document.getElementById('safari-extension-badge')) {
            return;
        }
        
        const badge = document.createElement('div');
        badge.id = 'safari-extension-badge';
        badge.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: white;
            color: black;
            padding: 8px 12px;
            border: 2px dashed black;
            font-family: monospace;
            font-size: 11px;
            font-weight: normal;
            z-index: 10000;
            cursor: pointer;
            transition: all 0.2s ease;
            text-transform: uppercase;
            letter-spacing: 1px;
        `;
        badge.textContent = 'extension';
        
        // Add click handler
        badge.addEventListener('click', function() {
            badge.style.transform = 'scale(0.95)';
            setTimeout(() => {
                badge.style.transform = 'scale(1)';
            }, 150);
            
            // Show extension modal
            showExtensionModal();
            
            // Notify background script
            browser.runtime.sendMessage({
                type: 'CONTENT_CLICK',
                url: window.location.href
            });
        });
        
        document.body.appendChild(badge);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (badge.parentNode) {
                badge.style.opacity = '0.3';
            }
        }, 5000);
    }
    
    // Function to show extension modal
    function showExtensionModal() {
        // Remove existing modal if any
        const existingModal = document.getElementById('safari-extension-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.id = 'safari-extension-modal';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 999999;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            animation: fadeIn 0.3s ease;
        `;
        
        // Create modal content (bottom sheet style)
        const modal = document.createElement('div');
        modal.style.cssText = `
            background: white;
            color: black;
            width: 100%;
            max-width: 350px;
            border: 2px dashed black;
            border-bottom: none;
            padding: 20px;
            font-family: monospace;
            animation: slideUp 0.3s ease;
            max-height: 70vh;
            overflow-y: auto;
        `;
        
        // Modal content (simple)
        modal.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px; border-bottom: 1px dashed black; padding-bottom: 15px;">
                <h2 style="margin: 0 0 10px 0; color: black; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                safari extension
                </h2>
                <p style="margin: 0; color: #666; font-size: 11px;">
                ${window.location.hostname}
                </p>
            </div>
            
            <div style="border: 1px dashed black; padding: 15px; margin-bottom: 15px;">
                <div style="font-size: 11px; color: black; line-height: 1.4;">
                url: ${window.location.href.substring(0, 45)}${window.location.href.length > 45 ? '...' : ''}<br>
                title: ${document.title.substring(0, 35)}${document.title.length > 35 ? '...' : ''}<br>
                time: ${new Date().toLocaleString()}
                </div>
            </div>
            
            <button id="close-btn" style="
                width: 100%;
                background: white;
                color: black;
                border: 1px dashed black;
                padding: 12px;
                font-family: monospace;
                font-size: 11px;
                font-weight: normal;
                cursor: pointer;
                text-transform: uppercase;
            ">close</button>
        `;
        
        // Add animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideUp {
                from { transform: translateY(100%); }
                to { transform: translateY(0); }
            }
        `;
        document.head.appendChild(style);
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // Close modal handlers
        function closeModal() {
            overlay.style.animation = 'fadeIn 0.3s ease reverse';
            modal.style.animation = 'slideUp 0.3s ease reverse';
            setTimeout(() => {
                overlay.remove();
            }, 300);
        }
        
        document.getElementById('close-btn').addEventListener('click', closeModal);
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                closeModal();
            }
        });
        
        // Close on Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && document.getElementById('safari-extension-modal')) {
                closeModal();
            }
        });
    }
    
    // Add badge when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addExtensionBadge);
    } else {
        addExtensionBadge();
    }
    
    // Example: Listen for messages from popup or background
    browser.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        console.log('Content script received message:', request);
        return true;
    });
    
})();