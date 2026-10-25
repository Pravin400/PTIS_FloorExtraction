'use server';

import {
  ScreenMasterData,
  ScreenGroupMasterData,
  ScreenAccessPermissionData,
} from '@/types/screen-access.types';
import {
  createScreen,
  updateScreen,
  deleteScreen,
  getScreens,
} from '@/lib/api/configuration-settings/screenAccess/screen-master.services';
import {
  createScreenGroup,
  updateScreenGroup,
  deleteScreenGroup,
  getScreenGroups,
} from '@/lib/api/configuration-settings/screenAccess/screen-group.services';
import { updateScreenAccess } from '@/lib/api/configuration-settings/screenAccess/role-access.service';
import { getUserId, performAction } from './action.utils';
import { validateForm, commonValidations } from '@/lib/utils/validation';
import { screenAccessValidations } from '@/lib/utils/screen-access-validation';
import { getTranslations } from 'next-intl/server';
import {
  SCREEN_CODE_MAX,
  SCREEN_NAME_MAX,
  GROUP_CODE_MAX,
  GROUP_NAME_MAX,
} from '@/lib/constants/screen-access.constants';

export const createScreenAction = async (data: Partial<ScreenMasterData>) =>
  performAction(async () => {
    const t = await getTranslations('screenAccess');
    const tCommon = await getTranslations('common');

    const errors = validateForm(data, {
      screenCode: (val) => commonValidations.masterCode(tCommon, SCREEN_CODE_MAX)(val),
      screenName: (val) => commonValidations.masterDescription(tCommon, SCREEN_NAME_MAX)(val),
      screenGroupId: (val) =>
        !val ? t('screenManagement.screens.form.errors.groupRequired') : undefined,
      departmentMasterId: (val) =>
        !val ? t('screenManagement.screens.form.errors.departmentRequired') : undefined,
      routePath: (val) =>
        !val ? t('screenManagement.screens.form.errors.routeRequired') : undefined,
      moduleId: (val) =>
        !val ? t('screenManagement.screens.form.errors.moduleRequired') : undefined,
    });

    if (Object.keys(errors).length > 0) {
      return { success: false, validationErrors: errors as Record<string, string> };
    }

    // Check duplicate Screen Name, Code and Route uniqueness
    const screensRes = await getScreens({ pageNumber: 1, pageSize: 2000 });
    const { isNameDuplicate, isCodeDuplicate, isRouteDuplicate } =
      screenAccessValidations.validateScreenUniqueness(data, screensRes.items ?? []);

    if (isNameDuplicate || isCodeDuplicate || isRouteDuplicate) {
      const validationErrors: Record<string, string> = {};
      if (isNameDuplicate) {
        validationErrors.screenName = t('screenManagement.screens.form.errors.duplicateName');
      }
      if (isCodeDuplicate) {
        validationErrors.screenCode = t('screenManagement.screens.form.errors.duplicateCode');
      }
      if (isRouteDuplicate) {
        validationErrors.routePath = t('screenManagement.screens.form.errors.duplicateRoute');
      }
      return {
        success: false,
        validationErrors,
      };
    }

    const userId = await getUserId();
    return createScreen(data, userId);
  }, true);

export const updateScreenAction = async (id: number, data: Partial<ScreenMasterData>) =>
  performAction(async () => {
    const t = await getTranslations('screenAccess');
    const tCommon = await getTranslations('common');

    const errors = validateForm(data, {
      screenCode: (val) => commonValidations.masterCode(tCommon, SCREEN_CODE_MAX)(val),
      screenName: (val) => commonValidations.masterDescription(tCommon, SCREEN_NAME_MAX)(val),
      screenGroupId: (val) =>
        !val ? t('screenManagement.screens.form.errors.groupRequired') : undefined,
      departmentMasterId: (val) =>
        !val ? t('screenManagement.screens.form.errors.departmentRequired') : undefined,
      routePath: (val) =>
        !val ? t('screenManagement.screens.form.errors.routeRequired') : undefined,
      isActive: (val) => commonValidations.masterActiveStatus(tCommon, true)(val),
      moduleId: (val) =>
        !val ? t('screenManagement.screens.form.errors.moduleRequired') : undefined,
    });

    if (Object.keys(errors).length > 0) {
      return { success: false, validationErrors: errors as Record<string, string> };
    }

    // Check duplicate Screen Name, Code and Route uniqueness
    const screensRes = await getScreens({ pageNumber: 1, pageSize: 2000 });
    const { isNameDuplicate, isCodeDuplicate, isRouteDuplicate } =
      screenAccessValidations.validateScreenUniqueness(data, screensRes.items ?? [], id);

    if (isNameDuplicate || isCodeDuplicate || isRouteDuplicate) {
      const validationErrors: Record<string, string> = {};
      if (isNameDuplicate) {
        validationErrors.screenName = t('screenManagement.screens.form.errors.duplicateName');
      }
      if (isCodeDuplicate) {
        validationErrors.screenCode = t('screenManagement.screens.form.errors.duplicateCode');
      }
      if (isRouteDuplicate) {
        validationErrors.routePath = t('screenManagement.screens.form.errors.duplicateRoute');
      }
      return {
        success: false,
        validationErrors,
      };
    }

    const userId = await getUserId();
    return updateScreen(id, data, userId);
  }, true);

