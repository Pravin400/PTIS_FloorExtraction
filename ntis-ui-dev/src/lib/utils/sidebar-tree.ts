import { ScreenGroupMaster, ScreenMaster } from '@/types/sidebar-navigation.types';
import { MenuItem, SubMenuItem } from '@/types/menu.types';

export function buildSidebarTree(
  groups: ScreenGroupMaster[],
  screens: ScreenMaster[]
): MenuItem[] {
  // 1. Filter active groups and screens
  const activeGroups = groups.filter((g) => g.isActive);
  const activeScreens = screens.filter((s) => s.isActive && s.isMenu);

  const groupIds = new Set(activeGroups.map((g) => g.id));
  
  // Array to hold all top-level items (groups + standalone screens) before sorting
  const mixedItems: (MenuItem & { _order: number })[] = [];

  // 2. Add standalone screens (no group, or group doesn't exist)
  const standaloneScreens = activeScreens.filter(
    (s) => !s.screenGroupId || !groupIds.has(s.screenGroupId)
  );

  for (const screen of standaloneScreens) {
    mixedItems.push({
      name: screen.screenName,
      nameHi: screen.screenNameLocal || screen.screenName,
      iconName: screen.screenIcon || 'LayoutGrid',
      href: screen.routePath || '#',
      subItems: [],
      _order: screen.displayOrder,
    });
  }

  // 3. Add groups and their child screens
  for (const group of activeGroups) {
    const groupScreens = activeScreens
      .filter((s) => s.screenGroupId === group.id)
      .sort((a, b) => a.displayOrder - b.displayOrder);

    // Only include groups that have at least one active sub-screen
    if (groupScreens.length > 0) {
      const subItems: SubMenuItem[] = groupScreens.map((screen) => ({
        name: screen.screenName,
        href: screen.routePath || '#',
      }));

      mixedItems.push({
        name: group.screenGroupName,
        nameHi: group.screenGroupLocalName || group.screenGroupName,
        iconName: group.screenGroupIcon || 'LayoutGrid',
        href: '#', // Groups act as headers/accordions
        subItems: subItems,
        _order: group.displayOrder,
      });
    }
  }

  // 4. Sort the top-level items by displayOrder
  mixedItems.sort((a, b) => a._order - b._order);

  return mixedItems.map(({ _order, ...item }) => item);
}
