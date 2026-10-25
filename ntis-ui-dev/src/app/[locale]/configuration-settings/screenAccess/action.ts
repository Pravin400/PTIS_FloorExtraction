'use server';

import { ScreenMasterData } from '@/types/screen-access.types';
import {
  getScreens,
  getAllScreens,
  getScreenById,
} from '@/lib/api/configuration-settings/screenAccess/screen-master.services';
import {
  getScreenGroups,
  getScreenGroupById,
} from '@/lib/api/configuration-settings/screenAccess/screen-group.services';
import {
  getRoles,
  getScreenAccessWithAllScreens,
} from '@/lib/api/configuration-settings/screenAccess/role-access.service';
import {
  getDepartments,
  getModules,
} from '@/lib/api/configuration-settings/screenAccess/master-data.service';
import { performAction } from './action.utils';

export const getScreensAction = async (
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  isActive?: boolean,
  groupId?: number
) =>
  performAction(
    () =>
      getScreens({
        pageNumber,
        pageSize,
        searchTerm,
        screenGroupId: groupId,
        isActive,
      }),
    false
  );

export const getAllScreensAction = async () =>
  performAction(async () => {
    return getAllScreens();
  }, false);

export const getScreenGroupsAction = async (
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  isActive?: boolean
) =>
  performAction(
    () =>
      getScreenGroups({
        pageNumber,
        pageSize,
        searchTerm,
        isActive,
      }),
    false
  );

export const getRolesAction = async () => performAction(() => getRoles(), false);

export const getDepartmentsAction = async () => performAction(() => getDepartments(), false);

export const getScreenByIdAction = async (id: number) =>
  performAction(() => getScreenById(id), false);

export const getScreenGroupByIdAction = async (id: number) =>
  performAction(() => getScreenGroupById(id), false);

export const getModulesAction = async () => performAction(() => getModules(), false);

export const getScreenAccessWithAllScreensAction = async (
  roleId: number,
  screens: ScreenMasterData[]
) =>
  performAction(
    () =>
      getScreenAccessWithAllScreens({
        roleId,
        preFetchedScreens: screens,
      }),
    false
  );
