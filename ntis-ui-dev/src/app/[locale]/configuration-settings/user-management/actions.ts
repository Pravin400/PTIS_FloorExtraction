'use server';

import {
  getUsers,
  getUserById,
  getRoles,
  getRoleById,
  getDepartments,
  getModules,
  getDesignations,
  getDesignationById,
} from '@/lib/api/configuration-settings/user-management/user-management.services';
import { getUserId, performAction } from './action.utils';

export const getUsersAction = async (
  pageNumber?: number,
  pageSize?: number,
  searchTerm?: string,
  isActive?: boolean
) =>
  performAction(
    () =>
      getUsers({
        pageNumber,
        pageSize,
        searchTerm,
        isActive,
      }),
    false
  );

export const getUserByIdAction = async (id: string) => performAction(() => getUserById(id), false);

export const getUserRolesAction = async () => performAction(() => getRoles(), false);

export const getRoleByIdAction = async (id: string) => performAction(() => getRoleById(id), false);

export const getDepartmentsAction = async () =>
  performAction(() => getDepartments({ isActive: true }), false);

export const getModulesAction = async () => performAction(() => getModules(), false);

export const getDesignationsAction = async () => performAction(() => getDesignations(), false);

export const getDesignationByIdAction = async (id: string) =>
  performAction(() => getDesignationById(id), false);

/**
 * The id of the currently logged-in admin — used by the 2FA setup wizard to detect when an
 * admin is setting up 2FA on their OWN account rather than someone else's, since enabling 2FA
 * always rotates the target's security stamp and self-targeting therefore invalidates the
 * admin's own active session.
 */
export const getCurrentUserIdAction = async () => performAction(() => getUserId(), false);
