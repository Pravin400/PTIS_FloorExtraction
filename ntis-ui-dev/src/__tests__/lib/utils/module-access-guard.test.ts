import { describe, it, expect } from 'vitest';
import {
  applyModuleActivationGate,
  buildActiveModuleIdSet,
  isModuleActive,
  mergeUserScreens,
  filterScreensByAllocatedRoles,
} from '@/lib/utils/module-access-guard';
import type { UserScreenAccess } from '@/types/user-screen-access.types';

const baseScreen: UserScreenAccess = {
  departmentId: 1,
  departmentName: 'Property Tax',
  moduleId: 10,
  moduleName: 'Property Tax Module',
  userId: 1,
  userRoleId: 1,
  screenCode: 'BANK_MASTER',
  screenName: 'Bank Master',
  screenNameLocal: '',
  screenIcon: 'bank',
  routePath: '/bank-master',
  isMenu: true,
  canView: true,
  canEdit: true,
  canDelete: false,
  haveFullAccess: false,
  haveNoAccess: false,
};

describe('module-access-guard', () => {
  it('buildActiveModuleIdSet includes only active modules', () => {
    const activeIds = buildActiveModuleIdSet([
      { moduleMasterId: 1, moduleName: 'Active', isActive: true },
      { moduleMasterId: 2, moduleName: 'Inactive', isActive: false },
    ]);

    expect(activeIds.has(1)).toBe(true);
    expect(activeIds.has(2)).toBe(false);
  });

  it('applyModuleActivationGate suspends access for inactive modules', () => {
    const activeIds = buildActiveModuleIdSet([
      { moduleMasterId: 10, moduleName: 'Active', isActive: true },
    ]);

    const [gated] = applyModuleActivationGate([baseScreen], activeIds);

    expect(gated.canView).toBe(true);
    expect(gated.haveNoAccess).toBe(false);

    const inactiveIds = buildActiveModuleIdSet([
      { moduleMasterId: 10, moduleName: 'Inactive', isActive: false },
    ]);
    const [blocked] = applyModuleActivationGate([baseScreen], inactiveIds);

    expect(blocked.canView).toBe(false);
    expect(blocked.canEdit).toBe(false);
    expect(blocked.haveFullAccess).toBe(false);
    expect(blocked.haveNoAccess).toBe(true);
  });

  it('isModuleActive treats missing module id as active', () => {
    const activeIds = new Set<number>([1]);
    expect(isModuleActive(undefined, activeIds)).toBe(true);
    expect(isModuleActive(1, activeIds)).toBe(true);
    expect(isModuleActive(2, activeIds)).toBe(false);
  });
});

describe('mergeUserScreens', () => {
  it('should return an empty array if inputs are empty', () => {
    expect(mergeUserScreens([])).toEqual([]);
  });

  it('should merge duplicate screens based on screenCode', () => {
    const screen1: UserScreenAccess = {
      ...baseScreen,
      userRoleId: 1,
      canView: false,
      canEdit: false,
      haveNoAccess: true,
    };
    const screen2: UserScreenAccess = {
      ...baseScreen,
      userRoleId: 2,
      canView: true,
      canEdit: false,
      haveNoAccess: false,
    };

    const merged = mergeUserScreens([screen1, screen2]);
    expect(merged).toHaveLength(1);
    expect(merged[0].canView).toBe(true);
    expect(merged[0].canEdit).toBe(false);
    expect(merged[0].haveNoAccess).toBe(false);
  });

  it('should merge permissions using OR logic where highest permission wins', () => {
    const screenAdmin: UserScreenAccess = {
      ...baseScreen,
      screenCode: 'PAYMENT_MODE',
      canView: true,
      canEdit: false,
      canDelete: false,
      haveFullAccess: false,
      haveNoAccess: false,
    };

    const screenSudo: UserScreenAccess = {
      ...baseScreen,
      screenCode: 'PAYMENT_MODE',
      canView: false,
      canEdit: false,
      canDelete: false,
      haveFullAccess: true,
      haveNoAccess: false,
    };

    const merged = mergeUserScreens([screenAdmin, screenSudo]);
    expect(merged).toHaveLength(1);
    expect(merged[0].haveFullAccess).toBe(true);
    expect(merged[0].canView).toBe(true);
    expect(merged[0].canEdit).toBe(true);
    expect(merged[0].canDelete).toBe(true);
    expect(merged[0].haveNoAccess).toBe(false);
  });

  it('should treat the screen as a menu if either says isMenu is true', () => {
    const screen1: UserScreenAccess = {
      ...baseScreen,
      isMenu: false,
    };
    const screen2: UserScreenAccess = {
      ...baseScreen,
      isMenu: 1,
    };

    const merged = mergeUserScreens([screen1, screen2]);
    expect(merged).toHaveLength(1);
    expect(merged[0].isMenu).toBe(true);
  });
});

describe('filterScreensByAllocatedRoles', () => {
  it('should return the original screens if roleAccess is missing or empty', () => {
    const screens = [{ ...baseScreen }];
    expect(filterScreensByAllocatedRoles(screens, undefined)).toEqual(screens);
    expect(filterScreensByAllocatedRoles(screens, {})).toEqual(screens);
  });

  it('should filter out screens whose role ID is not allocated to their department', () => {
    const screenPtSudo: UserScreenAccess = {
      ...baseScreen,
      departmentId: 1, // Property Tax
      userRoleId: 2,   // sudo
      screenCode: 'PT_SCREEN',
    };
    const screenPtAdmin: UserScreenAccess = {
      ...baseScreen,
      departmentId: 1, // Property Tax
      userRoleId: 1,   // Admin
      screenCode: 'PT_SCREEN',
    };
    const screenTlAdmin: UserScreenAccess = {
      ...baseScreen,
      departmentId: 2, // Trade License
      userRoleId: 1,   // Admin
      screenCode: 'TL_SCREEN',
    };

    const roleAccess = {
      '1': [2], // Property Tax has role sudo (2)
      '2': [1], // Trade License has role Admin (1)
    };

    const filtered = filterScreensByAllocatedRoles(
      [screenPtSudo, screenPtAdmin, screenTlAdmin],
      roleAccess
    );

    expect(filtered).toHaveLength(2);
    // PtSudo should be kept because roleId 2 is in dept 1's roleAccess [2]
    expect(filtered).toContainEqual(screenPtSudo);
    // TlAdmin should be kept because roleId 1 is in dept 2's roleAccess [1]
    expect(filtered).toContainEqual(screenTlAdmin);
    // PtAdmin should be filtered out because roleId 1 is NOT in dept 1's roleAccess [2]
    expect(filtered).not.toContainEqual(screenPtAdmin);
  });

  it('should filter out screens for departments not configured in roleAccess', () => {
    const screenPt: UserScreenAccess = {
      ...baseScreen,
      departmentId: 1,
      userRoleId: 2,
    };
    const screenUnknownDept: UserScreenAccess = {
      ...baseScreen,
      departmentId: 99,
      userRoleId: 1,
    };

    const roleAccess = {
      '1': [2],
    };

    const filtered = filterScreensByAllocatedRoles([screenPt, screenUnknownDept], roleAccess);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]).toEqual(screenPt);
  });

  it('should keep screens that do not have a valid departmentId', () => {
    const screenGlobal: UserScreenAccess = {
      ...baseScreen,
      departmentId: 0,
      userRoleId: 1,
    };

    const roleAccess = {
      '1': [2],
    };

    const filtered = filterScreensByAllocatedRoles([screenGlobal], roleAccess);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]).toEqual(screenGlobal);
  });
});


