# Expo Safari Web Extension

An Expo plugin that adds Safari Web Extension support to your iOS app.

## Installation

```bash
npm install expo-safari-web-extension
```

## Configuration

Add the plugin to your `app.json` or `app.config.js`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-safari-web-extension",
        {
          "extensionName": "MyExtension",
          "extensionSourcePath": "./safari-extension",
          "extensionBundleIdentifier": "com.yourapp.extension",
          "iosDeploymentTarget": "16.0",
          "extensionEntitlements": {
            "com.apple.security.app-sandbox": true,
            "com.apple.security.files.user-selected.read-only": true
          }
        }
      ]
    ]
  }
}
```

## Required File Structure

Your Safari extension folder must follow this structure:

```
safari-extension/
├── SafariWebExtensionHandler.swift    # Swift bridge code
├── Info.plist                         # Extension metadata  
├── YourExtension.entitlements         # Sandbox permissions
└── Resources/                         # Web extension files
    ├── manifest.json                  # Extension manifest
    ├── popup.html                     # Extension popup UI
    ├── popup.js                       # Popup logic
    ├── background.js                  # Background script
    ├── content.js                     # Content script
    └── images/                        # Extension icons
        ├── icon-16.png
        ├── icon-32.png  
        ├── icon-48.png
        └── icon-128.png
```

This structure follows [Apple's Safari Web Extensions guidelines](https://developer.apple.com/documentation/safariservices/safari_web_extensions) and [Web Extensions standards](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions).

## Options

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `extensionName` | string | ✅ | Name of your Safari extension |
| `extensionSourcePath` | string | ✅ | Path to extension source files |
| `extensionBundleIdentifier` | string | ❌ | Bundle ID for extension (defaults to `{appId}.{extensionName}`) |
| `iosDeploymentTarget` | string | ❌ | iOS version target (default: "16.0") |
| `extensionEntitlements` | object | ❌ | Extension sandbox permissions |

## Supported File Types

The plugin automatically handles file type detection for Xcode. See the [complete list of supported file types](plugin/src/modules/xcodeFileTypes.ts) including:

- Swift source files (`.swift`)
- Web files (`.html`, `.js`, `.css`, `.json`)
- Images (`.png`, `.jpg`, `.svg`)
- Data models (`.xcdatamodeld`, `.mlmodel`)
- Asset catalogs (`.xcassets`)
- And 70+ more file types

## Requirements

- iOS 16.0+
- Xcode 15.0+
- Apple Developer Account (for device testing)

## Example

See the [example app](example/) for a complete implementation.

## Testing

1. Build your app with Expo prebuild
2. Open the generated Xcode project
3. Configure code signing for both app and extension targets
4. Run on device or simulator
5. Enable extension in iOS Settings → Safari → Extensions

For detailed testing instructions, see [TESTING.md](TESTING.md).

## License

MIT
