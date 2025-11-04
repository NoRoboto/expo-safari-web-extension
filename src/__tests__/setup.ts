// Jest setup file for expo-safari-web-extension tests

// Mock console methods to reduce noise in tests
(() => {
  const originals = {
    log: console.log,
    warn: console.warn,
    error: console.error,
  };

  beforeEach(() => {
    // Suppress console output in tests unless explicitly needed
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  });

  afterEach(() => {
    // Restore console methods after each test
    console.log = originals.log;
    console.warn = originals.warn;
    console.error = originals.error;
  });
})();

// Global test utilities
(global as any).mockXcodeProject = () => ({
  generateUuid: jest.fn().mockReturnValue('mock-uuid'),
  generateId: jest.fn().mockReturnValue('mock-id'),
  pbxNativeTargetSection: jest.fn().mockReturnValue({}),
  getFirstTarget: jest.fn().mockReturnValue({ name: 'MockTarget' }),
  addTarget: jest.fn().mockReturnValue({ uuid: 'mock-target-uuid' }),
  pbxXCBuildConfigurationSection: jest.fn().mockReturnValue({}),
  getFirstProject: jest.fn().mockReturnValue({
    firstProject: { mainGroup: 'main-group-uuid' },
  }),
});

(global as any).mockPbxProjectObjects = () => ({
  PBXNativeTarget: {},
  PBXGroup: {},
  PBXFileReference: {},
  PBXBuildFile: {},
  PBXSourcesBuildPhase: {},
  PBXResourcesBuildPhase: {},
});

// Mock file system operations by default
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(false),
  statSync: jest.fn().mockReturnValue({ isDirectory: () => false }),
  mkdirSync: jest.fn(),
  readdirSync: jest.fn().mockReturnValue([]),
  copyFileSync: jest.fn(),
  readFileSync: jest.fn().mockReturnValue(''),
  writeFileSync: jest.fn(),
}));

jest.mock('path', () => ({
  join: jest.fn().mockImplementation((...args) => args.join('/')),
  resolve: jest.fn().mockImplementation((path) => `/resolved${path}`),
  extname: jest.fn().mockImplementation((path) => {
    const parts = path.split('.');
    return parts.length > 1 ? `.${parts[parts.length - 1]}` : '';
  }),
}));

jest.mock('plist', () => ({
  parse: jest.fn().mockReturnValue({}),
  build: jest.fn().mockReturnValue('<plist></plist>'),
}));

// Mock @expo/config-plugins to avoid Node.js fs.promises issues
jest.mock('@expo/config-plugins', () => ({
  withXcodeProject: jest.fn().mockImplementation((_config, modifier) => {
    const mockProjectConfig = {
      modResults: {},
      modRequest: {
        projectRoot: '/mock/project',
        platformProjectRoot: '/mock/ios',
      },
    };
    return modifier(mockProjectConfig);
  }),
}));
