import * as path from 'path';

let fileUtiSync: ((filePath: string) => string) | null = null;

try {
  const fileUti = require('file-uti');
  fileUtiSync = fileUti.fileUtiSync;
} catch (error) {
  console.warn(
    'file-uti package not available, falling back to extension-based detection'
  );
}

interface FileTypeMapping {
  [extension: string]: string;
}

const XCODE_FILE_TYPE_MAPPINGS: FileTypeMapping = {
  // Source Code Files (based on XcodeGen and Apple docs)
  '.swift': 'sourcecode.swift',
  '.gyb': 'sourcecode.swift', // Swift Gyb files
  '.m': 'sourcecode.c.objc',
  '.mm': 'sourcecode.cpp.objcpp',
  '.h': 'sourcecode.c.h',
  '.hh': 'sourcecode.cpp.h',
  '.hpp': 'sourcecode.cpp.h',
  '.ipp': 'sourcecode.cpp.h',
  '.tpp': 'sourcecode.cpp.h',
  '.hxx': 'sourcecode.cpp.h',
  '.cpp': 'sourcecode.cpp.cpp',
  '.cp': 'sourcecode.cpp.cpp',
  '.cxx': 'sourcecode.cpp.cpp',
  '.cc': 'sourcecode.cpp.cpp',
  '.c': 'sourcecode.c.c',
  '.S': 'sourcecode.asm', // Assembly files
  '.def': 'sourcecode.module-map', // Module definition files
  '.metal': 'sourcecode.metal', // Metal shading language
  '.iig': 'sourcecode.iig', // DriverKit interface files

  // JavaScript/TypeScript
  '.js': 'sourcecode.javascript',
  '.jsx': 'sourcecode.javascript.jsx',
  '.ts': 'sourcecode.typescript',
  '.tsx': 'sourcecode.typescript',

  // Data and Configuration Files
  '.plist': 'text.plist.xml',
  '.entitlements': 'text.plist.xml',
  '.strings': 'text.plist.strings',
  '.stringsdict': 'text.plist.stringsdict',
  '.xcconfig': 'text.xcconfig',
  '.xcstrings': 'text.json.xcstrings', // Xcode 15+ string catalogs
  '.gpx': 'text.xml', // GPS Exchange files
  '.apns': 'text.apns', // APNS files
  '.pch': 'sourcecode.c.h', // Precompiled headers
  '.xctestplan': 'text.json', // Test plans
  '.xcfilelist': 'text.xcfilelist', // File lists

  // Images
  '.png': 'image.png',
  '.jpg': 'image.jpeg',
  '.jpeg': 'image.jpeg',
  '.gif': 'image.gif',
  '.tiff': 'image.tiff',
  '.tif': 'image.tiff',
  '.ico': 'image.ico',
  '.svg': 'image.svg+xml',
  '.pdf': 'image.pdf',

  // Interface Files
  '.xib': 'file.xib',
  '.storyboard': 'file.storyboard',
  '.nib': 'wrapper.nib',

  // Data Models
  '.xcdatamodeld': 'wrapper.xcdatamodel',
  '.xcmappingmodel': 'wrapper.xcmappingmodel',
  '.intentdefinition': 'file.intentdefinition',
  '.mlmodel': 'file.mlmodel',
  '.mlmodelc': 'folder.mlmodelc', // Compiled ML models
  '.mlpackage': 'folder.mlpackage',
  '.rcproject': 'folder.rcproject', // Reality Composer projects

  // Documentation
  '.docc': 'folder.documentationcatalog',
  '.md': 'text.markdown',
  '.markdown': 'text.markdown',
  '.txt': 'text.plain',
  '.rtf': 'text.rtf',

  // Web Files
  '.html': 'text.html',
  '.htm': 'text.html',
  '.xml': 'text.xml',
  '.css': 'text.css',
  '.scss': 'text.css.scss',
  '.sass': 'text.css.sass',
  '.less': 'text.css.less',
  '.json': 'text.json',

  // Bundles and Frameworks
  '.framework': 'wrapper.framework',
  '.xcframework': 'wrapper.xcframework',
  '.bundle': 'wrapper.cfbundle',
  '.app': 'wrapper.application',
  '.appex': 'wrapper.app-extension', // App extensions
  '.xpc': 'wrapper.xpc-service', // XPC services

  // Asset Catalogs
  '.xcassets': 'folder.assetcatalog',
  '.appiconset': 'folder.assetcatalog.app-icon-set',
  '.imageset': 'folder.assetcatalog.image-set',
  '.colorset': 'folder.assetcatalog.color-set',
  '.launchimage': 'folder.assetcatalog.launch-image',

  // Localization
  '.lproj': 'folder.lproj',

  // Project Files
  '.xcscheme': 'text.xml',
  '.xcworkspacedata': 'text.xml',
  '.pbxproj': 'text.pbxproject',

  // Libraries and Binaries
  '.dylib': 'compiled.mach-o.dylib',
  '.a': 'archive.ar',

  // Media Files
  '.mov': 'video.quicktime',
  '.mp4': 'video.mp4',
  '.avi': 'video.avi',
  '.mp3': 'audio.mp3',
  '.wav': 'audio.wav',
  '.aiff': 'audio.aiff',
  '.m4a': 'audio.mp4',

  // Fonts
  '.ttf': 'file.ttf',
  '.otf': 'file.otf',
  '.woff': 'file.woff',
  '.woff2': 'file.woff2',

  // Databases
  '.sqlite': 'file.sqlite',
  '.db': 'file.sqlite',

  // Certificates and Provisioning
  '.pem': 'text.certificate',
  '.cer': 'text.certificate',
  '.p12': 'text.certificate',
  '.mobileprovision': 'text.mobileprovision',

  // Archives
  '.zip': 'archive.zip',
  '.tar': 'archive.tar',
  '.gz': 'archive.gzip',
  '.bz2': 'archive.bzip2',
  '.dmg': 'archive.dmg',

  // StoreKit
  '.storekit': 'text.json.storekit',
};

