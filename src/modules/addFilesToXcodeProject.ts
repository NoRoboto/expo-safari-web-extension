import * as fs from 'fs';
import * as path from 'path';
import { XcodeProject } from '@expo/config-plugins';
import {
  ensurePBXGroup,
  getMainProjectGroup,
  removeExistingPBXGroup,
} from './xcode-project/pbxGroupManager';
import {
  ensureBuildPhaseForTarget,
  addFileToBuildPhase,
  cleanDuplicateFilesByName,
} from './xcode-project/buildPhaseManager';
import { TrackingManager } from './trackingManager';
import {
  createFileReference,
  type FileToAdd,
} from './xcode-project/fileReferenceManager';

export interface AddFilesToXcodeProjectProps {
  extensionName: string;
  handlerFileName?: string;
  infoPlistName?: string;
  extensionEntitlements?: Record<string, any>;
}

export interface XcodeProjectConfig {
  modResults: XcodeProject;
  modRequest: {
    platformProjectRoot: string;
  };
  _extensionTargetUUID?: string;
}

export function addFilesToXcodeProject(
  config: XcodeProjectConfig,
  props: AddFilesToXcodeProjectProps
): XcodeProjectConfig {
  const project = config.modResults;

  const { platformProjectRoot } = config.modRequest;
  const {
    extensionName,
    handlerFileName = 'SafariWebExtensionHandler.swift',
    infoPlistName = 'Info.plist',
    extensionEntitlements,
  } = props;

  console.log(
    `\n[addFilesToXcodeProject] Starting for extension: ${extensionName}`
  );

  // Initialize tracking manager
  const trackingManager = new TrackingManager(platformProjectRoot);

  const extTargetUUID = config._extensionTargetUUID;
  if (!extTargetUUID) {
    console.error(
      '[addFilesToXcodeProject] CRITICAL: Missing extension target UUID (_extensionTargetUUID).'
    );
    return config;
  }

  if (
    !project ||
    !project.hash ||
    !project.hash.project ||
    !project.hash.project.objects
  ) {
    console.error(
      '[addFilesToXcodeProject] CRITICAL: pbxProjectObjects not available.'
    );
    return config;
  }
  const pbxProjectObjects = project.hash.project.objects;

  const target =
    pbxProjectObjects.PBXNativeTarget &&
    pbxProjectObjects.PBXNativeTarget[extTargetUUID];
  if (!target) {
    console.error(
      `[addFilesToXcodeProject] CRITICAL: Extension target ${extTargetUUID} not found.`
    );
    return config;
  }

  const entitlementsFileName = `${extensionName}.entitlements`;
  const extensionSourceDir = path.join(platformProjectRoot, extensionName);

  // --- 1. Clean and ensure PBXGroup for the extension ---
  const mainProjectGroupUUID = getMainProjectGroup(project, pbxProjectObjects);
  if (!mainProjectGroupUUID) {
    console.error(
      '[addFilesToXcodeProject] CRITICAL: Main project group not found.'
    );
    return config;
  }

  // Remove any existing extension group to prevent duplicates
  removeExistingPBXGroup(
    project,
    pbxProjectObjects,
    mainProjectGroupUUID,
    extensionName
  );

  const extGroupResult = ensurePBXGroup(
    project,
    pbxProjectObjects,
    mainProjectGroupUUID,
    extensionName,
    extensionName,
    (uuid) => trackingManager.trackElement(extensionName, 'group', uuid)
  );

  if (!extGroupResult.groupUUID) {
    console.error(
      '[addFilesToXcodeProject] CRITICAL: Could not create/find extension group.'
    );
    return config;
  }

  const extGroupUUID = extGroupResult.groupUUID;

  const extensionGroup =
    pbxProjectObjects.PBXGroup && pbxProjectObjects.PBXGroup[extGroupUUID];
  if (extensionGroup && !extensionGroup.children) {
    extensionGroup.children = [];
  } else if (!extensionGroup) {
    console.error(
      `[addFilesToXcodeProject] CRITICAL: Extension group ${extGroupUUID} not found/created.`
    );
    return config;
  }

  const filesToAdd: FileToAdd[] = [];

  const handlerFullPath = path.join(extensionSourceDir, handlerFileName);
  if (fs.existsSync(handlerFullPath)) {
    filesToAdd.push({
      fileNameForXcode: handlerFileName,
      groupUUID: extGroupUUID,
      addToPhaseType: 'Sources',
      isDirectory: false,
    });
  } else {
    console.warn(
      `[addFilesToXcodeProject] Handler file NOT FOUND: ${handlerFullPath}`
    );
  }

  const infoPlistFullPath = path.join(extensionSourceDir, infoPlistName);
  if (fs.existsSync(infoPlistFullPath)) {
    filesToAdd.push({
      fileNameForXcode: infoPlistName,
      groupUUID: extGroupUUID,
      addToPhaseType: null,
      isDirectory: false,
    });
  }

  if (extensionEntitlements) {
    const entitlementsFullPath = path.join(
      extensionSourceDir,
      entitlementsFileName
    );
    if (fs.existsSync(entitlementsFullPath)) {
      filesToAdd.push({
        fileNameForXcode: entitlementsFileName,
        groupUUID: extGroupUUID,
        addToPhaseType: null,
        isDirectory: false,
      });
    }
  }

  // --- Process Resources folder ---
  const resourcesDirPath = path.join(extensionSourceDir, 'Resources');
  if (
    fs.existsSync(resourcesDirPath) &&
    fs.statSync(resourcesDirPath).isDirectory()
  ) {
    // Ensure PBXGroup for "Resources" itself, as a child of the extensionGroup
    const resourcesGroupResult = ensurePBXGroup(
      project,
      pbxProjectObjects,
      extGroupUUID,
      'Resources',
      'Resources',
      (uuid) => trackingManager.trackElement(extensionName, 'group', uuid)
    );

    const resourcesTopLevelGroupUUID = resourcesGroupResult.groupUUID;

    const resourcesGroupObject =
      pbxProjectObjects.PBXGroup &&
      pbxProjectObjects.PBXGroup[resourcesTopLevelGroupUUID];
    if (resourcesGroupObject && !resourcesGroupObject.children)
      resourcesGroupObject.children = [];

    if (resourcesGroupObject) {
      fs.readdirSync(resourcesDirPath).forEach((itemName) => {
        const itemFullPath = path.join(resourcesDirPath, itemName);
        const isDirectory = fs.statSync(itemFullPath).isDirectory();

        // All items (files and folders) from Resources dir go into "Copy Bundle Resources"
        filesToAdd.push({
          fileNameForXcode: itemName,
          groupUUID: resourcesTopLevelGroupUUID,
          addToPhaseType: 'Resources',
          isDirectory: isDirectory,
        });
        if (isDirectory) {
          console.log(
            `[addFilesToXcodeProject] Identified folder in Resources: ${itemName}`
          );
        }
      });
    } else {
      console.warn(
        `[addFilesToXcodeProject] "Resources" PBXGroup object not found for UUID ${resourcesTopLevelGroupUUID}. Cannot add its contents.`
      );
    }
  } else {
    console.log(
      `[addFilesToXcodeProject] Resources folder not found or not a directory at: ${resourcesDirPath}`
    );
  }

  console.log(
    '[addFilesToXcodeProject] Files gathered (filesToAdd):',
    JSON.stringify(
      filesToAdd.map((f) => ({
        name: f.fileNameForXcode,
        group: f.groupUUID,
        phase: f.addToPhaseType,
        isDir: f.isDirectory,
      })),
      null,
      2
    )
  );

  const buildFileUUIDsByPhase: Record<string, string[]> = {
    Sources: [],
    Resources: [],
  };

  filesToAdd.forEach((fileInfo) => {
    const { addToPhaseType } = fileInfo;
    const result = createFileReference(project, pbxProjectObjects, fileInfo, {
      trackFileReference: (uuid) =>
        trackingManager.trackElement(extensionName, 'fileReference', uuid),
      trackBuildFile: (uuid) =>
        trackingManager.trackElement(extensionName, 'buildFile', uuid),
    });

    if (result.buildFileUUID && addToPhaseType) {
      if (!buildFileUUIDsByPhase[addToPhaseType]) {
        console.warn(
          `[addFilesToXcodeProject] Unknown phase type "${addToPhaseType}" for "${fileInfo.fileNameForXcode}".`
        );
        return;
      }

      if (
        !buildFileUUIDsByPhase[addToPhaseType].includes(result.buildFileUUID)
      ) {
        buildFileUUIDsByPhase[addToPhaseType].push(result.buildFileUUID);
      }
    }
  });

  console.log(
    '[addFilesToXcodeProject] PBXBuildFile UUIDs by phase:',
    JSON.stringify(buildFileUUIDsByPhase, null, 2)
  );

  if (!target.buildPhases) target.buildPhases = [];

  if (
    buildFileUUIDsByPhase.Sources &&
    buildFileUUIDsByPhase.Sources.length > 0
  ) {
    const sourcesPhaseResult = ensureBuildPhaseForTarget(
      project,
      pbxProjectObjects,
      target,
      'PBXSourcesBuildPhase',
      'Sources',
      (uuid) => trackingManager.trackElement(extensionName, 'buildPhase', uuid)
    );

    if (sourcesPhaseResult.phaseObject) {
      // Clean duplicates by name before adding new files
      cleanDuplicateFilesByName(
        pbxProjectObjects,
        sourcesPhaseResult.phaseObject,
        'Sources'
      );

      buildFileUUIDsByPhase.Sources.forEach((buildFileUUID_to_add) => {
        const buildFileEntry =
          pbxProjectObjects.PBXBuildFile &&
          pbxProjectObjects.PBXBuildFile[buildFileUUID_to_add];
        const fileRefUUID = buildFileEntry && buildFileEntry.fileRef;
        const fileRefEntry =
          fileRefUUID &&
          pbxProjectObjects.PBXFileReference &&
          pbxProjectObjects.PBXFileReference[fileRefUUID];
        const fileName =
          fileRefEntry && fileRefEntry.path
            ? fileRefEntry.path.replace(/"/g, '')
            : `BuildFile ${buildFileUUID_to_add}`;

        addFileToBuildPhase(
          sourcesPhaseResult.phaseObject,
          buildFileUUID_to_add,
          fileName,
          'Sources'
        );
      });
    } else {
      console.error(
        `[addFilesToXcodeProject] Could not get/create Sources phase.`
      );
    }
  }

  if (
    buildFileUUIDsByPhase.Resources &&
    buildFileUUIDsByPhase.Resources.length > 0
  ) {
    const resourcesPhaseResult = ensureBuildPhaseForTarget(
      project,
      pbxProjectObjects,
      target,
      'PBXResourcesBuildPhase',
      'Copy Bundle Resources',
      (uuid) => trackingManager.trackElement(extensionName, 'buildPhase', uuid)
    );

    if (resourcesPhaseResult.phaseObject) {
      // Clean duplicates by name before adding new files
      cleanDuplicateFilesByName(
        pbxProjectObjects,
        resourcesPhaseResult.phaseObject,
        'Copy Bundle Resources'
      );

      buildFileUUIDsByPhase.Resources.forEach((buildFileUUID_to_add) => {
        const buildFileEntry =
          pbxProjectObjects.PBXBuildFile &&
          pbxProjectObjects.PBXBuildFile[buildFileUUID_to_add];
        const fileRefUUID = buildFileEntry && buildFileEntry.fileRef;
        const fileRefEntry =
          fileRefUUID &&
          pbxProjectObjects.PBXFileReference &&
          pbxProjectObjects.PBXFileReference[fileRefUUID];
        const fileName =
          fileRefEntry && fileRefEntry.path
            ? fileRefEntry.path.replace(/"/g, '')
            : `BuildFile ${buildFileUUID_to_add}`;

        addFileToBuildPhase(
          resourcesPhaseResult.phaseObject,
          buildFileUUID_to_add,
          fileName,
          'Copy Bundle Resources'
        );
      });
    } else {
      console.error(
        `[addFilesToXcodeProject] Could not get/create Resources phase.`
      );
    }
  }

  console.log('[addFilesToXcodeProject] File linking process complete.\n');
  return config;
}
