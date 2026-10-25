import type { ModuleMasterData } from '@/types/screen-access.types';
import type { UserScreenAccess } from '@/types/user-screen-access.types';
import { parseBoolean } from '@/lib/utils/type-guards';

export function getModuleMasterId(module: ModuleMasterData): number {
  return Number(module.moduleMasterId ?? module.moduleId ?? 0);
}

export function buildActiveModuleIdSet(modules: ModuleMasterData[]): Set<number> {
  const activeIds = new Set<number>();

  modules.forEach((module) => {
    const id = getModuleMasterId(module);
    if (id <= 0) return;

    const isActive =
      module.isActive === undefined || module.isActive === null
        ? true
        : parseBoolean(module.isActive);

    if (isActive) {
      activeIds.add(id);
    }
  });

  return activeIds;
}

/**
 * Applies ULB-level module activation to runtime screen access.
 * Role permissions are preserved in the database; inactive modules only
 * suspend effective access until the module is activated again.
 */
export function applyModuleActivationGate(
  screens: UserScreenAccess[],
  activeModuleIds: Set<number>
): UserScreenAccess[] {
  return screens.map((screen) => {
    const moduleId = Number(screen.moduleId ?? 0);
    if (moduleId <= 0 || activeModuleIds.has(moduleId)) {
      return screen;
    }

    return {
      ...screen,
      canView: false,
      canEdit: false,
      canDelete: false,
      haveFullAccess: false,
      haveNoAccess: true,
    };
  });
}

export function isModuleActive(
  moduleId: string | number | undefined,
  activeModuleIds: Set<number>
): boolean {
  const id = Number(moduleId ?? 0);
  if (id <= 0) return true;
  return activeModuleIds.has(id);
}

/**
 * Merges screen access permissions for users with multiple roles.
 * Access is combined using OR logic (highest access level wins).
 */
export function mergeUserScreens(screens: UserScreenAccess[]): UserScreenAccess[] {
  const mergedMap = new Map<string, UserScreenAccess>();

  screens.forEach((screen) => {
    // Unique key to identify the screen (screenCode first, then routePath, then screenName)
    const key = (screen.screenCode || screen.routePath || screen.screenName || '')
      .trim()
      .toUpperCase();
    if (!key) return;

    const existing = mergedMap.get(key);
    if (!existing) {
      // Shallow copy to avoid mutating the original screen objects
      mergedMap.set(key, { ...screen });
    } else {
      // Merge access levels using boolean OR (highest access level wins)
      existing.canView = existing.canView || screen.canView;
      existing.canEdit = existing.canEdit || screen.canEdit;
      existing.canDelete = existing.canDelete || screen.canDelete;
      existing.haveFullAccess = existing.haveFullAccess || screen.haveFullAccess;

      // If full access is granted in any role, all sub-permissions should be true
      if (existing.haveFullAccess) {
        existing.canView = true;
        existing.canEdit = true;
        existing.canDelete = true;
      }

      // haveNoAccess should only be true if ALL roles deny access
      existing.haveNoAccess = existing.haveNoAccess && screen.haveNoAccess;

      // If we now have some access, ensure haveNoAccess is false
      if (existing.canView || existing.canEdit || existing.canDelete || existing.haveFullAccess) {
        existing.haveNoAccess = false;
      }

      // Keep screen as menu if it is a menu in any of the roles
      const isMenuExisting = existing.isMenu === true || existing.isMenu === 1;
      const isMenuCurrent = screen.isMenu === true || screen.isMenu === 1;
      existing.isMenu = isMenuExisting || isMenuCurrent;
    }
  });

  return Array.from(mergedMap.values());
}

/**
 * Filters screens list by user's department-role allocations.
 * Ensures that if a user has different roles assigned to different departments,
 * only the allocated role's permissions apply to screens under each department.
 */
export function filterScreensByAllocatedRoles(
  screens: UserScreenAccess[],
  roleAccess?: Record<string, number[]>
): UserScreenAccess[] {
  if (!roleAccess || Object.keys(roleAccess).length === 0) {
    return screens;
  }

  return screens.filter((screen) => {
    // If the screen has no valid departmentId, we keep it.
    if (!screen.departmentId || screen.departmentId <= 0) {
      return true;
    }

    const deptId = String(screen.departmentId);
    const allocatedRoles = roleAccess[deptId];

    // If no roles are allocated to this department, we filter it out.
    if (!allocatedRoles) {
      return false;
    }

    return allocatedRoles.includes(screen.userRoleId);
  });
}


