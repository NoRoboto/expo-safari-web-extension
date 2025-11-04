# Testing Safari Web Extensions

## Quick Start

1. **Go to example folder**
   ```bash
   cd example
   ```

2. **Choose extension to test** - Edit `app.json` and change `extensionSourcePath`:
   ```json
   "extensionSourcePath": "./safari-extension"
   ```
   
   Available options:
   - `"./safari-extension"` - Basic extension
   - `"./safari-extension-media"` - Media files example
   - `"./safari-extension-password"` - Password manager example
   - `"./safari-extension-translator"` - Text translator
   - `"./safari-extension-adblocker"` - Ad blocker

3. **Build iOS project**
   ```bash
   npx expo prebuild --platform ios
   ```

4. **Configure code signing** (first time only)
   - Open `ios/examplesafariext.xcworkspace` in Xcode
   - Select project → Signing & Capabilities
   - Enable "Automatically manage signing" for BOTH targets:
     - `examplesafariext` (main app)
     - `ExampleSafariExtension` (extension)
   - Select your Apple Developer Team

5. **Run on device**
   ```bash
   npx expo run:ios
   ```

6. **Enable extension on device**
   - iOS Settings → Safari → Extensions → Enable your app extension

## Notes

- Code signing required for both app and extension targets
- Apple Developer Account needed for device / simulator testing