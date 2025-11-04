import * as fs from 'fs';
import * as path from 'path';

export interface ExtensionTrackingData {
  extensionName: string;
  targetUUID?: string;
  groupUUIDs: string[];
  buildPhaseUUIDs: string[];
  fileReferenceUUIDs: string[];
  buildFileUUIDs: string[];
  createdAt: string;
}

export class TrackingManager {
  private trackingFilePath: string;

  constructor(_platformProjectRoot: string) {
    // Store in our module's directory, not user's project
    const moduleDir = path.join(__dirname, '..');
    const tempDir = path.join(moduleDir, '.temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    this.trackingFilePath = path.join(
      tempDir,
      'safari-extension-tracking.json'
    );
  }

  /**
   * Loads existing tracking data for the extension
   */
  loadTrackingData(extensionName: string): ExtensionTrackingData | null {
    try {
      if (!fs.existsSync(this.trackingFilePath)) {
        return null;
      }

      const data = JSON.parse(fs.readFileSync(this.trackingFilePath, 'utf8'));
      return data[extensionName] || null;
    } catch (error) {
      console.warn(`[TrackingManager] Could not load tracking data: ${error}`);
      return null;
    }
  }

  /**
   * Saves tracking data for the extension
   */
  saveTrackingData(extensionName: string, data: ExtensionTrackingData): void {
    try {
      let allData: Record<string, ExtensionTrackingData> = {};

      if (fs.existsSync(this.trackingFilePath)) {
        allData = JSON.parse(fs.readFileSync(this.trackingFilePath, 'utf8'));
      }

      // Clean old entries and different extensions
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      Object.keys(allData).forEach((key) => {
        const entry = allData[key];
        if (entry && entry.createdAt) {
          const entryDate = new Date(entry.createdAt);
          // Remove if older than 7 days OR different extension
          if (entryDate < sevenDaysAgo || key !== extensionName) {
            delete allData[key];
            console.log(
              `[TrackingManager] Cleaned tracking data for ${key} (${key !== extensionName ? 'different extension' : 'old entry'})`
            );
          }
        }
      });

      allData[extensionName] = {
        ...data,
        createdAt: new Date().toISOString(),
      };

      fs.writeFileSync(this.trackingFilePath, JSON.stringify(allData, null, 2));
      console.log(`[TrackingManager] Saved tracking data for ${extensionName}`);
    } catch (error) {
      console.warn(`[TrackingManager] Could not save tracking data: ${error}`);
    }
  }

  /**
   * Cleans previously created Xcode elements based on tracking data
   */
  cleanPreviousElements(pbxProjectObjects: any, extensionName: string): void {
    const trackingData = this.loadTrackingData(extensionName);
    if (!trackingData) {
      console.log(
        `[TrackingManager] No previous tracking data found for ${extensionName}, will still clean duplicates`
      );
      // Even without tracking data, let's clean any duplicates we can find
      this.cleanAllExtensionElements(pbxProjectObjects, extensionName);
      return;
    }

    console.log(
      `[TrackingManager] *** CLEANING PREVIOUS ELEMENTS FOR ${extensionName} ***`
    );

    // Clean build files
    trackingData.buildFileUUIDs.forEach((uuid) => {
      if (
        pbxProjectObjects.PBXBuildFile &&
        pbxProjectObjects.PBXBuildFile[uuid]
      ) {
        delete pbxProjectObjects.PBXBuildFile[uuid];
        console.log(`[TrackingManager] Removed PBXBuildFile: ${uuid}`);
      }
    });

    // Clean build phases
    trackingData.buildPhaseUUIDs.forEach((uuid) => {
      [
        'PBXSourcesBuildPhase',
        'PBXResourcesBuildPhase',
        'PBXFrameworksBuildPhase',
      ].forEach((phaseType) => {
        if (
          pbxProjectObjects[phaseType] &&
          pbxProjectObjects[phaseType][uuid]
        ) {
          delete pbxProjectObjects[phaseType][uuid];
          console.log(`[TrackingManager] Removed ${phaseType}: ${uuid}`);
        }
      });
    });

    // Clean file references
    trackingData.fileReferenceUUIDs.forEach((uuid) => {
      if (
        pbxProjectObjects.PBXFileReference &&
        pbxProjectObjects.PBXFileReference[uuid]
      ) {
        delete pbxProjectObjects.PBXFileReference[uuid];
        console.log(`[TrackingManager] Removed PBXFileReference: ${uuid}`);
      }
    });

    // Clean groups
    trackingData.groupUUIDs.forEach((uuid) => {
      if (pbxProjectObjects.PBXGroup && pbxProjectObjects.PBXGroup[uuid]) {
        delete pbxProjectObjects.PBXGroup[uuid];
        console.log(`[TrackingManager] Removed PBXGroup: ${uuid}`);
      }
    });

    // Don't clean targets - let them be reused
    // if (trackingData.targetUUID) {
    //   const projectSection = pbxProjectObjects.PBXProject;
    //   if (projectSection) {
    //     Object.values(projectSection).forEach((proj: any) => {
    //       if (proj.targets) {
    //         const originalLength = proj.targets.length;
    //         proj.targets = proj.targets.filter((t: any) => t.value !== trackingData.targetUUID);
    //         if (proj.targets.length < originalLength) {
    //           console.log(`[TrackingManager] Removed target reference: ${trackingData.targetUUID}`);
    //         }
    //       }
    //     });
    //   }

    //   // Clean target itself
    //   if (pbxProjectObjects.PBXNativeTarget && pbxProjectObjects.PBXNativeTarget[trackingData.targetUUID]) {
    //     delete pbxProjectObjects.PBXNativeTarget[trackingData.targetUUID];
    //     console.log(`[TrackingManager] Removed PBXNativeTarget: ${trackingData.targetUUID}`);
    //   }
    // }

    console.log(
      `[TrackingManager] *** FINISHED CLEANING PREVIOUS ELEMENTS ***`
    );
  }

