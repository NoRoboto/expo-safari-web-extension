import { patchExtensionInfoPlist } from '../../modules/patchExtensionInfoPlist';

// Mock fs and path completely
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
}));

// Mock plist with actual implementation
jest.mock('plist', () => ({
  parse: jest.fn(),
  build: jest.fn().mockReturnValue('<plist>mock</plist>'),
}));

import * as fs from 'fs';
import * as plist from 'plist';

const mockFs = jest.mocked(fs);
const mockPlist = jest.mocked(plist);

describe('patchExtensionInfoPlist', () => {
  const mockConfig = {
    modRequest: {
      platformProjectRoot: '/mock/ios',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error when extensionName is missing', () => {
    const props = {
      extensionName: '',
      extensionBundleIdentifier: 'com.test.extension',
    };

    expect(() => patchExtensionInfoPlist(mockConfig, props)).toThrow(
      '[patchExtensionInfoPlist] `extensionName` is required.'
    );
  });

  it('should skip when Info.plist does not exist', () => {
    const props = {
      extensionName: 'TestExtension',
      extensionBundleIdentifier: 'com.test.extension',
    };

    mockFs.existsSync.mockReturnValue(false);

    const result = patchExtensionInfoPlist(mockConfig, props);

    expect(result).toBe(mockConfig);
    expect(mockFs.readFileSync).not.toHaveBeenCalled();
  });

  it('should patch Info.plist successfully', () => {
    const props = {
      extensionName: 'TestExtension',
      extensionBundleIdentifier: 'com.test.extension',
    };

    // Create a mutable object that the function can modify
    const mockPlistObject: any = {
      CFBundleIdentifier: 'old.identifier',
    };

    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue('mock plist content');
    mockFs.writeFileSync.mockImplementation();
    mockPlist.parse.mockReturnValue(mockPlistObject);

    patchExtensionInfoPlist(mockConfig, props);

    // The function should have modified the object
    expect(mockPlistObject.CFBundleIdentifier).toBe('com.test.extension');
    expect(mockPlistObject.CFBundleExecutable).toBe('$(EXECUTABLE_NAME)');
    expect(mockPlistObject.CFBundleName).toBe('$(PRODUCT_NAME)');
    expect(mockPlistObject.CFBundleDisplayName).toBe('TestExtension');
    expect(mockFs.writeFileSync).toHaveBeenCalled();
  });

  it('should handle invalid extensionBundleIdentifier gracefully', () => {
    const props = {
      extensionName: 'TestExtension',
      extensionBundleIdentifier: '',
    };

    const mockPlistObject: any = {};

    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue('mock plist content');
    mockFs.writeFileSync.mockImplementation();
    mockPlist.parse.mockReturnValue(mockPlistObject);

    patchExtensionInfoPlist(mockConfig, props);

    expect(mockPlistObject.CFBundleIdentifier).toBe('');
    expect(mockFs.writeFileSync).toHaveBeenCalled();
  });

  it('should throw error when plist parsing fails', () => {
    const props = {
      extensionName: 'TestExtension',
      extensionBundleIdentifier: 'com.test.extension',
    };

    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue('invalid plist');

    mockPlist.parse.mockImplementation(() => {
      throw new Error('Parse error');
    });

    expect(() => patchExtensionInfoPlist(mockConfig, props)).toThrow(
      'Parse error'
    );
  });
});
