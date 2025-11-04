import SafariServices
import os.log

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {
    
    func beginRequest(with context: NSExtensionContext) {
        let item = context.inputItems[0] as! NSExtensionItem
        let message = item.userInfo?[SFExtensionMessageKey]
        
        os_log(.default, "Media Showcase Pro: Received message from browser")
        
        let response = NSExtensionItem()
        response.userInfo = [ SFExtensionMessageKey: [ "response": "Media Showcase Pro handler active" ] ]
        
        context.completeRequest(returningItems: [response], completionHandler: nil)
    }
    
}