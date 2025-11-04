import { type ConfigPlugin, withXcodeProject } from '@expo/config-plugins';
import { setupXcodeTarget } from './modules/setupXcodeTarget';
import { copyExtensionFiles } from './modules/copyExtensionFiles';
import { addFilesToXcodeProject } from './modules/addFilesToXcodeProject';
import { patchExtensionInfoPlist } from './modules/patchExtensionInfoPlist';

export interface SafariExtensionPluginProps {
  extensionName?: string;
  extensionSourcePath?: string;
  extensionBundleIdentifier?: string;
  iosDeploymentTarget?: string;
  extensionEntitlements?: Record<string, any>;
}

const withSafariExtension: ConfigPlugin<SafariExtensionPluginProps> = (
  config,
  props = {}
) => {
  // Validate required props
  const appBundleIdentifier = config.ios?.bundleIdentifier;

  if (!appBundleIdentifier) {
    console.warn(
      '⚠️ [Safari Extension Plugin] Missing ios.bundleIdentifier in app.json/app.config.js'
    );
    console.warn('   Skipping Safari extension setup.');
    return config;
  }

  if (!props.extensionName) {
    console.warn(
      '⚠️ [Safari Extension Plugin] Missing required prop: extensionName'
    );
    console.warn(
      '   Example: plugins: [["expo-safari-web-extension", { extensionName: "MyExtension" }]]'
    );
    console.warn('   Skipping Safari extension setup.');
    return config;
  }

  if (!props.extensionSourcePath) {
    console.warn(
      '⚠️ [Safari Extension Plugin] Missing required prop: extensionSourcePath'
    );
    console.warn('   Example: extensionSourcePath: "./safari-extension"');
    console.warn('   Skipping Safari extension setup.');
    return config;
  }

  // Validate source path exists
  const path = require('path');
  const fs = require('fs');
  const fullSourcePath = path.resolve(props.extensionSourcePath);

  if (!fs.existsSync(fullSourcePath)) {
    console.warn(
      `⚠️ [Safari Extension Plugin] Extension source path does not exist: ${fullSourcePath}`
    );
    console.warn(
      '   Please create the extension directory with your Safari extension files.'
    );
    console.warn('   Skipping Safari extension setup.');
    return config;
  }

  const extensionName = props.extensionName || 'SafariExtension';
  const extensionSourcePath = props.extensionSourcePath || './safari-extension';
  const extensionBundleIdentifier =
    props.extensionBundleIdentifier ||
    `${appBundleIdentifier}.${extensionName}`;

  const mergedProps = {
    extensionName,
    extensionSourcePath,
    extensionBundleIdentifier,
    iosDeploymentTarget: props.iosDeploymentTarget || '16.0',
    extensionEntitlements: props.extensionEntitlements,
    appBundleIdentifier,
  };

  return withXcodeProject(config, (projectConfig) => {
    // Create a unified config that satisfies all module requirements
    const baseConfig = {
      modResults: projectConfig.modResults,
      modRequest: {
        projectRoot: projectConfig.modRequest.projectRoot,
        platformProjectRoot: projectConfig.modRequest.platformProjectRoot,
      },
    };

    // Setup Xcode target
    const targetResult = setupXcodeTarget(baseConfig as any, mergedProps);

    // Copy extension files
    copyExtensionFiles(baseConfig as any, mergedProps);

    // Patch Info.plist
    patchExtensionInfoPlist(baseConfig as any, mergedProps);

    // Add files to Xcode project
    const finalConfig = {
      ...baseConfig,
      modResults: targetResult.modResults,
      _extensionTargetUUID: targetResult._extensionTargetUUID,
    };
    addFilesToXcodeProject(finalConfig as any, mergedProps);

    // Return the original config structure with updated modResults
    return {
      ...projectConfig,
      modResults: targetResult.modResults,
    };
  });
};

export default withSafariExtension;
