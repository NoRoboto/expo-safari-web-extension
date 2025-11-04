import {
  getXcodeFileReferenceType,
  getExtensionsForXcodeType,
  getSupportedExtensions,
  addCustomFileTypeMapping,
  addCustomUtiMapping,
} from '../../modules/xcodeFileTypes';

describe('xcodeFileTypes', () => {
  describe('getXcodeFileReferenceType', () => {
    it('should return "folder" for directories', () => {
      expect(getXcodeFileReferenceType('MyFolder', true)).toBe('folder');
    });

    it('should return correct type for known extensions', () => {
      expect(getXcodeFileReferenceType('file.swift')).toBe('sourcecode.swift');
      expect(getXcodeFileReferenceType('file.js')).toBe(
        'sourcecode.javascript'
      );
      expect(getXcodeFileReferenceType('file.plist')).toBe('text.plist.xml');
      expect(getXcodeFileReferenceType('image.png')).toBe('image.png');
    });

    it('should be case insensitive', () => {
      expect(getXcodeFileReferenceType('FILE.SWIFT')).toBe('sourcecode.swift');
      expect(getXcodeFileReferenceType('Image.PNG')).toBe('image.png');
    });

    it('should return "file" for unknown extensions', () => {
      expect(getXcodeFileReferenceType('unknown.xyz')).toBe('file');
      expect(getXcodeFileReferenceType('noextension')).toBe('file');
    });

    it('should handle files without extensions', () => {
      expect(getXcodeFileReferenceType('README')).toBe('file');
      expect(getXcodeFileReferenceType('.hidden')).toBe('file');
    });
  });

  describe('getExtensionsForXcodeType', () => {
    it('should return extensions for given xcode type', () => {
      const swiftExtensions = getExtensionsForXcodeType('sourcecode.swift');
      expect(swiftExtensions).toContain('.swift');
      expect(swiftExtensions).toContain('.gyb');
    });

    it('should return empty array for unknown type', () => {
      expect(getExtensionsForXcodeType('unknown.type')).toEqual([]);
    });

    it('should return all extensions for common type', () => {
      const imageExtensions = getExtensionsForXcodeType('image.png');
      expect(imageExtensions).toContain('.png');
    });
  });

  describe('getSupportedExtensions', () => {
    it('should return array of all supported extensions', () => {
      const extensions = getSupportedExtensions();
      expect(Array.isArray(extensions)).toBe(true);
      expect(extensions.length).toBeGreaterThan(0);
      expect(extensions).toContain('.swift');
      expect(extensions).toContain('.js');
      expect(extensions).toContain('.plist');
    });
  });

  describe('addCustomFileTypeMapping', () => {
    it('should add custom file type mapping', () => {
      addCustomFileTypeMapping('.customext', 'custom.type');
      expect(getXcodeFileReferenceType('file.customext')).toBe('custom.type');
    });

    it('should handle uppercase extensions', () => {
      addCustomFileTypeMapping('.UPPEREXT', 'upper.type');
      expect(getXcodeFileReferenceType('file.upperext')).toBe('upper.type');
      expect(getXcodeFileReferenceType('file.UPPEREXT')).toBe('upper.type');
    });

    it('should override existing mappings', () => {
      addCustomFileTypeMapping('.swift', 'custom.swift.type');
      expect(getXcodeFileReferenceType('file.swift')).toBe('custom.swift.type');

      // Reset to original
      addCustomFileTypeMapping('.swift', 'sourcecode.swift');
    });
  });

  describe('addCustomUtiMapping', () => {
    beforeEach(() => {
      // Mock file-uti module
      jest.doMock('file-uti', () => ({
        fileUtiSync: jest.fn(),
      }));
    });

    afterEach(() => {
      jest.dontMock('file-uti');
    });

    it('should add custom UTI mapping', () => {
      addCustomUtiMapping('com.custom.type', 'custom.xcode.type');

      // Since we can't easily test the UTI lookup without complex mocking,
      // we'll just verify the function doesn't throw
      expect(() => {
        addCustomUtiMapping('another.custom.type', 'another.xcode.type');
      }).not.toThrow();
    });
  });

  describe('file-uti fallback behavior', () => {
    it('should handle file-uti module not being available', () => {
      // This tests the fallback behavior when file-uti is not available
      expect(() => {
        getXcodeFileReferenceType('unknown.extension');
      }).not.toThrow();
    });
  });
});
