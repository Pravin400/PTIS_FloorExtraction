'use server';

import {
  createUser,
  updateUser,
  deleteUser,
  requireUserTwoFactor,
  unrequireUserTwoFactor,
  resetUserTwoFactor,
  beginUserTwoFactorSetup,
  enableUserTwoFactor,
  confirmUserTwoFactorEmail,
  createUserRole,
  updateUserRole,
  deleteUserRole,
  createDesignation,
  updateDesignation,
  deleteDesignation,
  getUsers,
} from '@/lib/api/configuration-settings/user-management/user-management.services';
import { getUserId, performAction, type ActionResponse } from './action.utils';
import { userManagementValidations } from '@/lib/utils/validation';
import { getTranslations } from 'next-intl/server';
import { User, Role, Designation } from '@/types/user-management';

export const createUserAction = async (data: Partial<User>): Promise<ActionResponse<User>> => {
  const t = await getTranslations('userManagement');
  const tCommon = await getTranslations('common');

  const usersRes = await getUsers({ pageNumber: 1, pageSize: 2000 });
  const errors = userManagementValidations.validateUser(
    data,
    t,
    tCommon,
    false,
    usersRes.items ?? []
  );

  if (Object.keys(errors).length > 0) {
    return { success: false, validationErrors: errors as Record<string, string> };
  }

  return performAction(async () => {
    const userId = await getUserId();
    return createUser(data, userId);
  }, true);
};

export const updateUserAction = async (
  id: number,
  data: Partial<User>
): Promise<ActionResponse<User>> => {
  const t = await getTranslations('userManagement');
  const tCommon = await getTranslations('common');

  const usersRes = await getUsers({ pageNumber: 1, pageSize: 2000 });
  const errors = userManagementValidations.validateUser(
    data,
    t,
    tCommon,
    true,
    usersRes.items ?? [],
    id
  );

  if (Object.keys(errors).length > 0) {
    return { success: false, validationErrors: errors as Record<string, string> };
  }

  return performAction(async () => {
    const userId = await getUserId();
    return updateUser(id, data, userId);
  }, true);
};

export const deleteUserAction = async (id: string) => performAction(() => deleteUser(id), true);

export const requireUserTwoFactorAction = async (id: number) =>
  performAction(async () => {
    const userId = await getUserId();
    return requireUserTwoFactor(id, userId);
  }, true);

export const unrequireUserTwoFactorAction = async (id: number) =>
  performAction(async () => {
    const userId = await getUserId();
    return unrequireUserTwoFactor(id, userId);
  }, true);

export const resetUserTwoFactorAction = async (id: number) =>
  performAction(async () => {
    const userId = await getUserId();
    return resetUserTwoFactor(id, userId);
  }, true);

export const beginUserTwoFactorSetupAction = async (id: number) =>
  performAction(() => beginUserTwoFactorSetup(id), false);

export const enableUserTwoFactorAction = async (id: number, code: string) =>
  performAction(() => enableUserTwoFactor(id, code), false);

export const confirmUserTwoFactorEmailAction = async (id: number, code: string) =>
  performAction(() => confirmUserTwoFactorEmail(id, code), false);

export const createUserRoleAction = async (data: Partial<Role>) =>
  performAction(async () => {
    const userId = await getUserId();
    return createUserRole(data, userId);
  }, true);

export const updateUserRoleAction = async (data: Partial<Role>) =>
  performAction(async () => {
    const userId = await getUserId();
    return updateUserRole(data, userId);
  }, true);

export const deleteUserRoleAction = async (id: string | number) =>
  performAction(() => deleteUserRole(String(id)), true);

export const createDesignationAction = async (data: Partial<Designation>) =>
  performAction(async () => {
    const userId = await getUserId();
    return createDesignation(data, userId);
  }, true);

export const updateDesignationAction = async (data: Partial<Designation>) =>
  performAction(async () => {
    const userId = await getUserId();
    return updateDesignation(data, userId);
  }, true);

export const deleteDesignationAction = async (id: string | number) =>
  performAction(() => deleteDesignation(String(id)), true);
