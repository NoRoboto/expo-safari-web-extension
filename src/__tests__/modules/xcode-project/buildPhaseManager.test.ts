import {
  ensureBuildPhaseForTarget,
  addFileToBuildPhase,
} from '../../../modules/xcode-project/buildPhaseManager';
import {
  createMockXcodeProject,
  createMockPBXProjectObjects,
  type MockPBXProjectObjects,
  type MockPBXNativeTarget,
  type MockPBXBuildPhase,
} from '../../types/test-types';

jest.mock('../../../modules/xcode-project/xcodeUtils', () => ({
  generateNewXcodeId: jest.fn().mockReturnValue('new-phase-uuid'),
  quote: jest.fn().mockImplementation((str) => `"${str}"`),
}));

describe('buildPhaseManager', () => {
  describe('ensureBuildPhaseForTarget', () => {
    const mockProject = createMockXcodeProject();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return existing build phase when found', () => {
      const mockPbxProjectObjects: MockPBXProjectObjects = {
        PBXSourcesBuildPhase: {
          'existing-phase-uuid': {
            isa: '"PBXSourcesBuildPhase"',
            buildActionMask: '"2147483647"',
            files: [],
            runOnlyForDeploymentPostprocessing: '"0"',
          },
        },
      };

      const mockTarget: MockPBXNativeTarget = {
        name: '"TestTarget"',
        buildPhases: [{ value: 'existing-phase-uuid', comment: 'Sources' }],
      };

      const result = ensureBuildPhaseForTarget(
        mockProject,
        mockPbxProjectObjects,
        mockTarget,
        'PBXSourcesBuildPhase',
        'Sources'
      );

      expect(result.phaseUUID).toBe('existing-phase-uuid');
      expect(result.phaseObject).toBe(
        mockPbxProjectObjects.PBXSourcesBuildPhase!['existing-phase-uuid']
      );
    });

    it('should create new build phase when not found', () => {
      const mockPbxProjectObjects = createMockPBXProjectObjects();

      const mockTarget: MockPBXNativeTarget = {
        name: '"TestTarget"',
        buildPhases: [],
      };

      const result = ensureBuildPhaseForTarget(
        mockProject,
        mockPbxProjectObjects,
        mockTarget,
        'PBXSourcesBuildPhase',
        'Sources'
      );

      expect(result.phaseUUID).toBe('new-phase-uuid');
      expect(mockPbxProjectObjects.PBXSourcesBuildPhase).toBeDefined();
      expect(
        mockPbxProjectObjects.PBXSourcesBuildPhase!['new-phase-uuid']
      ).toMatchObject({
        isa: '"PBXSourcesBuildPhase"',
        buildActionMask: '"2147483647"',
        files: [],
        runOnlyForDeploymentPostprocessing: '"0"',
      });
      expect(mockTarget.buildPhases).toContainEqual({
        value: 'new-phase-uuid',
        comment: 'Sources',
      });
    });

    it('should initialize buildPhases array if missing', () => {
      const mockPbxProjectObjects = createMockPBXProjectObjects();
      const mockTarget: MockPBXNativeTarget = {
        name: '"TestTarget"',
        // No buildPhases property initially
      };

      ensureBuildPhaseForTarget(
        mockProject,
        mockPbxProjectObjects,
        mockTarget,
        'PBXSourcesBuildPhase',
        'Sources'
      );

      expect(mockTarget.buildPhases).toBeDefined();
      expect(Array.isArray(mockTarget.buildPhases)).toBe(true);
    });

    it('should initialize files array if missing on phase object', () => {
      const mockPbxProjectObjects: MockPBXProjectObjects = {
        PBXSourcesBuildPhase: {
          'phase-uuid': {
            isa: '"PBXSourcesBuildPhase"',
            buildActionMask: '"2147483647"',
            files: [],
            runOnlyForDeploymentPostprocessing: '"0"',
          },
        },
      };

      const mockTarget: MockPBXNativeTarget = {
        name: '"TestTarget"',
        buildPhases: [{ value: 'phase-uuid', comment: 'Sources' }],
      };

      const result = ensureBuildPhaseForTarget(
        mockProject,
        mockPbxProjectObjects,
        mockTarget,
        'PBXSourcesBuildPhase',
        'Sources'
      );

      expect(result.phaseObject!.files).toBeDefined();
      expect(Array.isArray(result.phaseObject!.files)).toBe(true);
    });
  });

  describe('addFileToBuildPhase', () => {
    it('should add file to build phase when not already present', () => {
      const mockPhaseObject: MockPBXBuildPhase = {
        isa: '"PBXSourcesBuildPhase"',
        buildActionMask: '"2147483647"',
        files: [],
        runOnlyForDeploymentPostprocessing: '"0"',
      };

      addFileToBuildPhase(
        mockPhaseObject,
        'build-file-uuid',
        'test.swift',
        'Sources'
      );

      expect(mockPhaseObject.files).toContainEqual({
        value: 'build-file-uuid',
        comment: 'test.swift in Sources',
      });
    });

    it('should not add duplicate file to build phase', () => {
      const mockPhaseObject: MockPBXBuildPhase = {
        isa: '"PBXSourcesBuildPhase"',
        buildActionMask: '"2147483647"',
        files: [{ value: 'build-file-uuid', comment: 'test.swift in Sources' }],
        runOnlyForDeploymentPostprocessing: '"0"',
      };

      addFileToBuildPhase(
        mockPhaseObject,
        'build-file-uuid',
        'test.swift',
        'Sources'
      );

      expect(mockPhaseObject.files).toHaveLength(1);
    });

    it('should handle phase object with no files array', () => {
      const mockPhaseObject = {} as MockPBXBuildPhase;

      expect(() => {
        addFileToBuildPhase(
          mockPhaseObject,
          'build-file-uuid',
          'test.swift',
          'Sources'
        );
      }).toThrow();
    });
  });
});
