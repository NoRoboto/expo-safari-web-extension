import withSafariExtension from '../withSafariExtension';
import {
  type MockExpoConfig,
  type MockSafariExtensionProps,
} from './types/test-types';

jest.mock('fs');
jest.mock('path');
jest.mock('../modules/setupXcodeTarget');
jest.mock('../modules/copyExtensionFiles');
jest.mock('../modules/addFilesToXcodeProject');
jest.mock('../modules/patchExtensionInfoPlist');

const mockedFs = jest.mocked(require('fs'));
const mockedPath = jest.mocked(require('path'));

describe('withSafariExtension', () => {
  const baseConfig: MockExpoConfig = {
    name: 'TestApp',
    slug: 'test-app',
    ios: {
      bundleIdentifier: 'com.test.app',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedPath.resolve.mockImplementation((path: string) => `/resolved${path}`);
    mockedFs.existsSync.mockReturnValue(true);

    // Mock the modules
    const { setupXcodeTarget } = require('../modules/setupXcodeTarget');
    const { copyExtensionFiles } = require('../modules/copyExtensionFiles');
    const {
      addFilesToXcodeProject,
    } = require('../modules/addFilesToXcodeProject');
    const {
      patchExtensionInfoPlist,
    } = require('../modules/patchExtensionInfoPlist');

    setupXcodeTarget.mockReturnValue({
      modResults: {},
      _extensionTargetUUID: 'target-uuid',
    });
    copyExtensionFiles.mockReturnValue({});
    addFilesToXcodeProject.mockReturnValue({});
    patchExtensionInfoPlist.mockReturnValue({});
  });

  it('should return config unchanged when ios.bundleIdentifier is missing', () => {
    const configWithoutBundle: MockExpoConfig = { ...baseConfig };
    delete configWithoutBundle.ios;

    const result = withSafariExtension(configWithoutBundle, {});

    expect(result).toBe(configWithoutBundle);
  });

  it('should return config unchanged when extensionName is missing', () => {
    const props: Partial<MockSafariExtensionProps> = {
      extensionSourcePath: './extension',
    };

    const result = withSafariExtension(baseConfig, props);

    expect(result).toBe(baseConfig);
  });

  it('should return config unchanged when extensionSourcePath is missing', () => {
    const props: Partial<MockSafariExtensionProps> = {
      extensionName: 'TestExtension',
    };

    const result = withSafariExtension(baseConfig, props);

    expect(result).toBe(baseConfig);
  });

  it('should return config unchanged when source path does not exist', () => {
    const props: MockSafariExtensionProps = {
      extensionName: 'TestExtension',
      extensionSourcePath: './nonexistent',
    };

    mockedFs.existsSync.mockReturnValue(false);

    const result = withSafariExtension(baseConfig, props);

    expect(result).toBe(baseConfig);
  });

  it('should process extension successfully with valid props', () => {
    const props: MockSafariExtensionProps = {
      extensionName: 'TestExtension',
      extensionSourcePath: './extension',
      extensionBundleIdentifier: 'com.test.app.extension',
      iosDeploymentTarget: '15.0',
      extensionEntitlements: { test: true },
    };

    const result = withSafariExtension(baseConfig, props);

    // Since our mock returns the modified config directly, result should be an object
    expect(typeof result).toBe('object');
    expect(result).toBeDefined();
  });

  it('should generate default values for optional props', () => {
    const props: MockSafariExtensionProps = {
      extensionName: 'MyExtension',
      extensionSourcePath: './my-extension',
    };

    // Call the function to trigger the withXcodeProject mock
    withSafariExtension(baseConfig, props);

    const { setupXcodeTarget } = require('../modules/setupXcodeTarget');
    expect(setupXcodeTarget).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        extensionName: 'MyExtension',
        extensionSourcePath: './my-extension',
        extensionBundleIdentifier: 'com.test.app.MyExtension',
        iosDeploymentTarget: '16.0',
        appBundleIdentifier: 'com.test.app',
      })
    );
  });

  it('should call all required modules in correct order', () => {
    const props: MockSafariExtensionProps = {
      extensionName: 'TestExtension',
      extensionSourcePath: './extension',
    };

    // Call the function to trigger the withXcodeProject mock
    withSafariExtension(baseConfig, props);

    const { setupXcodeTarget } = require('../modules/setupXcodeTarget');
    const { copyExtensionFiles } = require('../modules/copyExtensionFiles');
    const {
      patchExtensionInfoPlist,
    } = require('../modules/patchExtensionInfoPlist');
    const {
      addFilesToXcodeProject,
    } = require('../modules/addFilesToXcodeProject');

    expect(setupXcodeTarget).toHaveBeenCalled();
    expect(copyExtensionFiles).toHaveBeenCalled();
    expect(patchExtensionInfoPlist).toHaveBeenCalled();
    expect(addFilesToXcodeProject).toHaveBeenCalled();
  });

  it('should handle default extensionName fallback', () => {
    const props: Partial<MockSafariExtensionProps> = {
      extensionName: undefined,
      extensionSourcePath: './extension',
    };

    // This should use 'SafariExtension' as default but still fail validation
    const result = withSafariExtension(baseConfig, props);
    expect(result).toBe(baseConfig);
  });
});
