import { XcodeProject } from '@expo/config-plugins';
import { getXcodeFileReferenceType } from '../xcodeFileTypes';
import { generateNewXcodeId, quote } from './xcodeUtils';

export interface FileToAdd {
  fileNameForXcode: string;
  groupUUID: string;
  addToPhaseType: string | null;
  isDirectory: boolean;
}

export interface FileReferenceResult {
  fileRefUUID: string;
  buildFileUUID?: string;
}

export function createFileReference(
  project: XcodeProject,
  pbxProjectObjects: any,
  fileInfo: FileToAdd,
  trackingCallback?: {
    trackFileReference: (uuid: string) => void;
    trackBuildFile: (uuid: string) => void;
  }
): FileReferenceResult {
  const { fileNameForXcode, groupUUID, addToPhaseType, isDirectory } = fileInfo;

  const group =
    pbxProjectObjects.PBXGroup && pbxProjectObjects.PBXGroup[groupUUID];
  if (!group) {
    console.error(
      `[createFileReference] Group ${groupUUID} for item ${fileNameForXcode} NOT FOUND.`
    );
    return { fileRefUUID: '' };
  }

  if (!group.children) group.children = [];

  // Check if file reference already exists
  let fileRefUUID = (group.children || [])
    .map((c: any) => c.value)
    .find((uuid: string) => {
      const fileRef =
        pbxProjectObjects.PBXFileReference &&
        pbxProjectObjects.PBXFileReference[uuid];
      return (
        fileRef &&
        fileRef.path === quote(fileNameForXcode) &&
        fileRef.name === quote(fileNameForXcode)
      );
    });

  if (!fileRefUUID) {
    fileRefUUID = generateNewXcodeId(project);
    if (!pbxProjectObjects.PBXFileReference)
      pbxProjectObjects.PBXFileReference = {};

    pbxProjectObjects.PBXFileReference[fileRefUUID] = {
      isa: quote('PBXFileReference'),
      lastKnownFileType: quote(
        getXcodeFileReferenceType(fileNameForXcode, isDirectory)
      ),
      name: quote(fileNameForXcode),
      path: quote(fileNameForXcode),
      sourceTree: quote('<group>'),
    };

    group.children.push({ value: fileRefUUID, comment: fileNameForXcode });

    // Track the new file reference for cleanup
    if (trackingCallback) {
      trackingCallback.trackFileReference(fileRefUUID);
    }

    console.log(
      `[createFileReference] Created PBXFileReference for "${fileNameForXcode}" (isDir: ${isDirectory})`
    );
  } else {
    console.log(
      `[createFileReference] Using existing PBXFileReference for "${fileNameForXcode}" (isDir: ${isDirectory})`
    );
  }

  let buildFileUUID: string | undefined;

  if (addToPhaseType) {
    // Check if build file already exists
    buildFileUUID = Object.keys(pbxProjectObjects.PBXBuildFile || {}).find(
      (uuid) => {
        const bf = pbxProjectObjects.PBXBuildFile[uuid];
        return bf.fileRef === fileRefUUID;
      }
    );

    if (!buildFileUUID) {
      buildFileUUID = generateNewXcodeId(project);
      if (!pbxProjectObjects.PBXBuildFile) pbxProjectObjects.PBXBuildFile = {};

      pbxProjectObjects.PBXBuildFile[buildFileUUID] = {
        isa: quote('PBXBuildFile'),
        fileRef: fileRefUUID,
      };

      // Track the new build file for cleanup
      if (trackingCallback) {
        trackingCallback.trackBuildFile(buildFileUUID);
      }

      console.log(
        `[createFileReference] Created PBXBuildFile for "${fileNameForXcode}"`
      );
    } else {
      console.log(
        `[createFileReference] Using existing PBXBuildFile for "${fileNameForXcode}"`
      );
    }
  }

  return { fileRefUUID, buildFileUUID };
}
