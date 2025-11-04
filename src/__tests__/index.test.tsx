import withSafariExtension from '../index';

describe('expo-safari-web-extension', () => {
  it('should export withSafariExtension as default', () => {
    expect(withSafariExtension).toBeDefined();
    expect(typeof withSafariExtension).toBe('function');
  });

  it('should be a valid Expo config plugin', () => {
    const mockConfig = {
      name: 'TestApp',
      slug: 'test-app',
      ios: {
        bundleIdentifier: 'com.test.app',
      },
    };

    const props = {
      extensionName: 'TestExtension',
      extensionSourcePath: './extension',
    };

    // Should return the original config when source path doesn't exist
    const result = withSafariExtension(mockConfig, props);
    expect(result).toBe(mockConfig);
  });
});
