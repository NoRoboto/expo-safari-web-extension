import { createFileReference } from '../../../modules/xcode-project/fileReferenceManager';
import {
  createMockXcodeProject,
  createMockPBXProjectObjects,
  type MockPBXProjectObjects,
  type MockFileToAdd,
} from '../../types/test-types';

jest.mock('../../../modules/xcodeFileTypes', () => ({
  getXcodeFileReferenceType: jest.fn().mockReturnValue('sourcecode.swift'),
}));

jest.mock('../../../modules/xcode-project/xcodeUtils', () => ({
  generateNewXcodeId: jest.fn().mockReturnValue('new-uuid'),
  quote: jest.fn().mockImplementation((str) => `"${str}"`),
}));

describe('fileReferenceManager', () => {
  describe('createFileReference', () => {
    const mockProject = createMockXcodeProject();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return existing file reference when found', () => {
      const mockPbxProjectObjects: MockPBXProjectObjects = {
        PBXGroup: {
          'group-uuid': {
            isa: '"PBXGroup"',
            children: [{ value: 'existing-file-ref', comment: 'test.swift' }],
          },
        },
        PBXFileReference: {
          'existing-file-ref': {
            isa: '"PBXFileReference"',
            lastKnownFileType: '"sourcecode.swift"',
            path: '"test.swift"',
            name: '"test.swift"',
            sourceTree: '"<group>"',
          },
        },
      };

      const fileInfo: MockFileToAdd = {
        fileNameForXcode: 'test.swift',
        groupUUID: 'group-uuid',
        addToPhaseType: null,
        isDirectory: false,
      };

      const result = createFileReference(
        mockProject,
        mockPbxProjectObjects,
        fileInfo
      );

      expect(result.fileRefUUID).toBe('existing-file-ref');
      expect(result.buildFileUUID).toBeUndefined();
    });

    it('should create new file reference when not found', () => {
      const mockPbxProjectObjects = createMockPBXProjectObjects({
        PBXGroup: {
          'group-uuid': {
            isa: '"PBXGroup"',
            children: [],
          },
        },
      });

      const fileInfo: MockFileToAdd = {
        fileNameForXcode: 'new.swift',
        groupUUID: 'group-uuid',
        addToPhaseType: null,
        isDirectory: false,
      };

      const result = createFileReference(
        mockProject,
        mockPbxProjectObjects,
        fileInfo
      );

      expect(result.fileRefUUID).toBe('new-uuid');
      expect(mockPbxProjectObjects.PBXFileReference!['new-uuid']).toMatchObject(
        {
          isa: '"PBXFileReference"',
          lastKnownFileType: '"sourcecode.swift"',
          name: '"new.swift"',
          path: '"new.swift"',
          sourceTree: '"<group>"',
        }
      );
    });

    it('should create build file when addToPhaseType is specified', () => {
      const mockPbxProjectObjects = createMockPBXProjectObjects({
        PBXGroup: {
          'group-uuid': {
            isa: '"PBXGroup"',
            children: [],
          },
        },
      });

      const fileInfo: MockFileToAdd = {
        fileNameForXcode: 'source.swift',
        groupUUID: 'group-uuid',
        addToPhaseType: 'Sources',
        isDirectory: false,
      };

      const {
        generateNewXcodeId,
      } = require('../../../modules/xcode-project/xcodeUtils');
      generateNewXcodeId
        .mockReturnValueOnce('file-ref-uuid')
        .mockReturnValueOnce('build-file-uuid');

      const result = createFileReference(
        mockProject,
        mockPbxProjectObjects,
        fileInfo
      );

      expect(result.fileRefUUID).toBe('file-ref-uuid');
      expect(result.buildFileUUID).toBe('build-file-uuid');
      expect(
        mockPbxProjectObjects.PBXBuildFile!['build-file-uuid']
      ).toMatchObject({
        isa: '"PBXBuildFile"',
        fileRef: 'file-ref-uuid',
      });
    });

    it('should handle missing group gracefully', () => {
      const mockPbxProjectObjects = createMockPBXProjectObjects();

      const fileInfo: MockFileToAdd = {
        fileNameForXcode: 'test.swift',
        groupUUID: 'missing-group',
        addToPhaseType: null,
        isDirectory: false,
      };

      const result = createFileReference(
        mockProject,
        mockPbxProjectObjects,
        fileInfo
      );

      expect(result.fileRefUUID).toBe('');
      expect(result.buildFileUUID).toBeUndefined();
    });

    it('should reuse existing build file', () => {
      const mockPbxProjectObjects: MockPBXProjectObjects = {
        PBXGroup: {
          'group-uuid': {
            isa: '"PBXGroup"',
            children: [{ value: 'file-ref-uuid', comment: 'test.swift' }],
          },
        },
        PBXFileReference: {
          'file-ref-uuid': {
            isa: '"PBXFileReference"',
            lastKnownFileType: '"sourcecode.swift"',
            path: '"test.swift"',
            name: '"test.swift"',
            sourceTree: '"<group>"',
          },
        },
        PBXBuildFile: {
          'existing-build-file': {
            isa: '"PBXBuildFile"',
            fileRef: 'file-ref-uuid',
          },
        },
      };

      const fileInfo: MockFileToAdd = {
        fileNameForXcode: 'test.swift',
        groupUUID: 'group-uuid',
        addToPhaseType: 'Sources',
        isDirectory: false,
      };

      const result = createFileReference(
        mockProject,
        mockPbxProjectObjects,
        fileInfo
      );

      expect(result.fileRefUUID).toBe('file-ref-uuid');
      expect(result.buildFileUUID).toBe('existing-build-file');
    });
  });
});
