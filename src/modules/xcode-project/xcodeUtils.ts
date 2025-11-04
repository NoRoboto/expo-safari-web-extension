import { XcodeProject } from '@expo/config-plugins';

export function generateNewXcodeId(projectInstance: XcodeProject): string {
  if (!projectInstance) {
    console.error(
      '[generateNewXcodeId] CRITICAL: projectInstance is null or undefined!'
    );
    let uuid = '';
    const chars = '0123456789ABCDEF';
    for (let i = 0; i < 24; i++) {
      uuid += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    console.warn(
      `[generateNewXcodeId] projectInstance was invalid. Generated fallback random hex: ${uuid}`
    );
    return uuid;
  }

  // Prioritize generateUuid if available, as seen from logs
  if (typeof projectInstance.generateUuid === 'function') {
    return projectInstance.generateUuid();
  }
  if (typeof projectInstance.generateId === 'function') {
    return projectInstance.generateId();
  }

  console.warn(
    '[generateNewXcodeId] generateId and generateUuid not found on projectInstance. Generating a random hex string as a fallback UUID.'
  );
  let uuid = '';
  const chars = '0123456789ABCDEF';
  for (let i = 0; i < 24; i++) {
    uuid += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  console.log(
    `[generateNewXcodeId] Generated fallback random hex UUID: ${uuid}`
  );
  return uuid;
}

export function quote(str: string | null | undefined): string {
  if (str === '<group>') return '"<group>"';
  if (str === null || str === undefined) return '""';
  // Escape backslashes first, then quotes
  const escapedStr = String(str).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `"${escapedStr}"`;
}
