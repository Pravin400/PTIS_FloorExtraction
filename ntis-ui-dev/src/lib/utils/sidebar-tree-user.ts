import type { UserScreenAccess } from '@/types/user-screen-access.types';
import type { MenuItem } from '@/types/menu.types';

/**
 * Converts UserScreenAccess[] to MenuItem[] for sidebar rendering.
 * @param screens - The user's accessible screens
 * @param inactiveGroupNames - Optional set of group names that are inactive (should be hidden)
 */
export function buildSidebarTreeFromUserScreens(
  screens: UserScreenAccess[],
  inactiveGroupNames?: Set<string>
): MenuItem[] {
  // Only include menu items the user can view and are marked as menu
  const menuScreens = screens.filter(
    (s) => (s.isMenu === true || s.isMenu === 1) && s.canView && !s.haveNoAccess
  );

  // Group by departmentId + screenGroupName to isolate groups per department
  const groupsMap = new Map<string, MenuItem>();
  const standalone: MenuItem[] = [];

  for (const screen of menuScreens) {
    const groupName = screen.screenGroupName?.trim();

    if (groupName) {
      // Skip screens whose group is inactive
      if (inactiveGroupNames?.has(groupName)) continue;

      const groupKey = `${screen.departmentId ?? 'global'}_${groupName}`;

      if (!groupsMap.has(groupKey)) {
        groupsMap.set(groupKey, {
          name: groupName,
          nameHi: groupName, // No local name for group, fallback
          iconName: screen.screenIcon || 'LayoutGrid',
          href: '#',
          departmentId: screen.departmentId,
          moduleId: screen.moduleId,
          departmentName: screen.departmentName,
          moduleName: screen.moduleName,
          subItems: [],
        });
      }
      groupsMap.get(groupKey)!.subItems!.push({
        name: screen.screenName,
        href: screen.routePath || '#',
        departmentId: screen.departmentId,
        moduleId: screen.moduleId,
        departmentName: screen.departmentName,
        moduleName: screen.moduleName,
        screenCode: screen.screenCode,
      });
    } else {
      standalone.push({
        name: screen.screenName,
        nameHi: screen.screenNameLocal || screen.screenName,
        iconName: screen.screenIcon || 'LayoutGrid',
        href: screen.routePath || '#',
        departmentId: screen.departmentId,
        moduleId: screen.moduleId,
        departmentName: screen.departmentName,
        moduleName: screen.moduleName,
        screenCode: screen.screenCode,
        subItems: [],
      });
    }
  }

  // Predefined group display order matching production layout
  const GROUP_SORT_ORDER: Record<string, number> = {
    PTIS: 1,
    Masters: 2,
    Dashboard: 3,
    Payments: 4,
    Report: 5,
    Reports: 5,
  };

  const sortedGroups = Array.from(groupsMap.values()).sort((a, b) => {
    const orderA = GROUP_SORT_ORDER[a.name] ?? 99;
    const orderB = GROUP_SORT_ORDER[b.name] ?? 99;
    return orderA - orderB;
  });

  // Combine standalone screens first, then sorted groups
  return [...standalone, ...sortedGroups];
}
