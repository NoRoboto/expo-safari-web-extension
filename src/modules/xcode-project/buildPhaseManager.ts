import { XcodeProject } from '@expo/config-plugins';
import { generateNewXcodeId, quote } from './xcodeUtils';

export interface BuildPhaseResult {
  phaseObject: any | null;
  phaseUUID: string;
}

export function ensureBuildPhaseForTarget(
  project: XcodeProject,
  pbxProjectObjects: any,
  targetObject: any,
  phaseTypeISA_unquoted: string,
  phaseNameReadable: string,
  trackingCallback?: (uuid: string) => void
): BuildPhaseResult {
  const phaseTypeISA_quoted = quote(phaseTypeISA_unquoted);

  if (!pbxProjectObjects[phaseTypeISA_unquoted]) {
    pbxProjectObjects[phaseTypeISA_unquoted] = {};
  }

  let phaseUUID = (targetObject.buildPhases || [])
    .map((p: any) => p.value)
    .find(
      (uuid: string) =>
        pbxProjectObjects[phaseTypeISA_unquoted] &&
        pbxProjectObjects[phaseTypeISA_unquoted][uuid] &&
        pbxProjectObjects[phaseTypeISA_unquoted][uuid].isa ===
          phaseTypeISA_quoted
    );

  if (!phaseUUID) {
    phaseUUID = generateNewXcodeId(project);
    pbxProjectObjects[phaseTypeISA_unquoted][phaseUUID] = {
      isa: phaseTypeISA_quoted,
      buildActionMask: quote('2147483647'),
      files: [],
      runOnlyForDeploymentPostprocessing: quote('0'),
    };

    if (!targetObject.buildPhases) targetObject.buildPhases = [];
    targetObject.buildPhases.push({
      value: phaseUUID,
      comment: phaseNameReadable,
    });

    // Track the new build phase for cleanup
    if (trackingCallback) {
      trackingCallback(phaseUUID);
    }

    console.log(
      `[ensureBuildPhaseForTarget] Created new ${phaseNameReadable} (${phaseUUID}) for target "${targetObject.name.replace(
        /"/g,
        ''
      )}".`
    );
  } else {
    console.log(
      `[ensureBuildPhaseForTarget] Using existing ${phaseNameReadable} (${phaseUUID}) for target "${targetObject.name.replace(
        /"/g,
        ''
      )}".`
    );
  }

  const phaseObject =
    pbxProjectObjects[phaseTypeISA_unquoted] &&
    pbxProjectObjects[phaseTypeISA_unquoted][phaseUUID];

  if (phaseObject && !phaseObject.files) phaseObject.files = [];
  else if (!phaseObject) {
    console.error(
      `[ensureBuildPhaseForTarget] CRITICAL: Phase object ${phaseUUID} (${phaseNameReadable}) missing.`
    );
    return { phaseObject: null, phaseUUID };
  }

  return { phaseObject, phaseUUID };
}

export function addFileToBuildPhase(
  phaseObject: any,
  buildFileUUID: string,
  fileName: string,
  phaseName: string
): void {
  // Check for duplicates by UUID
  const existsByUUID = phaseObject.files.find(
    (f_entry: any) => f_entry.value === buildFileUUID
  );

  // Check for duplicates by file name in comment
  const existsByName = phaseObject.files.find(
    (f_entry: any) => f_entry.comment && f_entry.comment.includes(fileName)
  );

  if (!existsByUUID && !existsByName) {
    phaseObject.files.push({
      value: buildFileUUID,
      comment: `${fileName} in ${phaseName}`,
    });
    console.log(
      `[addFileToBuildPhase] Added "${fileName}" to ${phaseName} phase.`
    );
  } else {
    console.log(
      `[addFileToBuildPhase] Skipped duplicate "${fileName}" in ${phaseName} phase (already exists).`
    );
  }
}

