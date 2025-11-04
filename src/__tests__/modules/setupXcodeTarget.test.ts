import { setupXcodeTarget } from '../../modules/setupXcodeTarget';
import {
  createMockXcodeProject,
  createMockXcodeProjectConfig,
  createMockBuildSettings,
  type MockXCBuildConfiguration,
  type MockSetupXcodeTargetProps,
} from '../types/test-types';

describe('setupXcodeTarget', () => {
  const mockProject = createMockXcodeProject();
  const mockConfig = createMockXcodeProjectConfig({
    modResults: mockProject,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error when required props are missing', () => {
    const props: MockSetupXcodeTargetProps = {
      extensionName: '',
      extensionSourcePath: './extension',
      appBundleIdentifier: 'com.test.app',
      extensionBundleIdentifier: 'com.test.app.extension',
    };

    expect(() => setupXcodeTarget(mockConfig, props)).toThrow(
      '[setupXcodeTarget] extensionName, appBundleIdentifier, and extensionBundleIdentifier are required.'
    );
  });

  it('should reuse existing target when found', () => {
    const props: MockSetupXcodeTargetProps = {
      extensionName: 'TestExtension',
      extensionSourcePath: './extension',
      appBundleIdentifier: 'com.test.app',
      extensionBundleIdentifier: 'com.test.app.extension',
    };

    const mockTargets = {
      'target-uuid': {
        name: '"TestExtension"',
        productName: '"TestExtension"',
      },
    };

    mockProject.pbxNativeTargetSection!.mockReturnValue(mockTargets);
    mockProject.pbxXCBuildConfigurationSection!.mockReturnValue({});

    const result = setupXcodeTarget(mockConfig, props);

    expect(result._extensionTargetUUID).toBe('target-uuid');
    expect(mockProject.addTarget).not.toHaveBeenCalled();
  });

  it('should create new target when none exists', () => {
    const props: MockSetupXcodeTargetProps = {
      extensionName: 'NewExtension',
      extensionSourcePath: './extension',
      appBundleIdentifier: 'com.test.app',
      extensionBundleIdentifier: 'com.test.app.extension',
    };

    const configWithoutTarget = createMockXcodeProjectConfig({
      modResults: mockProject,
      _extensionTargetUUID: undefined,
    });

    mockProject.pbxNativeTargetSection!.mockReturnValue({});
    mockProject.getFirstTarget!.mockReturnValue({ name: 'MainApp' });
    mockProject.addTarget!.mockReturnValue({ uuid: 'new-target-uuid' });
    mockProject.pbxXCBuildConfigurationSection!.mockReturnValue({});

    const result = setupXcodeTarget(configWithoutTarget, props);

    expect(result._extensionTargetUUID).toBe('new-target-uuid');
    expect(mockProject.addTarget).toHaveBeenCalledWith(
      'NewExtension',
      'app_extension',
      'NewExtension',
      'MainApp'
    );
  });

  it('should configure build settings correctly', () => {
    const props: MockSetupXcodeTargetProps = {
      extensionName: 'TestExtension',
      extensionSourcePath: './extension',
      appBundleIdentifier: 'com.test.app',
      extensionBundleIdentifier: 'com.test.app.extension',
      iosDeploymentTarget: '15.0',
      extensionEntitlements: { test: true },
    };

    const buildSettings = createMockBuildSettings({
      PRODUCT_NAME: '"TestExtension"',
    });

    const mockBuildConfigs: Record<string, MockXCBuildConfiguration> = {
      'config-uuid': {
        isa: 'XCBuildConfiguration',
        buildSettings,
      },
    };

    mockProject.pbxNativeTargetSection!.mockReturnValue({});
    mockProject.getFirstTarget!.mockReturnValue({ name: 'MainApp' });
    mockProject.addTarget!.mockReturnValue({ uuid: 'target-uuid' });
    mockProject.pbxXCBuildConfigurationSection!.mockReturnValue(
      mockBuildConfigs
    );

    setupXcodeTarget(mockConfig, props);

    expect(buildSettings.PRODUCT_BUNDLE_IDENTIFIER).toBe(
      '"com.test.app.extension"'
    );
    expect(buildSettings.IPHONEOS_DEPLOYMENT_TARGET).toBe('"15.0"');
    expect(buildSettings.CODE_SIGN_ENTITLEMENTS).toBe(
      '"TestExtension/TestExtension.entitlements"'
    );
    expect(buildSettings.INFOPLIST_FILE).toBe('"TestExtension/Info.plist"');
  });
});
