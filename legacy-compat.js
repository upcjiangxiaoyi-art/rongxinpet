// Historical identifiers are isolated here solely to keep existing installs
// and integrations working. They are not displayed in the product or notes.
export const LEGACY_SETTINGS_KEY = 'nuoji_pet';
export const LEGACY_API_NAME = 'NuojiPet';
export const LEGACY_EVENT_NAME = 'nuoji:react';
export const LEGACY_ROOT_ID = 'nuoji-pet-root';
export const LEGACY_PANEL_ID = 'nuoji-settings';
const LEGACY_DISPLAY_NAME = '糯叽';

export function migrateLegacySettings(allSettings, newKey) {
    if (allSettings[newKey] || !allSettings[LEGACY_SETTINGS_KEY]) return false;
    // Preserve the old settings snapshot for rollback; migrate only once.
    const migrated = JSON.parse(JSON.stringify(allSettings[LEGACY_SETTINGS_KEY]));
    const renameLines = lines => {
        for (const [scene, value] of Object.entries(lines || {})) {
            if (typeof value === 'string') lines[scene] = value.replaceAll(LEGACY_DISPLAY_NAME, '绒信');
        }
    };
    renameLines(migrated.customBubbles);
    for (const lines of Object.values(migrated.cardBubbles || {})) renameLines(lines);
    allSettings[newKey] = migrated;
    return true;
}
