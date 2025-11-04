import * as fs from 'fs';
import * as path from 'path';
import * as plist from 'plist';

export interface CopyExtensionFilesProps {
  extensionName: string;
  extensionSourcePath: string;
  extensionEntitlements?: Record<string, any>;
}

export interface ProjectConfig {
  modRequest: {
    projectRoot: string;
    platformProjectRoot: string;
  };
}

function copyRecursiveSync(src: string, dest: string): void {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach((child) =>
      copyRecursiveSync(path.join(src, child), path.join(dest, child))
    );
  } else {
    fs.copyFileSync(src, dest);
  }
}

export function copyExtensionFiles(
  config: ProjectConfig,
  props: CopyExtensionFilesProps
): ProjectConfig {
  const { projectRoot, platformProjectRoot } = config.modRequest;
  const { extensionName, extensionSourcePath, extensionEntitlements } = props;

  if (!extensionName || !extensionSourcePath) {
    throw new Error(
      '[copyExtensionFiles] `extensionName` and `extensionSourcePath` are required.'
    );
  }

  const srcDir = path.join(projectRoot, extensionSourcePath);
  const destDir = path.join(platformProjectRoot, extensionName);

  // Clean existing destination directory to prevent duplicates
  if (fs.existsSync(destDir)) {
    console.log(
      `[copyExtensionFiles] Cleaning existing destination directory: ${destDir}`
    );
    try {
      // Try using fs.rmSync if available (Node 14.14+)
      if (fs.rmSync) {
        fs.rmSync(destDir, { recursive: true, force: true });
      } else {
        // Fallback for older Node versions
        fs.rmdirSync(destDir, { recursive: true });
      }
    } catch (error) {
      console.warn(
        `[copyExtensionFiles] Could not clean destination directory: ${error}`
      );
    }
  }

  // 1) Copy your existing extension files (Info.plist, handler.swift, Resources/, etc.)
  copyRecursiveSync(srcDir, destDir);

  // 2) Generate the entitlements file from the prop object
  if (extensionEntitlements) {
    const entFileName = `${extensionName}.entitlements`;
    const entDestPath = path.join(destDir, entFileName);
    fs.writeFileSync(entDestPath, plist.build(extensionEntitlements));
    console.log(`[copyExtensionFiles] Wrote entitlements to ${entDestPath}`);
  }

  return config;
}
