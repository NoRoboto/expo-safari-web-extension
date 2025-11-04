import SafariServices
import os.log

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {
    
    func beginRequest(with context: NSExtensionContext) {
        let item = context.inputItems[0] as! NSExtensionItem
        let message = item.userInfo?[SFExtensionMessageKey]
        
        os_log(.default, "SecurePass Manager: Received message from browser")
        
        let response = NSExtensionItem()
        response.userInfo = [ SFExtensionMessageKey: [ "response": "SecurePass Manager handler active" ] ]
        
        context.completeRequest(returningItems: [response], completionHandler: nil)
    }
    
}