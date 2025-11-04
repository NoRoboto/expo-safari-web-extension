import { addFilesToXcodeProject } from '../../modules/addFilesToXcodeProject';
import {
  createMockXcodeProjectConfig,
  createMockXcodeProject,
  createMockPBXProjectObjects,
  type MockAddFilesToXcodeProjectProps,
  type MockXcodeProjectConfig,
} from '../types/test-types';

// Mock all dependencies
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  statSync: jest.fn(),
  readdirSync: jest.fn(),
}));

jest.mock('../../modules/xcode-project/pbxGroupManager', () => {
  const actual = jest.requireActual(
    '../../modules/xcode-project/pbxGroupManager'
  );
  return {
    ...actual,
    ensurePBXGroup: jest.fn(),
    getMainProjectGroup: jest.fn(),
    removeExistingPBXGroup: jest.fn(),
  };
});

jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
}));

jest.mock('../../modules/xcode-project/pbxGroupManager', () => ({
  getMainProjectGroup: jest.fn().mockReturnValue('main-group-uuid'),
  ensurePBXGroup: jest.fn().mockReturnValue({
    groupUUID: 'ext-group-uuid',
    wasCreated: true,
  }),
}));

jest.mock('../../modules/xcode-project/buildPhaseManager', () => ({
  ensureBuildPhaseForTarget: jest.fn().mockReturnValue({
    phaseObject: { files: [] },
    phaseUUID: 'phase-uuid',
  }),
  addFileToBuildPhase: jest.fn(),
}));

jest.mock('../../modules/xcode-project/fileReferenceManager', () => ({
  createFileReference: jest.fn().mockReturnValue({
    fileRefUUID: 'file-ref-uuid',
    buildFileUUID: 'build-file-uuid',
  }),
}));

describe('addFilesToXcodeProject', () => {
  const mockConfig: MockXcodeProjectConfig = createMockXcodeProjectConfig({
    modResults: {
      ...createMockXcodeProject(),
      hash: {
        project: {
          objects: createMockPBXProjectObjects({
            PBXNativeTarget: {
              'target-uuid': {
                name: '"TestExtension"',
                buildPhases: [],
              },
            },
          }),
        },
      },
    } as any,
    _extensionTargetUUID: 'target-uuid',
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return config unchanged when extension target UUID is missing', () => {
    const configWithoutTarget = createMockXcodeProjectConfig({
      modResults: mockConfig.modResults,
      _extensionTargetUUID: undefined,
    });

    const props: MockAddFilesToXcodeProjectProps = {
      extensionName: 'TestExtension',
    };

    const result = addFilesToXcodeProject(configWithoutTarget, props);

    expect(result).toBe(configWithoutTarget);
  });

  it('should return config unchanged when pbxProjectObjects is not available', () => {
    const configWithoutObjects = createMockXcodeProjectConfig({
      modResults: {} as any,
      _extensionTargetUUID: 'target-uuid',
    });

    const props: MockAddFilesToXcodeProjectProps = {
      extensionName: 'TestExtension',
    };

    const result = addFilesToXcodeProject(configWithoutObjects, props);

    expect(result).toBe(configWithoutObjects);
  });

  it('should return config unchanged when target is not found', () => {
    const configWithoutTarget = {
      ...mockConfig,
      modResults: {
        hash: {
          project: {
            objects: {
              PBXNativeTarget: {},
              PBXGroup: {},
            },
          },
        },
      },
    };

    const result = addFilesToXcodeProject(configWithoutTarget as any, {
      extensionName: 'TestExtension',
    });

    expect(result).toBe(configWithoutTarget);
  });

  it('should execute without errors for valid configuration', () => {
    const props = {
      extensionName: 'TestExtension',
      handlerFileName: 'Handler.swift',
    };

    const result = addFilesToXcodeProject(mockConfig as any, props);

    // Function should complete successfully and return the config
    expect(result).toBe(mockConfig);
  });

  it('should handle extension with entitlements', () => {
    const props = {
      extensionName: 'TestExtension',
      extensionEntitlements: { 'com.apple.security.app-sandbox': true },
    };

    const result = addFilesToXcodeProject(mockConfig as any, props);

    expect(result).toBe(mockConfig);
  });

  it('should handle extension with custom Info.plist name', () => {
    const props = {
      extensionName: 'TestExtension',
      infoPlistName: 'CustomInfo.plist',
    };

    const result = addFilesToXcodeProject(mockConfig as any, props);

    expect(result).toBe(mockConfig);
  });
});