  /**
   * Tracks a new UUID for cleanup in future runs
   */
  trackElement(
    extensionName: string,
    elementType:
      | 'group'
      | 'buildPhase'
      | 'fileReference'
      | 'buildFile'
      | 'target',
    uuid: string
  ): void {
    const trackingData = this.loadTrackingData(extensionName) || {
      extensionName,
      groupUUIDs: [],
      buildPhaseUUIDs: [],
      fileReferenceUUIDs: [],
      buildFileUUIDs: [],
      createdAt: new Date().toISOString(),
    };

    switch (elementType) {
      case 'group':
        if (!trackingData.groupUUIDs.includes(uuid)) {
          trackingData.groupUUIDs.push(uuid);
        }
        break;
      case 'buildPhase':
        if (!trackingData.buildPhaseUUIDs.includes(uuid)) {
          trackingData.buildPhaseUUIDs.push(uuid);
        }
        break;
      case 'fileReference':
        if (!trackingData.fileReferenceUUIDs.includes(uuid)) {
          trackingData.fileReferenceUUIDs.push(uuid);
        }
        break;
      case 'buildFile':
        if (!trackingData.buildFileUUIDs.includes(uuid)) {
          trackingData.buildFileUUIDs.push(uuid);
        }
        break;
      case 'target':
        // Don't track targets - let them be reused
        // trackingData.targetUUID = uuid;
        break;
    }

    this.saveTrackingData(extensionName, trackingData);
  }

  /**
   * Cleans extension elements by name when no tracking data is available
   * This is a conservative approach that only cleans duplicate build phases
   */
  private cleanAllExtensionElements(
    pbxProjectObjects: any,
    extensionName: string
  ): void {
    console.log(
      `[TrackingManager] *** CONSERVATIVE CLEANUP FOR ${extensionName} - ONLY DUPLICATE BUILD PHASES ***`
    );

    // Only clean duplicate build phases from the extension target
    const nativeTargets = pbxProjectObjects.PBXNativeTarget || {};

    Object.values(nativeTargets).forEach((target: any) => {
      if (target.isa === 'PBXNativeTarget') {
        const targetName = target.name?.replace(/"/g, '') || '';

        if (targetName === extensionName && target.buildPhases) {
          // Clean duplicate Sources build phases
          const sourcePhases = target.buildPhases.filter((phase: any) => {
            return (
              pbxProjectObjects.PBXSourcesBuildPhase &&
              pbxProjectObjects.PBXSourcesBuildPhase[phase.value]
            );
          });

          if (sourcePhases.length > 1) {
            console.log(
              `[TrackingManager] Found ${sourcePhases.length} Sources build phases for ${extensionName}, removing duplicates`
            );
            // Keep only the first one, remove the rest
            for (let i = 1; i < sourcePhases.length; i++) {
              const phaseToRemove = sourcePhases[i];
              const phaseUUID = phaseToRemove.value;

              // Remove from target's buildPhases array
              const index = target.buildPhases.findIndex(
                (p: any) => p.value === phaseUUID
              );
              if (index !== -1) {
                target.buildPhases.splice(index, 1);
              }

              // Remove from PBXSourcesBuildPhase section
              delete pbxProjectObjects.PBXSourcesBuildPhase[phaseUUID];
              console.log(
                `[TrackingManager] Removed duplicate Sources build phase ${phaseUUID}`
              );
            }
          }

          // Clean duplicate Resources build phases
          const resourcePhases = target.buildPhases.filter((phase: any) => {
            return (
              pbxProjectObjects.PBXResourcesBuildPhase &&
              pbxProjectObjects.PBXResourcesBuildPhase[phase.value]
            );
          });

          if (resourcePhases.length > 1) {
            console.log(
              `[TrackingManager] Found ${resourcePhases.length} Resources build phases for ${extensionName}, removing duplicates`
            );
            // Keep only the first one, remove the rest
            for (let i = 1; i < resourcePhases.length; i++) {
              const phaseToRemove = resourcePhases[i];
              const phaseUUID = phaseToRemove.value;

              // Remove from target's buildPhases array
              const index = target.buildPhases.findIndex(
                (p: any) => p.value === phaseUUID
              );
              if (index !== -1) {
                target.buildPhases.splice(index, 1);
              }

              // Remove from PBXResourcesBuildPhase section
              delete pbxProjectObjects.PBXResourcesBuildPhase[phaseUUID];
              console.log(
                `[TrackingManager] Removed duplicate Resources build phase ${phaseUUID}`
              );
            }
          }
        }
      }
    });

    console.log(`[TrackingManager] *** FINISHED CONSERVATIVE CLEANUP ***`);
  }
}
