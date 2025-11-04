/**
 * Type-safe interfaces for test mocks
 * Eliminates the need for 'any' types in tests
 */

// Xcode Build Settings
export interface MockXcodeBuildSettings {
  PRODUCT_NAME: string;
  PRODUCT_BUNDLE_IDENTIFIER?: string;
  IPHONEOS_DEPLOYMENT_TARGET?: string;
  CODE_SIGN_ENTITLEMENTS?: string;
  INFOPLIST_FILE?: string;
  PRODUCT_TYPE?: string;
  SKIP_INSTALL?: string;
  TARGETED_DEVICE_FAMILY?: string;
  SWIFT_VERSION?: string;
  [key: string]: string | undefined;
}

// Xcode Project Mock
export interface MockXcodeProject {
  generateUuid?: jest.Mock<string, []>;
  generateId?: jest.Mock<string, []>;
  pbxNativeTargetSection?: jest.Mock<Record<string, MockPBXNativeTarget>, []>;
  getFirstTarget?: jest.Mock<MockPBXTarget, []>;
  addTarget?: jest.Mock<{ uuid: string }, [string, string, string, string]>;
  pbxXCBuildConfigurationSection?: jest.Mock<
    Record<string, MockXCBuildConfiguration>,
    []
  >;
  getFirstProject?: jest.Mock<MockProjectInfo | null, []>;
  hash?: {
    project: {
      objects: MockPBXProjectObjects;
    };
  };
  [key: string]: unknown;
}

// PBX Objects
export interface MockPBXNativeTarget {
  name: string;
  productName?: string;
  buildPhases?: Array<{ value: string; comment: string }>;
  [key: string]: unknown;
}

export interface MockPBXTarget {
  name: string;
  firstTarget?: { name: string };
  [key: string]: unknown;
}

export interface MockXCBuildConfiguration {
  isa: string;
  buildSettings: MockXcodeBuildSettings;
}

export interface MockProjectInfo {
  firstProject: {
    mainGroup: string;
  } | null;
}

// PBX Project Objects Structure
export interface MockPBXProjectObjects {
  PBXNativeTarget?: Record<string, MockPBXNativeTarget>;
  PBXGroup?: Record<string, MockPBXGroup>;
  PBXFileReference?: Record<string, MockPBXFileReference>;
  PBXBuildFile?: Record<string, MockPBXBuildFile>;
  PBXSourcesBuildPhase?: Record<string, MockPBXBuildPhase>;
  PBXResourcesBuildPhase?: Record<string, MockPBXBuildPhase>;
  [key: string]: Record<string, unknown> | undefined;
}

export interface MockPBXGroup {
  isa?: string;
  children: Array<{ value: string; comment: string }>;
  name?: string;
  path?: string;
  sourceTree?: string;
  [key: string]: unknown;
}

export interface MockPBXFileReference {
  isa: string;
  lastKnownFileType: string;
  name: string;
  path: string;
  sourceTree: string;
  [key: string]: unknown;
}

export interface MockPBXBuildFile {
  isa: string;
  fileRef: string;
  [key: string]: unknown;
}

export interface MockPBXBuildPhase {
  isa: string;
  buildActionMask: string;
  files: Array<{ value: string; comment: string }>;
  runOnlyForDeploymentPostprocessing: string;
  [key: string]: unknown;
}

// Config Interfaces
export interface MockModRequest {
  projectRoot: string;
  platformProjectRoot: string;
}

export interface MockXcodeProjectConfig {
  modResults: MockXcodeProject;
  modRequest: MockModRequest;
  _extensionTargetUUID?: string;
}

export interface MockProjectConfig {
  modRequest: MockModRequest;
}

export interface MockPlistConfig {
  modRequest: MockModRequest;
}

// Test Props
export interface MockSafariExtensionProps {
  extensionName: string;
  extensionSourcePath: string;
  extensionBundleIdentifier?: string;
  iosDeploymentTarget?: string;
  extensionEntitlements?: Record<string, unknown>;
}

export interface MockSetupXcodeTargetProps extends MockSafariExtensionProps {
  appBundleIdentifier: string;
  extensionBundleIdentifier: string;
}

export interface MockCopyExtensionFilesProps {
  extensionName: string;
  extensionSourcePath: string;
  extensionEntitlements?: Record<string, unknown>;
}

export interface MockPatchExtensionInfoPlistProps {
  extensionName: string;
  extensionBundleIdentifier: string;
}

export interface MockAddFilesToXcodeProjectProps {
  extensionName: string;
  handlerFileName?: string;
  infoPlistName?: string;
  extensionEntitlements?: Record<string, unknown>;
}

// File Reference Types
export interface MockFileToAdd {
  fileNameForXcode: string;
  groupUUID: string;
  addToPhaseType: string | null;
  isDirectory: boolean;
}

export interface MockFileReferenceResult {
  fileRefUUID: string;
  buildFileUUID?: string;
}

export interface MockPBXGroupCreationResult {
  groupUUID: string;
  wasCreated: boolean;
}

export interface MockBuildPhaseResult {
  phaseObject: MockPBXBuildPhase | null;
  phaseUUID: string;
}

// Expo Config
export interface MockExpoConfig {
  name: string;
  slug: string;
  ios?: {
    bundleIdentifier: string;
  };
  [key: string]: unknown;
}

// Utility Functions for Creating Mocks
export const createMockBuildSettings = (
  overrides: Partial<MockXcodeBuildSettings> = {}
): MockXcodeBuildSettings => ({
  PRODUCT_NAME: '"DefaultExtension"',
  ...overrides,
});

export const createMockPBXProjectObjects = (
  overrides: Partial<MockPBXProjectObjects> = {}
): MockPBXProjectObjects => ({
  PBXNativeTarget: {},
  PBXGroup: {},
  PBXFileReference: {},
  PBXBuildFile: {},
  PBXSourcesBuildPhase: {},
  PBXResourcesBuildPhase: {},
  ...overrides,
});

export const createMockXcodeProject = (
  overrides: Partial<MockXcodeProject> = {}
): MockXcodeProject => ({
  generateUuid: jest.fn().mockReturnValue('mock-uuid'),
  generateId: jest.fn().mockReturnValue('mock-id'),
  pbxNativeTargetSection: jest.fn().mockReturnValue({}),
  getFirstTarget: jest.fn().mockReturnValue({ name: 'MockTarget' }),
  addTarget: jest.fn().mockReturnValue({ uuid: 'mock-target-uuid' }),
  pbxXCBuildConfigurationSection: jest.fn().mockReturnValue({}),
  getFirstProject: jest.fn().mockReturnValue({
    firstProject: { mainGroup: 'main-group-uuid' },
  }),
  ...overrides,
});

export const createMockModRequest = (
  overrides: Partial<MockModRequest> = {}
): MockModRequest => ({
  projectRoot: '/mock/project',
  platformProjectRoot: '/mock/ios',
  ...overrides,
});

export const createMockProjectConfig = (
  overrides: Partial<MockProjectConfig> = {}
): MockProjectConfig => ({
  modRequest: createMockModRequest(),
  ...overrides,
});

export const createMockXcodeProjectConfig = (
  overrides: Partial<MockXcodeProjectConfig> = {}
): MockXcodeProjectConfig => ({
  modResults: createMockXcodeProject(),
  modRequest: createMockModRequest(),
  ...overrides,
});
