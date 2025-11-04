import * as fs from 'fs';
import * as path from 'path';
import * as plist from 'plist';

export interface PatchExtensionInfoPlistProps {
  extensionName: string;
  extensionBundleIdentifier: string;
}

export interface PlistConfig {
  modRequest: {
    platformProjectRoot: string;
  };
}

export function patchExtensionInfoPlist(
  config: PlistConfig,
  props: PatchExtensionInfoPlistProps
): PlistConfig {
  console.log('[patchExtensionInfoPlist] Module started.');

  console.log(
    '[patchExtensionInfoPlist] Received props:',
    JSON.stringify(props, null, 2)
  );

  const { platformProjectRoot } = config.modRequest;
  const { extensionName, extensionBundleIdentifier } = props;

  if (!extensionName) {
    console.error(
      '[patchExtensionInfoPlist] ERROR: `extensionName` is missing in props.'
    );
    throw new Error('[patchExtensionInfoPlist] `extensionName` is required.');
  }

  console.log(
    `[patchExtensionInfoPlist] Value of extensionName: "${extensionName}"`
  );
  console.log(
    `[patchExtensionInfoPlist] Value of extensionBundleIdentifier received: "${extensionBundleIdentifier}"`
  );

  if (
    !extensionBundleIdentifier ||
    typeof extensionBundleIdentifier !== 'string' ||
    extensionBundleIdentifier.trim() === ''
  ) {
    console.error(
      `[patchExtensionInfoPlist] ERROR: \`extensionBundleIdentifier\` is missing, not a string, or empty for extension "${extensionName}". CFBundleIdentifier cannot be set correctly.`
    );
  }

  const infoPlistName = 'Info.plist';
  const extensionDir = path.join(platformProjectRoot, extensionName);
  const infoPlistPath = path.join(extensionDir, infoPlistName);

  console.log(
    `[patchExtensionInfoPlist] Expected Info.plist path: ${infoPlistPath}`
  );

  if (!fs.existsSync(infoPlistPath)) {
    console.warn(
      `[patchExtensionInfoPlist] WARNING: Info.plist not found at ${infoPlistPath} for extension "${extensionName}". Skipping patch. Ensure 'copyExtensionFiles' runs before this and successfully copies the Info.plist.`
    );
    return config;
  }

  try {
    console.log(
      `[patchExtensionInfoPlist] Reading Info.plist from: ${infoPlistPath}`
    );
    const plistContentString = fs.readFileSync(infoPlistPath, 'utf8');
    const plistObject = plist.parse(plistContentString) as Record<string, any>;

    console.log(
      '[patchExtensionInfoPlist] Original CFBundleIdentifier (if any):',
      plistObject.CFBundleIdentifier
    );

    // --- Forcefully set CFBundleIdentifier if extensionBundleIdentifier is valid ---
    if (
      extensionBundleIdentifier &&
      typeof extensionBundleIdentifier === 'string' &&
      extensionBundleIdentifier.trim() !== ''
    ) {
      plistObject.CFBundleIdentifier = extensionBundleIdentifier.trim();
      console.log(
        `[patchExtensionInfoPlist] SUCCESSFULLY SET CFBundleIdentifier to: "${plistObject.CFBundleIdentifier}"`
      );
    } else {
      console.warn(
        `[patchExtensionInfoPlist] SKIPPED SETTING CFBundleIdentifier because extensionBundleIdentifier was invalid (Value: "${extensionBundleIdentifier}"). It might remain empty or as it was.`
      );
      if (!plistObject.CFBundleIdentifier) {
        plistObject.CFBundleIdentifier = '';
        console.log(
          '[patchExtensionInfoPlist] Ensured CFBundleIdentifier key exists (set to empty string as fallback).'
        );
      }
    }

    if (
      !plistObject.CFBundleExecutable ||
      plistObject.CFBundleExecutable !== '$(EXECUTABLE_NAME)'
    ) {
      plistObject.CFBundleExecutable = '$(EXECUTABLE_NAME)';
      console.log(
        `[patchExtensionInfoPlist] Ensured CFBundleExecutable is set to: $(EXECUTABLE_NAME)`
      );
    }

    if (!plistObject.CFBundleName) {
      plistObject.CFBundleName = '$(PRODUCT_NAME)';
      console.log(
        `[patchExtensionInfoPlist] Ensured CFBundleName is set to: $(PRODUCT_NAME)`
      );
    }

    if (!plistObject.CFBundleDisplayName) {
      plistObject.CFBundleDisplayName = extensionName;
      console.log(
        `[patchExtensionInfoPlist]  Set CFBundleDisplayName to: ${extensionName}`
      );
    }

    console.log(
      '[patchExtensionInfoPlist] Final CFBundleIdentifier before writing:',
      plistObject.CFBundleIdentifier
    );

    const newPlistContentString = plist.build(plistObject, {
      indent: '\t',
      spaceBeforeSlash: true,
    });
    fs.writeFileSync(infoPlistPath, newPlistContentString);

    console.log(
      `[patchExtensionInfoPlist] Successfully wrote patched Info.plist for "${extensionName}" to ${infoPlistPath}.`
    );
  } catch (error) {
    console.error(
      `[patchExtensionInfoPlist] FATAL ERROR patching Info.plist at ${infoPlistPath} for extension "${extensionName}":`,
      error
    );
    throw error;
  }

  console.log('[patchExtensionInfoPlist] Module finished.');
  return config;
}
