import SafariServices
import os.log

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {
    
    func beginRequest(with context: NSExtensionContext) {
        let request = context.inputItems.first as? NSExtensionItem
        
        let profile = request?.attachments?.first
        if let profile = profile {
            profile.loadItem(forTypeIdentifier: profile.registeredTypeIdentifiers.first!) { (profileDict, error) in
                guard let profileDict = profileDict as? [String: Any] else { return }
                
                // Handle the request from the JavaScript context
                let response = NSExtensionItem()
                
                // Example: Echo back the received message
                if let message = profileDict["message"] as? String {
                    os_log(.default, "Received message from extension: %@", message)
                    
                    let responseDict: [String: Any] = [
                        "response": "Hello from Swift! Received: \(message)",
                        "timestamp": Date().timeIntervalSince1970
                    ]
                    
                    response.attachments = [NSItemProvider(item: responseDict as NSSecureCoding, typeIdentifier: "application/json")]
                }
                
                context.completeRequest(returningItems: [response], completionHandler: nil)
            }
        }
    }
}