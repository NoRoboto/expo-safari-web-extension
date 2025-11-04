# Safari Extension Example App

This example demonstrates how to use the `expo-safari-web-extension` plugin.

## Quick Start

1. **Build the plugin first:**
   ```bash
   yarn prepare
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Prebuild for iOS:**
   ```bash
   npx expo prebuild --platform ios
   ```

4. **Open in Xcode:**
   ```bash
   open ios/ExampleSafariExtension.xcworkspace
   ```

5. **Configure signing in Xcode and run**

## What's Included

- **Main React Native App**: Basic Expo app that hosts the Safari extension
- **Safari Extension**: Example web extension with:
  - Background script for extension logic
  - Content script that adds a badge to web pages
  - Popup UI for user interaction
  - Swift bridge for native communication

## Plugin Configuration

See `app.json` for the plugin configuration:

```json
{
  "plugins": [
    [
      "../plugin/build",
      {
        "extensionName": "ExampleSafariExtension",
        "extensionSourcePath": "./safari-extension",
        "extensionBundleIdentifier": "exposafariwebextension.example.safari",
        "iosDeploymentTarget": "16.0",
        "extensionEntitlements": {
          "com.apple.security.app-sandbox": true,
          "com.apple.security.files.user-selected.read-only": true
        }
      }
    ]
  ]
}
```

## Testing

1. Run the app in Xcode
2. Go to iOS Settings → Safari → Extensions
3. Enable "Example Safari Extension"
4. Open Safari and visit any website
5. Look for the extension badge and test the functionality

For detailed testing instructions, see `../TESTING.md`.

## File Structure

```
safari-extension/
├── SafariWebExtensionHandler.swift     # Swift bridge
├── Info.plist                          # Extension config
├── ExampleSafariExtension.entitlements # Permissions
└── Resources/                           # Web extension
    ├── manifest.json
    ├── popup.html
    ├── popup.js
    ├── background.js
    └── content.js
```