import {
  ensurePBXGroup,
  getMainProjectGroup,
} from '../../../modules/xcode-project/pbxGroupManager';
import {
  createMockXcodeProject,
  createMockPBXProjectObjects,
  type MockPBXProjectObjects,
} from '../../types/test-types';

jest.mock('../../../modules/xcode-project/xcodeUtils', () => ({
  generateNewXcodeId: jest.fn().mockReturnValue('new-uuid'),
  quote: jest.fn().mockImplementation((str) => `"${str}"`),
}));

describe('pbxGroupManager', () => {
  describe('ensurePBXGroup', () => {
    const mockProject = createMockXcodeProject();

    it('should return existing group when found', () => {
      const mockPbxProjectObjects: MockPBXProjectObjects = {
        PBXGroup: {
          'parent-uuid': {
            isa: '"PBXGroup"',
            children: [{ value: 'existing-uuid', comment: 'TestGroup' }],
          },
          'existing-uuid': {
            isa: '"PBXGroup"',
            children: [],
            path: '"TestGroup"',
            name: '"TestGroup"',
            sourceTree: '"<group>"',
          },
        },
      };

      const result = ensurePBXGroup(
        mockProject,
        mockPbxProjectObjects,
        'parent-uuid',
        'TestGroup'
      );

      expect(result.groupUUID).toBe('existing-uuid');
      expect(result.wasCreated).toBe(false);
    });

    it('should create new group when not found', () => {
      const mockPbxProjectObjects = createMockPBXProjectObjects({
        PBXGroup: {
          'parent-uuid': {
            isa: '"PBXGroup"',
            children: [],
          },
        },
      });

      const result = ensurePBXGroup(
        mockProject,
        mockPbxProjectObjects,
        'parent-uuid',
        'NewGroup'
      );

      expect(result.groupUUID).toBe('new-uuid');
      expect(result.wasCreated).toBe(true);
      expect(mockPbxProjectObjects.PBXGroup!['new-uuid']).toMatchObject({
        isa: '"PBXGroup"',
        children: [],
        name: '"NewGroup"',
        path: '"NewGroup"',
        sourceTree: '"<group>"',
      });
    });

    it('should handle missing parent group gracefully', () => {
      const mockPbxProjectObjects = createMockPBXProjectObjects();

      const result = ensurePBXGroup(
        mockProject,
        mockPbxProjectObjects,
        'nonexistent-uuid',
        'TestGroup'
      );

      expect(result.groupUUID).toBe('');
      expect(result.wasCreated).toBe(false);
    });

    it('should initialize PBXGroup section if missing', () => {
      const mockPbxProjectObjects: MockPBXProjectObjects = {};

      const result = ensurePBXGroup(
        mockProject,
        mockPbxProjectObjects,
        'parent-uuid',
        'TestGroup'
      );

      expect(result.groupUUID).toBe('');
      expect(result.wasCreated).toBe(false);
    });
  });

  describe('getMainProjectGroup', () => {
    it('should return main project group UUID when found', () => {
      const mockProject = createMockXcodeProject({
        getFirstProject: jest.fn().mockReturnValue({
          firstProject: {
            mainGroup: 'main-group-uuid',
          },
        }),
      });

      const mockPbxProjectObjects: MockPBXProjectObjects = {
        PBXGroup: {
          'main-group-uuid': {
            isa: '"PBXGroup"',
            children: [],
            name: '"MainGroup"',
          },
        },
      };

      const result = getMainProjectGroup(mockProject, mockPbxProjectObjects);

      expect(result).toBe('main-group-uuid');
    });

    it('should return null when main group not found', () => {
      const mockProject = createMockXcodeProject({
        getFirstProject: jest.fn().mockReturnValue({
          firstProject: {
            mainGroup: 'nonexistent-uuid',
          },
        }),
      });

      const mockPbxProjectObjects = createMockPBXProjectObjects();

      const result = getMainProjectGroup(mockProject, mockPbxProjectObjects);

      expect(result).toBe(null);
    });

    it('should return null when getFirstProject returns null', () => {
      const mockProject = createMockXcodeProject({
        getFirstProject: jest.fn().mockReturnValue({
          firstProject: null,
        }),
      });

      const result = getMainProjectGroup(
        mockProject,
        createMockPBXProjectObjects()
      );

      expect(result).toBe(null);
    });
  });
});
