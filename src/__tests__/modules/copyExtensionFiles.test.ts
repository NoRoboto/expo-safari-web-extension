import * as fs from 'fs';
import * as path from 'path';
import { copyExtensionFiles } from '../../modules/copyExtensionFiles';

jest.mock('fs');
jest.mock('path');
jest.mock('plist');

const mockedFs = jest.mocked(fs);
const mockedPath = jest.mocked(path);

describe('copyExtensionFiles', () => {
  const mockConfig = {
    modRequest: {
      projectRoot: '/mock/project',
      platformProjectRoot: '/mock/ios',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedPath.join.mockImplementation((...args) => args.join('/'));
  });

  it('should throw error when extensionName is missing', () => {
    const props = {
      extensionName: '',
      extensionSourcePath: './extension',
    };

    expect(() => copyExtensionFiles(mockConfig, props)).toThrow(
      '[copyExtensionFiles] `extensionName` and `extensionSourcePath` are required.'
    );
  });

  it('should throw error when extensionSourcePath is missing', () => {
    const props = {
      extensionName: 'TestExtension',
      extensionSourcePath: '',
    };

    expect(() => copyExtensionFiles(mockConfig, props)).toThrow(
      '[copyExtensionFiles] `extensionName` and `extensionSourcePath` are required.'
    );
  });

  it('should copy extension files successfully', () => {
    const props = {
      extensionName: 'TestExtension',
      extensionSourcePath: './extension',
    };

    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.statSync.mockReturnValue({ isDirectory: () => true } as any);
    mockedFs.mkdirSync.mockImplementation();
    mockedFs.readdirSync.mockReturnValue([]);
    mockedFs.copyFileSync.mockImplementation();

    const result = copyExtensionFiles(mockConfig, props);

    expect(result).toBe(mockConfig);
    expect(mockedPath.join).toHaveBeenCalledWith(
      '/mock/project',
      './extension'
    );
    expect(mockedPath.join).toHaveBeenCalledWith('/mock/ios', 'TestExtension');
  });

  it('should create entitlements file when provided', () => {
    const props = {
      extensionName: 'TestExtension',
      extensionSourcePath: './extension',
      extensionEntitlements: { 'com.apple.security.app-sandbox': true },
    };

    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.statSync.mockReturnValue({ isDirectory: () => true } as any);
    mockedFs.mkdirSync.mockImplementation();
    mockedFs.readdirSync.mockReturnValue([]);
    mockedFs.copyFileSync.mockImplementation();
    mockedFs.writeFileSync.mockImplementation();

    const result = copyExtensionFiles(mockConfig, props);

    expect(result).toBe(mockConfig);
    expect(mockedFs.writeFileSync).toHaveBeenCalled();

    // Check that writeFileSync was called with the correct path and content
    const writeCall = mockedFs.writeFileSync.mock.calls.find((call) =>
      call[0]?.toString().includes('TestExtension.entitlements')
    );
    expect(writeCall).toBeDefined();
  });
});