export const deleteScreenAction = async (id: number) => performAction(() => deleteScreen(id), true);

export const createScreenGroupAction = async (data: Partial<ScreenGroupMasterData>) =>
  performAction(async () => {
    const tCommon = await getTranslations('common');

    const errors = validateForm(data, {
      screenGroupCode: (val) => commonValidations.masterCode(tCommon, GROUP_CODE_MAX)(val),
      screenGroupName: (val) => commonValidations.masterDescription(tCommon, GROUP_NAME_MAX)(val),
    });

    if (Object.keys(errors).length > 0) {
      return { success: false, validationErrors: errors as Record<string, string> };
    }

    // Check duplicate Group Name and Code uniqueness
    const groupsRes = await getScreenGroups({ pageNumber: 1, pageSize: 2000 });
    const { isNameDuplicate, isCodeDuplicate } =
      screenAccessValidations.validateScreenGroupUniqueness(data, groupsRes.items ?? []);

    if (isNameDuplicate || isCodeDuplicate) {
      const t = await getTranslations('screenAccess');
      const validationErrors: Record<string, string> = {};
      if (isNameDuplicate) {
        validationErrors.screenGroupName = t('screenManagement.groups.form.errors.duplicateName');
      }
      if (isCodeDuplicate) {
        validationErrors.screenGroupCode = t('screenManagement.groups.form.errors.duplicateCode');
      }
      return {
        success: false,
        validationErrors,
      };
    }

    const userId = await getUserId();
    const nextDisplayOrder =
      (groupsRes.items ?? []).reduce((maxOrder, group) => {
        const order = Number(group.displayOrder ?? 0);
        return Number.isFinite(order) ? Math.max(maxOrder, order) : maxOrder;
      }, 0) + 1;

    return createScreenGroup({ ...data, displayOrder: nextDisplayOrder }, userId);
  }, true);

export const updateScreenGroupAction = async (id: number, data: Partial<ScreenGroupMasterData>) =>
  performAction(async () => {
    const tCommon = await getTranslations('common');

    const errors = validateForm(data, {
      screenGroupCode: (val) => commonValidations.masterCode(tCommon, GROUP_CODE_MAX)(val),
      screenGroupName: (val) => commonValidations.masterDescription(tCommon, GROUP_NAME_MAX)(val),
      isActive: (val) => commonValidations.masterActiveStatus(tCommon, true)(val),
    });

    if (Object.keys(errors).length > 0) {
      return { success: false, validationErrors: errors as Record<string, string> };
    }

    // Check duplicate Group Name and Code uniqueness
    const groupsRes = await getScreenGroups({ pageNumber: 1, pageSize: 2000 });
    const { isNameDuplicate, isCodeDuplicate } =
      screenAccessValidations.validateScreenGroupUniqueness(data, groupsRes.items ?? [], id);

    if (isNameDuplicate || isCodeDuplicate) {
      const t = await getTranslations('screenAccess');
      const validationErrors: Record<string, string> = {};
      if (isNameDuplicate) {
        validationErrors.screenGroupName = t('screenManagement.groups.form.errors.duplicateName');
      }
      if (isCodeDuplicate) {
        validationErrors.screenGroupCode = t('screenManagement.groups.form.errors.duplicateCode');
      }
      return {
        success: false,
        validationErrors,
      };
    }

    const userId = await getUserId();
    return updateScreenGroup(id, data, userId);
  }, true);

export const deleteScreenGroupAction = async (id: number) =>
  performAction(() => deleteScreenGroup(id), true);

export const updateScreenAccessAction = async (data: ScreenAccessPermissionData[]) =>
  performAction(async () => {
    const userId = await getUserId();
    return updateScreenAccess(data, userId);
  }, true);
