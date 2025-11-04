import {
  generateNewXcodeId,
  quote,
} from '../../../modules/xcode-project/xcodeUtils';

describe('xcodeUtils', () => {
  describe('generateNewXcodeId', () => {
    it('should use projectInstance.generateUuid when available', () => {
      const mockProject = {
        generateUuid: jest.fn().mockReturnValue('uuid-from-method'),
      };

      const result = generateNewXcodeId(mockProject as any);

      expect(result).toBe('uuid-from-method');
      expect(mockProject.generateUuid).toHaveBeenCalled();
    });

    it('should use projectInstance.generateId when generateUuid is not available', () => {
      const mockProject = {
        generateId: jest.fn().mockReturnValue('id-from-method'),
      };

      const result = generateNewXcodeId(mockProject as any);

      expect(result).toBe('id-from-method');
      expect(mockProject.generateId).toHaveBeenCalled();
    });

    it('should generate fallback UUID when no methods available', () => {
      const mockProject = {};

      const result = generateNewXcodeId(mockProject as any);

      expect(result).toHaveLength(24);
      expect(result).toMatch(/^[0-9A-F]+$/);
    });

    it('should generate fallback UUID when projectInstance is null', () => {
      const result = generateNewXcodeId(null as any);

      expect(result).toHaveLength(24);
      expect(result).toMatch(/^[0-9A-F]+$/);
    });
  });

  describe('quote', () => {
    it('should quote normal strings', () => {
      expect(quote('hello')).toBe('"hello"');
      expect(quote('test.swift')).toBe('"test.swift"');
    });

    it('should handle special <group> value', () => {
      expect(quote('<group>')).toBe('"<group>"');
    });

    it('should handle null and undefined', () => {
      expect(quote(null)).toBe('""');
      expect(quote(undefined)).toBe('""');
    });

    it('should escape quotes and backslashes', () => {
      expect(quote('file with "quotes"')).toBe('"file with \\"quotes\\""');
      expect(quote('path\\with\\backslashes')).toBe(
        '"path\\\\with\\\\backslashes"'
      );
    });

    it('should handle complex escaping', () => {
      expect(quote('test\\"file')).toBe('"test\\\\\\"file"');
    });

    it('should convert non-string values to string', () => {
      expect(quote(123 as any)).toBe('"123"');
      expect(quote(true as any)).toBe('"true"');
    });
  });
});