const UTI_TO_XCODE_MAPPING: { [uti: string]: string } = {
  'com.netscape.javascript-source': 'sourcecode.javascript',
  'public.swift-source': 'sourcecode.swift',
  'public.objective-c-source': 'sourcecode.c.objc',
  'public.objective-c-plus-plus-source': 'sourcecode.cpp.objcpp',
  'public.c-header': 'sourcecode.c.h',
  'public.c-plus-plus-header': 'sourcecode.cpp.h',
  'public.c-plus-plus-source': 'sourcecode.cpp.cpp',
  'public.c-source': 'sourcecode.c.c',
  'com.apple.property-list': 'text.plist.xml',
  'public.png': 'image.png',
  'public.jpeg': 'image.jpeg',
  'public.json': 'text.json',
  'public.html': 'text.html',
  'public.xml': 'text.xml',
  'public.plain-text': 'text.plain',
  'public.rtf': 'text.rtf',
  'com.adobe.pdf': 'image.pdf',
  'public.mp3': 'audio.mp3',
  'com.microsoft.waveform-audio': 'audio.wav',
  'public.truetype-ttf-font': 'file.ttf',
  'public.opentype-font': 'file.otf',
};

export function getXcodeFileReferenceType(
  fileName: string,
  isDirectory = false
): string {
  if (isDirectory) {
    return 'folder';
  }

  const ext = path.extname(fileName).toLowerCase();

  if (XCODE_FILE_TYPE_MAPPINGS[ext]) {
    return XCODE_FILE_TYPE_MAPPINGS[ext];
  }

  if (fileUtiSync) {
    try {
      const uti = fileUtiSync(fileName);
      if (uti && UTI_TO_XCODE_MAPPING[uti]) {
        return UTI_TO_XCODE_MAPPING[uti];
      }
    } catch (error) {
      console.warn(`Failed to get UTI for file ${fileName}:`, error);
    }
  }

  return 'file';
}

export function getExtensionsForXcodeType(xcodeType: string): string[] {
  return Object.entries(XCODE_FILE_TYPE_MAPPINGS)
    .filter(([, type]) => type === xcodeType)
    .map(([ext]) => ext);
}

export function getSupportedExtensions(): string[] {
  return Object.keys(XCODE_FILE_TYPE_MAPPINGS);
}

export function addCustomFileTypeMapping(
  extension: string,
  xcodeType: string
): void {
  XCODE_FILE_TYPE_MAPPINGS[extension.toLowerCase()] = xcodeType;
}

export function addCustomUtiMapping(uti: string, xcodeType: string): void {
  UTI_TO_XCODE_MAPPING[uti] = xcodeType;
}
