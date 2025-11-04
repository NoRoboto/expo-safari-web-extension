import { XcodeProject } from '@expo/config-plugins';
import { generateNewXcodeId, quote } from './xcodeUtils';

export interface PBXGroupCreationResult {
  groupUUID: string;
  wasCreated: boolean;
}

export function ensurePBXGroup(
  project: XcodeProject,
  pbxProjectObjects: any,
  parentGroupUUID: string,
  groupName: string,
  groupPath?: string,
  trackingCallback?: (uuid: string) => void
): PBXGroupCreationResult {
  const parentGroup =
    pbxProjectObjects.PBXGroup && pbxProjectObjects.PBXGroup[parentGroupUUID];

  if (!parentGroup || !parentGroup.children) {
    console.error(
      `[ensurePBXGroup] Parent group ${parentGroupUUID} not found or has no children`
    );
    return { groupUUID: '', wasCreated: false };
  }

  // Check if group already exists
  let existingGroupUUID = (parentGroup.children || [])
    .map((c: any) => c.value)
    .find((uuid: string) => {
      const group =
        pbxProjectObjects.PBXGroup && pbxProjectObjects.PBXGroup[uuid];
      return (
        group &&
        group.path === quote(groupPath || groupName) &&
        group.name === quote(groupName)
      );
    });

  if (existingGroupUUID) {
    console.log(
      `[ensurePBXGroup] Using existing PBXGroup "${groupName}" (${existingGroupUUID})`
    );
    return { groupUUID: existingGroupUUID, wasCreated: false };
  }

  // Create new group
  const newGroupUUID = generateNewXcodeId(project);
  if (!pbxProjectObjects.PBXGroup) pbxProjectObjects.PBXGroup = {};

  pbxProjectObjects.PBXGroup[newGroupUUID] = {
    isa: quote('PBXGroup'),
    children: [],
    name: quote(groupName),
    path: quote(groupPath || groupName),
    sourceTree: quote('<group>'),
  };

  parentGroup.children.push({
    value: newGroupUUID,
    comment: groupName,
  });

  console.log(
    `[ensurePBXGroup] Created PBXGroup "${groupName}" (${newGroupUUID})`
  );

  // Track the new group for cleanup
  if (trackingCallback) {
    trackingCallback(newGroupUUID);
  }

  return { groupUUID: newGroupUUID, wasCreated: true };
}

export function getMainProjectGroup(
  project: XcodeProject,
  pbxProjectObjects: any
): string | null {
  const mainProjectGroupUUID =
    project.getFirstProject &&
    project.getFirstProject().firstProject &&
    project.getFirstProject().firstProject.mainGroup;

  const mainProjectGroup = mainProjectGroupUUID
    ? pbxProjectObjects.PBXGroup &&
      pbxProjectObjects.PBXGroup[mainProjectGroupUUID]
    : null;

  return mainProjectGroup ? mainProjectGroupUUID : null;
}

export function removeExistingPBXGroup(
  _project: XcodeProject,
  pbxProjectObjects: any,
  parentGroupUUID: string,
  groupName: string
): boolean {
  const parentGroup =
    pbxProjectObjects.PBXGroup && pbxProjectObjects.PBXGroup[parentGroupUUID];

  if (!parentGroup || !parentGroup.children) {
    return false;
  }

  // Find existing group
  const existingGroupIndex = (parentGroup.children || []).findIndex(
    (c: any) => {
      const group =
        pbxProjectObjects.PBXGroup && pbxProjectObjects.PBXGroup[c.value];
      return group && group.name === quote(groupName);
    }
  );

  if (existingGroupIndex !== -1) {
    const existingGroupUUID = parentGroup.children[existingGroupIndex].value;
    const existingGroup = pbxProjectObjects.PBXGroup[existingGroupUUID];

    console.log(
      `[removeExistingPBXGroup] Removing existing group "${groupName}" (${existingGroupUUID})`
    );

    // Recursively remove all child groups and files
    if (existingGroup && existingGroup.children) {
      existingGroup.children.forEach((child: any) => {
        const childUUID = child.value;
        // Remove from PBXGroup if it's a group
        if (
          pbxProjectObjects.PBXGroup &&
          pbxProjectObjects.PBXGroup[childUUID]
        ) {
          delete pbxProjectObjects.PBXGroup[childUUID];
        }
        // Remove from PBXFileReference if it's a file
        if (
          pbxProjectObjects.PBXFileReference &&
          pbxProjectObjects.PBXFileReference[childUUID]
        ) {
          delete pbxProjectObjects.PBXFileReference[childUUID];
        }
        // Remove from PBXBuildFile if it's a build file
        Object.keys(pbxProjectObjects.PBXBuildFile || {}).forEach(
          (buildFileUUID) => {
            const buildFile = pbxProjectObjects.PBXBuildFile[buildFileUUID];
            if (buildFile && buildFile.fileRef === childUUID) {
              delete pbxProjectObjects.PBXBuildFile[buildFileUUID];
            }
          }
        );
      });
    }

    // Remove the group itself
    delete pbxProjectObjects.PBXGroup[existingGroupUUID];

    // Remove from parent's children
    parentGroup.children.splice(existingGroupIndex, 1);

    console.log(
      `[removeExistingPBXGroup] Successfully removed group "${groupName}"`
    );
    return true;
  }

  return false;
}
