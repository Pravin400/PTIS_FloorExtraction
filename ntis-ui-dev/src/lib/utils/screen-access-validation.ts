import type { ScreenGroupMasterData, ScreenMasterData } from '@/types/screen-access.types';

export const screenAccessValidations = {
  /**
   * Validates if a screen group name or code is duplicate.
   */
  validateScreenGroupUniqueness: (
    data: Partial<ScreenGroupMasterData>,
    existingGroups: ScreenGroupMasterData[],
    excludeId?: number
  ) => {
    const newName = (data.screenGroupName || '').trim().toLowerCase();
    const newCode = (data.screenGroupCode || '').trim().toLowerCase();

    let isNameDuplicate = false;
    let isCodeDuplicate = false;

    for (const group of existingGroups) {
      if (excludeId !== undefined && group.screenGroupId === excludeId) {
        continue;
      }

      if (group.screenGroupName.trim().toLowerCase() === newName) {
        isNameDuplicate = true;
      }

      if (group.screenGroupCode.trim().toLowerCase() === newCode) {
        isCodeDuplicate = true;
      }
    }

    return {
      isNameDuplicate,
      isCodeDuplicate,
    };
  },

  /**
   * Validates if a screen name or code is duplicate.
   */
  validateScreenUniqueness: (
    data: Partial<ScreenMasterData>,
    existingScreens: ScreenMasterData[],
    excludeId?: number
  ) => {
    const newName = (data.screenName || '').trim().toLowerCase();
    const newCode = (data.screenCode || '').trim().toLowerCase();
    const newRoute = (data.routePath || '').trim().toLowerCase();

    let isNameDuplicate = false;
    let isCodeDuplicate = false;
    let isRouteDuplicate = false;

    for (const screen of existingScreens) {
      const sId = Number(
        screen.screenMasterId ||
          (screen as { id?: number }).id ||
          (screen as { screenId?: number }).screenId ||
          0
      );
      if (excludeId !== undefined && excludeId > 0 && sId === excludeId) {
        continue;
      }

      if (screen.screenName.trim().toLowerCase() === newName) {
        isNameDuplicate = true;
      }

      if (screen.screenCode.trim().toLowerCase() === newCode) {
        isCodeDuplicate = true;
      }

      if (screen.routePath.trim().toLowerCase() === newRoute) {
        isRouteDuplicate = true;
      }
    }

    return {
      isNameDuplicate,
      isCodeDuplicate,
      isRouteDuplicate,
    };
  },
};
