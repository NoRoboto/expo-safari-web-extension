// Media Showcase Pro - Background Script
// Comprehensive media extension testing all file types

console.log('Media Showcase Pro: Background script initializing...');

// Extension state
let mediaFiles = [];
let processingQueue = [];
let isProcessing = false;

// Initialize extension
browser.runtime.onInstalled.addListener(function() {
    console.log('Media Showcase Pro installed');
    
    // Load configuration from JSON files
    loadMediaConfiguration();
    
    // Create context menus
    createContextMenus();
    
    // Initialize storage
    browser.storage.local.set({
        version: '4.7.3',
        mediaCount: 0,
        lastAccess: new Date().toISOString()
    });
});

// Load media configuration from assets
async function loadMediaConfiguration() {
    try {
        const configUrl = browser.runtime.getURL('assets/data/media-config.json');
        const response = await fetch(configUrl);
        const config = await response.json();
        
        console.log('Loaded media configuration:', config);
        
        // Store configuration
        browser.storage.local.set({ mediaConfig: config });
        
    } catch (error) {
        console.error('Failed to load media configuration:', error);
    }
}

// Create context menus for different media types
function createContextMenus() {
    const menuItems = [
        { id: 'detect-media', title: 'Detect Media Files', contexts: ['page'] },
        { id: 'show-video-player', title: 'Show Video Player', contexts: ['video'] },
        { id: 'show-audio-player', title: 'Show Audio Player', contexts: ['audio'] },
        { id: 'analyze-image', title: 'Analyze Image', contexts: ['image'] },
        { id: 'extract-text', title: 'Extract Text from Media', contexts: ['image', 'video'] }
    ];
    
    menuItems.forEach(item => {
        browser.contextMenus.create({
            id: item.id,
            title: item.title,
            contexts: item.contexts
        });
    });
}

// Context menu handler
browser.contextMenus.onClicked.addListener(function(info, tab) {
    console.log('Context menu clicked:', info.menuItemId);
    
    switch(info.menuItemId) {
        case 'detect-media':
            browser.tabs.sendMessage(tab.id, { 
                action: 'detectMedia',
                types: ['image', 'video', 'audio']
            });
            break;
            
        case 'show-video-player':
            browser.tabs.sendMessage(tab.id, { 
                action: 'showVideoPlayer',
                src: info.srcUrl
            });
            break;
            
        case 'show-audio-player':
            browser.tabs.sendMessage(tab.id, { 
                action: 'showAudioPlayer',
                src: info.srcUrl
            });
            break;
            
        case 'analyze-image':
            analyzeImage(info.srcUrl, tab.id);
            break;
            
        case 'extract-text':
            extractTextFromMedia(info.srcUrl, tab.id);
            break;
    }
});

// Message handler for content script communication
browser.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log('Background received message:', request.action);
    
    switch(request.action) {
        case 'getMediaConfig':
            browser.storage.local.get(['mediaConfig'], function(result) {
                sendResponse(result.mediaConfig || {});
            });
            return true;
            
        case 'registerMediaFile':
            registerMediaFile(request.fileInfo, sender.tab.id);
            sendResponse({ success: true });
            break;
            
        case 'processMediaQueue':
            processMediaQueue();
            sendResponse({ queued: processingQueue.length });
            break;
            
        case 'getStats':
            getMediaStats(sendResponse);
            return true;
            
        case 'loadAsset':
            loadAssetFile(request.path, sendResponse);
            return true;
    }
});

// Register detected media files
function registerMediaFile(fileInfo, tabId) {
    const mediaFile = {
        ...fileInfo,
        tabId: tabId,
        detected: new Date().toISOString(),
        processed: false
    };
    
    mediaFiles.push(mediaFile);
    
    // Add to processing queue if needed
    if (fileInfo.requiresProcessing) {
        processingQueue.push(mediaFile);
    }
    
    console.log('Registered media file:', mediaFile);
}

// Process media files in background
async function processMediaQueue() {
    if (isProcessing || processingQueue.length === 0) return;
    
    isProcessing = true;
    console.log('Processing media queue:', processingQueue.length, 'items');
    
    while (processingQueue.length > 0) {
        const mediaFile = processingQueue.shift();
        
        try {
            await processMediaFile(mediaFile);
            mediaFile.processed = true;
            
        } catch (error) {
            console.error('Failed to process media file:', error);
            mediaFile.error = error.message;
        }
    }
    
    isProcessing = false;
    console.log('Media queue processing complete');
}