export function cleanBuildPhasesForTarget(
  pbxProjectObjects: any,
  targetObject: any,
  extensionName: string
): void {
  if (!targetObject.buildPhases) return;

  console.log(
    `[cleanBuildPhasesForTarget] Cleaning build phases for target: ${targetObject.name || 'Unknown'}`
  );

  // Find and remove duplicate build phases for the extension target
  const targetName = targetObject.name?.replace(/"/g, '') || '';
  if (targetName === extensionName) {
    console.log(
      `[cleanBuildPhasesForTarget] Target matches extension name, cleaning duplicate build phases`
    );

    // Remove duplicate Sources build phases
    const sourcePhases = targetObject.buildPhases.filter((phase: any) => {
      const phaseUUID = phase.value;
      return (
        pbxProjectObjects.PBXSourcesBuildPhase &&
        pbxProjectObjects.PBXSourcesBuildPhase[phaseUUID]
      );
    });

    if (sourcePhases.length > 1) {
      console.log(
        `[cleanBuildPhasesForTarget] Found ${sourcePhases.length} Sources build phases, removing duplicates`
      );
      // Keep only the first one, remove the rest
      for (let i = 1; i < sourcePhases.length; i++) {
        const phaseToRemove = sourcePhases[i];
        const phaseUUID = phaseToRemove.value;

        // Remove from target's buildPhases array
        const index = targetObject.buildPhases.findIndex(
          (p: any) => p.value === phaseUUID
        );
        if (index !== -1) {
          targetObject.buildPhases.splice(index, 1);
        }

        // Remove from PBXSourcesBuildPhase section
        delete pbxProjectObjects.PBXSourcesBuildPhase[phaseUUID];
        console.log(
          `[cleanBuildPhasesForTarget] Removed duplicate Sources build phase ${phaseUUID}`
        );
      }
    }

    // Remove duplicate Resources build phases
    const resourcePhases = targetObject.buildPhases.filter((phase: any) => {
      const phaseUUID = phase.value;
      return (
        pbxProjectObjects.PBXResourcesBuildPhase &&
        pbxProjectObjects.PBXResourcesBuildPhase[phaseUUID]
      );
    });

    if (resourcePhases.length > 1) {
      console.log(
        `[cleanBuildPhasesForTarget] Found ${resourcePhases.length} Resources build phases, removing duplicates`
      );
      // Keep only the first one, remove the rest
      for (let i = 1; i < resourcePhases.length; i++) {
        const phaseToRemove = resourcePhases[i];
        const phaseUUID = phaseToRemove.value;

        // Remove from target's buildPhases array
        const index = targetObject.buildPhases.findIndex(
          (p: any) => p.value === phaseUUID
        );
        if (index !== -1) {
          targetObject.buildPhases.splice(index, 1);
        }

        // Remove from PBXResourcesBuildPhase section
        delete pbxProjectObjects.PBXResourcesBuildPhase[phaseUUID];
        console.log(
          `[cleanBuildPhasesForTarget] Removed duplicate Resources build phase ${phaseUUID}`
        );
      }
    }
  } else {
    // For other targets, just clean extension files from build phases
    console.log(
      `[cleanBuildPhasesForTarget] Cleaning extension files from non-extension target: ${targetName}`
    );

    targetObject.buildPhases.forEach((phaseRef: any) => {
      const phaseUUID = phaseRef.value;

      // Check all build phase types
      [
        'PBXSourcesBuildPhase',
        'PBXResourcesBuildPhase',
        'PBXFrameworksBuildPhase',
      ].forEach((phaseType) => {
        if (
          pbxProjectObjects[phaseType] &&
          pbxProjectObjects[phaseType][phaseUUID]
        ) {
          const phaseObject = pbxProjectObjects[phaseType][phaseUUID];

          if (phaseObject.files) {
            // Filter out files that reference the extension
            const originalLength = phaseObject.files.length;
            phaseObject.files = phaseObject.files.filter((fileRef: any) => {
              const buildFileUUID = fileRef.value;
              const buildFile =
                pbxProjectObjects.PBXBuildFile &&
                pbxProjectObjects.PBXBuildFile[buildFileUUID];

              if (buildFile) {
                const fileRefUUID = buildFile.fileRef;
                const fileReference =
                  pbxProjectObjects.PBXFileReference &&
                  pbxProjectObjects.PBXFileReference[fileRefUUID];

                if (fileReference) {
                  const filePath = fileReference.path?.replace(/"/g, '') || '';
                  const fileName = fileReference.name?.replace(/"/g, '') || '';

                  // Check if this file belongs to the extension
                  const isExtensionFile =
                    filePath.includes(extensionName) ||
                    fileName.includes(extensionName) ||
                    fileRef.comment?.includes(extensionName);

                  if (isExtensionFile) {
                    // Also remove the build file object
                    delete pbxProjectObjects.PBXBuildFile[buildFileUUID];
                    return false; // Remove this file from the phase
                  }
                }
              }
              return true; // Keep this file
            });

            if (phaseObject.files.length < originalLength) {
              console.log(
                `[cleanBuildPhasesForTarget] Removed ${originalLength - phaseObject.files.length} extension files from ${phaseType}`
              );
            }
          }
        }
      });
    });
  }
}

export function cleanDuplicateFilesByName(
  pbxProjectObjects: any,
  phaseObject: any,
  phaseName: string
): void {
  if (!phaseObject.files) return;

  const seenFiles = new Set<string>();
  const filesToKeep: any[] = [];

  phaseObject.files.forEach((fileEntry: any) => {
    const buildFileUUID = fileEntry.value;
    const buildFile =
      pbxProjectObjects.PBXBuildFile &&
      pbxProjectObjects.PBXBuildFile[buildFileUUID];

    if (buildFile && buildFile.fileRef) {
      const fileRef =
        pbxProjectObjects.PBXFileReference &&
        pbxProjectObjects.PBXFileReference[buildFile.fileRef];
      if (fileRef) {
        const fileName =
          fileRef.name?.replace(/"/g, '') ||
          fileRef.path?.replace(/"/g, '') ||
          '';

        if (fileName && !seenFiles.has(fileName)) {
          seenFiles.add(fileName);
          filesToKeep.push(fileEntry);
        } else if (fileName) {
          console.log(
            `[cleanDuplicateFilesByName] Removing duplicate file "${fileName}" from ${phaseName} phase`
          );
          // Also clean up the orphaned PBXBuildFile
          delete pbxProjectObjects.PBXBuildFile[buildFileUUID];
        }
      }
    }
  });

  phaseObject.files = filesToKeep;
  console.log(
    `[cleanDuplicateFilesByName] Cleaned ${phaseName} phase: kept ${filesToKeep.length} unique files`
  );
}
