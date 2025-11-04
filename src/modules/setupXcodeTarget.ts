import { XcodeProject } from '@expo/config-plugins';
import { TrackingManager } from './trackingManager';

export interface SetupXcodeTargetProps {
  extensionName: string;
  appBundleIdentifier: string;
  extensionBundleIdentifier: string;
  iosDeploymentTarget?: string;
  extensionEntitlements?: Record<string, any>;
}

export interface XcodeProjectConfig {
  modResults: XcodeProject;
  modRequest: {
    platformProjectRoot: string;
  };
  _extensionTargetUUID?: string;
}

/**
 * Removes any existing extension target and files to prevent duplicates before creating a new one
 */
export function cleanExistingExtension(
  project: XcodeProject,
  extensionName: string
): void {
  console.log(
    `[cleanExistingExtension] Cleaning any existing extension target: ${extensionName}`
  );

  const nativeTargets = project.pbxNativeTargetSection();
  const projectObjects = project.hash?.project?.objects;

  // First, clean build phases of ALL targets that might have extension files
  if (projectObjects) {
    Object.values(nativeTargets).forEach((target: any) => {
      if (target.isa === 'PBXNativeTarget') {
        // Import cleanBuildPhasesForTarget function here dynamically to avoid circular dependency
        const {
          cleanBuildPhasesForTarget,
        } = require('./xcode-project/buildPhaseManager');
        cleanBuildPhasesForTarget(projectObjects, target, extensionName);
      }
    });
  }

  const existingTargetEntry = Object.entries(nativeTargets).find(
    ([_, target]) => {
      const targetObj = target as any;
      const name = targetObj.name?.replace(/"/g, '');
      const product = targetObj.productName?.replace(/"/g, '');
      return name === extensionName || product === extensionName;
    }
  );

  if (existingTargetEntry) {
    const [targetUUID, _] = existingTargetEntry;
    console.log(
      `[cleanExistingExtension] Found existing target ${extensionName} (${targetUUID}), removing it`
    );

    // Remove from targets section
    delete nativeTargets[targetUUID];

    // Remove from project references
    if (projectObjects) {
      const projectSection = projectObjects.PBXProject;
      if (projectSection) {
        Object.values(projectSection).forEach((proj: any) => {
          if (proj.targets) {
            proj.targets = proj.targets.filter(
              (t: any) => t.value !== targetUUID
            );
          }
        });
      }
    }

    console.log(
      `[cleanExistingExtension] Removed existing target ${extensionName}`
    );
  }
}

/**
 * Idempotently adds or reuses a Safari Web Extension target and configures its build settings.
 */
export function setupXcodeTarget(
  config: XcodeProjectConfig,
  props: SetupXcodeTargetProps
): XcodeProjectConfig {
  const project = config.modResults;
  const {
    extensionName,
    appBundleIdentifier,
    extensionBundleIdentifier,
    iosDeploymentTarget = '16.0',
    extensionEntitlements,
  } = props;

  if (!extensionName || !appBundleIdentifier || !extensionBundleIdentifier) {
    throw new Error(
      '[setupXcodeTarget] extensionName, appBundleIdentifier, and extensionBundleIdentifier are required.'
    );
  }

  console.log(
    `[setupXcodeTarget] *** STARTING COMPLETE CLEANUP FOR ${extensionName} ***`
  );

  // Initialize tracking manager for deterministic cleanup
  const trackingManager = new TrackingManager(
    config.modRequest.platformProjectRoot
  );
  const projectObjects = project.hash?.project?.objects;

  if (projectObjects) {
    // Step 1: Clean any previously created elements for this extension
    console.log(`[setupXcodeTarget] Step 1: TrackingManager cleanup`);
    trackingManager.cleanPreviousElements(projectObjects, extensionName);

    // Step 2: Skip aggressive target cleanup - let it reuse existing targets
    console.log(
      `[setupXcodeTarget] Step 2: Skipping aggressive target cleanup - will reuse existing targets`
    );
  }

  // Step 3: Clean any existing extension build phases from ALL targets to prevent duplicates
  console.log(
    `[setupXcodeTarget] Step 3: Build phase cleaning for extension: ${extensionName}`
  );
  const nativeTargets = project.pbxNativeTargetSection();

  if (projectObjects) {
    console.log(
      `[setupXcodeTarget] Found ${Object.keys(nativeTargets).length} native targets to check`
    );
    Object.values(nativeTargets).forEach((target: any) => {
      if (target.isa === 'PBXNativeTarget') {
        const targetName = target.name?.replace(/"/g, '') || 'Unknown';
        console.log(
          `[setupXcodeTarget] Cleaning build phases for target: ${targetName}`
        );
        const {
          cleanBuildPhasesForTarget,
        } = require('./xcode-project/buildPhaseManager');
        cleanBuildPhasesForTarget(projectObjects, target, extensionName);
      }
    });
  }

  console.log(
    `[setupXcodeTarget] *** CLEANUP COMPLETED, PROCEEDING WITH TARGET SETUP ***`
  );

  // 1) Try to reuse an existing extension target by name
  let extensionTargetUUID = config._extensionTargetUUID;
  if (!extensionTargetUUID) {
    extensionTargetUUID = Object.entries(nativeTargets).find(([_, target]) => {
      const targetObj = target as any;
      const name = targetObj.name?.replace(/"/g, '');
      const product = targetObj.productName?.replace(/"/g, '');
      return name === extensionName || product === extensionName;
    })?.[0];
  }

  // 2) Create the target if none exists
  if (!extensionTargetUUID) {
    const firstTarget = project.getFirstTarget();
    let mainAppTargetName =
      typeof firstTarget === 'string'
        ? firstTarget
        : firstTarget.firstTarget?.name || firstTarget.name;
    mainAppTargetName = mainAppTargetName.replace(/"/g, '');

    const newTarget = project.addTarget(
      extensionName,
      'app_extension',
      extensionName,
      mainAppTargetName
    );
    if (!newTarget?.uuid) {
      console.error('[setupXcodeTarget] Failed to add extension target.');
      return config;
    }
    extensionTargetUUID = newTarget.uuid;

    // Don't track targets - only track internal elements like groups, files, build phases
    // if (extensionTargetUUID) {
    //   trackingManager.trackElement(extensionName, 'target', extensionTargetUUID);
    // }

    console.log(
      `[setupXcodeTarget] Created extension target ${extensionName} (${extensionTargetUUID})`
    );
  } else {
    console.log(
      `[setupXcodeTarget] Reusing existing extension target ${extensionName} (${extensionTargetUUID})`
    );

    // Clean duplicate build phases for the existing target
    const target = nativeTargets[extensionTargetUUID];
    if (target && projectObjects) {
      console.log(
        `[setupXcodeTarget] *** CLEANING DUPLICATE BUILD PHASES FOR EXISTING TARGET ${extensionName} ***`
      );
      const {
        cleanBuildPhasesForTarget,
      } = require('./xcode-project/buildPhaseManager');
      cleanBuildPhasesForTarget(projectObjects, target, extensionName);
      console.log(`[setupXcodeTarget] *** FINISHED CLEANING BUILD PHASES ***`);
    } else {
      console.log(
        `[setupXcodeTarget] *** WARNING: Could not clean - target=${!!target}, projectObjects=${!!projectObjects} ***`
      );
    }
  }

  // Persist for downstream modules
  config._extensionTargetUUID = extensionTargetUUID;

  // 3) Patch build settings for this target
  const buildConfigs = project.pbxXCBuildConfigurationSection();
  for (const key in buildConfigs) {
    const cfg = buildConfigs[key];
    if (cfg.isa !== 'XCBuildConfiguration') continue;
    const bs = cfg.buildSettings;
    if (bs.PRODUCT_NAME?.replace(/"/g, '') === extensionName) {
      bs.PRODUCT_BUNDLE_IDENTIFIER = `"${extensionBundleIdentifier}"`;
      bs.IPHONEOS_DEPLOYMENT_TARGET = `"${iosDeploymentTarget}"`;
      bs.PRODUCT_TYPE = '"com.apple.product-type.extensionkit-extension"';
      bs.INFOPLIST_FILE = `"${extensionName}/Info.plist"`;
      if (extensionEntitlements) {
        bs.CODE_SIGN_ENTITLEMENTS = `"${extensionName}/${extensionName}.entitlements"`;
      }
      bs.SKIP_INSTALL = 'YES';
      bs.TARGETED_DEVICE_FAMILY = '"1,2"';
      bs.SWIFT_VERSION = '5.0';
      console.log(
        `[setupXcodeTarget] Patched settings for ${extensionName} in config ${key}`
      );
    }
  }

  return config;
}
