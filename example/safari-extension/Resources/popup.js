document.addEventListener('DOMContentLoaded', function() {
    const testButton = document.getElementById('testButton');
    const status = document.getElementById('status');
    
    testButton.addEventListener('click', function() {
        status.textContent = 'Testing...';
        
        // Send a message to the background script
        browser.runtime.sendMessage({
            type: 'TEST_MESSAGE',
            data: 'Hello from popup!'
        }, function(response) {
            if (response) {
                status.textContent = `Response: ${response.message}`;
            } else {
                status.textContent = 'No response received';
            }
        });
        
        // Test native messaging to Swift
        browser.runtime.sendNativeMessage('application.id', {
            message: 'Hello from JavaScript!'
        }, function(response) {
            console.log('Native response:', response);
        });
    });
    
    // Update status on load
    status.textContent = 'Extension loaded successfully!';
});