// Process individual media file
async function processMediaFile(mediaFile) {
    console.log('Processing media file:', mediaFile.name);
    
    // Simulate different processing based on file type
    switch (mediaFile.type) {
        case 'image':
            return await processImageFile(mediaFile);
        case 'video':
            return await processVideoFile(mediaFile);
        case 'audio':
            return await processAudioFile(mediaFile);
        case 'font':
            return await processFontFile(mediaFile);
        default:
            console.log('Unknown media type:', mediaFile.type);
    }
}

// Image processing simulation
async function processImageFile(imageFile) {
    console.log('Processing image:', imageFile.name);
    
    // Simulate metadata extraction
    const metadata = {
        dimensions: '1920x1080',
        format: 'JPEG',
        size: '2.3MB',
        colorProfile: 'sRGB',
        hasAlpha: false
    };
    
    imageFile.metadata = metadata;
    return metadata;
}

// Video processing simulation
async function processVideoFile(videoFile) {
    console.log('Processing video:', videoFile.name);
    
    const metadata = {
        duration: '02:30',
        resolution: '1920x1080',
        codec: 'H.264',
        bitrate: '5000 kbps',
        fps: 30
    };
    
    videoFile.metadata = metadata;
    return metadata;
}

// Audio processing simulation
async function processAudioFile(audioFile) {
    console.log('Processing audio:', audioFile.name);
    
    const metadata = {
        duration: '03:45',
        format: 'MP3',
        bitrate: '320 kbps',
        sampleRate: '44.1 kHz',
        channels: 2
    };
    
    audioFile.metadata = metadata;
    return metadata;
}

// Font processing simulation
async function processFontFile(fontFile) {
    console.log('Processing font:', fontFile.name);
    
    const metadata = {
        family: 'Showcase',
        style: 'Regular',
        weight: 400,
        format: 'TrueType',
        glyphs: 1247
    };
    
    fontFile.metadata = metadata;
    return metadata;
}

// Get media statistics
function getMediaStats(sendResponse) {
    const stats = {
        totalFiles: mediaFiles.length,
        processed: mediaFiles.filter(f => f.processed).length,
        pending: processingQueue.length,
        byType: {
            image: mediaFiles.filter(f => f.type === 'image').length,
            video: mediaFiles.filter(f => f.type === 'video').length,
            audio: mediaFiles.filter(f => f.type === 'audio').length,
            font: mediaFiles.filter(f => f.type === 'font').length
        }
    };
    
    sendResponse(stats);
}

// Load asset files
async function loadAssetFile(path, sendResponse) {
    try {
        const url = browser.runtime.getURL(path);
        const response = await fetch(url);
        
        if (path.endsWith('.json')) {
            const data = await response.json();
            sendResponse({ success: true, data: data });
        } else {
            const text = await response.text();
            sendResponse({ success: true, data: text });
        }
        
    } catch (error) {
        console.error('Failed to load asset:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// Analyze image using simulated AI
async function analyzeImage(imageUrl, tabId) {
    console.log('Analyzing image:', imageUrl);
    
    // Simulate analysis delay
    setTimeout(() => {
        const analysis = {
            objects: ['person', 'building', 'sky'],
            colors: ['blue', 'white', 'gray'],
            confidence: 0.87,
            tags: ['outdoor', 'architecture', 'urban']
        };
        
        browser.tabs.sendMessage(tabId, {
            action: 'showImageAnalysis',
            imageUrl: imageUrl,
            analysis: analysis
        });
    }, 2000);
}

// Extract text from media files
async function extractTextFromMedia(mediaUrl, tabId) {
    console.log('Extracting text from:', mediaUrl);
    
    // Simulate OCR/text extraction
    setTimeout(() => {
        const extractedText = {
            text: 'Sample extracted text from media file...',
            confidence: 0.92,
            language: 'en',
            lines: 5
        };
        
        browser.tabs.sendMessage(tabId, {
            action: 'showExtractedText',
            mediaUrl: mediaUrl,
            extraction: extractedText
        });
    }, 3000);
}

console.log('Media Showcase Pro: Background script loaded');