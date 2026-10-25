import type { MenuItem } from '@/types/menu.types';
import type { UserScreenAccess } from '@/types/user-screen-access.types';
import { locales } from '@/i18n/config';
import { getDepartmentContextFromCookies, type DepartmentContext } from '@/lib/utils/cookie';

export interface ResolvedDepartmentContext {
  departmentId: number | null;
  departmentName: string | undefined;
  moduleId: number | null;
  moduleName: string | undefined;
  departmentIcon: string;
  isConfigurationSettings: boolean;
}

/**
 * Maps department name to the appropriate Lucide icon name.
 */
export function getDepartmentIconName(departmentName?: string | null): string {
  if (!departmentName) return 'FileText';
  const lowerName = departmentName.toLowerCase().trim();

  if (lowerName.includes('water')) return 'Droplet';
  if (lowerName.includes('property')) return 'FileText';
  if (lowerName.includes('asset')) return 'Landmark';
  if (lowerName.includes('trade') || lowerName.includes('license') || lowerName.includes('bajar')) return 'ShoppingCart';
  if (lowerName.includes('birth') || lowerName.includes('death')) return 'FileText';
  if (lowerName.includes('garbage') || lowerName.includes('trash') || lowerName.includes('waste')) return 'Trash2';
  if (lowerName.includes('building') || lowerName.includes('permission')) return 'Building2';
  if (lowerName.includes('grievance') || lowerName.includes('complain')) return 'Megaphone';
  if (lowerName.includes('rts')) return 'Timer';
  if (lowerName.includes('fire') || lowerName.includes('noc')) return 'Flame';
  if (lowerName.includes('configuration') || lowerName.includes('setting')) return 'Settings';

  return 'LayoutGrid';
}

/**
 * Strips the locale segment (/en, /mr, /hi) from a given pathname.
 */
export function stripLocaleFromPath(pathname: string): string {
  if (!pathname) return '/';
  const localePattern = new RegExp(`^/(${locales.join('|')})(/|$)`);
  const stripped = pathname.replace(localePattern, '/');
  return stripped.startsWith('/') ? stripped : `/${stripped}`;
}

export const CONFIGURATION_SETTINGS_PATH_PREFIX = '/configuration-settings';

/**
 * Checks whether a given path belongs to Configuration Settings / System Admin scope.
 */
export function isConfigurationSettingsPath(pathname?: string | null): boolean {
  if (!pathname || pathname === '#') return false;
  const clean = stripLocaleFromPath(pathname);
  return clean === CONFIGURATION_SETTINGS_PATH_PREFIX || clean.startsWith(`${CONFIGURATION_SETTINGS_PATH_PREFIX}/`);
}

/**
 * Helper to determine whether an item or sub-item belongs to Configuration Settings.
 */
export function isConfigurationSettingsItem(item: {
  href?: string;
  name?: string;
  departmentName?: string;
}): boolean {
  if (item.href && isConfigurationSettingsPath(item.href)) return true;
  if (item.name && /configuration\s*setting/i.test(item.name)) return true;
  if (item.departmentName && /configuration\s*setting/i.test(item.departmentName)) return true;
  return false;
}

export interface ResolveDepartmentContextOptions {
  pathname: string;
  searchParams?: URLSearchParams | null;
  menuItems?: MenuItem[];
  screens?: UserScreenAccess[];
  cookieContext?: DepartmentContext;
}

/**
 * Resolves active department context using a 4-tier fallback:
 * 1. Active route match against screens or menuItems (most accurate)
 * 2. Dynamic route segment matching (zero hardcoding, e.g. /water-bill, /assets)
 * 3. URL searchParams ?deptId= (explicit tab parameter)
 * 4. Ambient cookie (department_id set at navigation - fallback ONLY when route does not specify any department)
 */
export function resolveDepartmentContext({
  pathname,
  searchParams,
  menuItems = [],
  screens = [],
  cookieContext,
}: ResolveDepartmentContextOptions): ResolvedDepartmentContext {
  const cleanPath = stripLocaleFromPath(pathname);
  const isConfigurationSettings = isConfigurationSettingsPath(cleanPath);

  if (isConfigurationSettings) {
    const configScreen = screens.find(
      (s) => s.departmentName && /configuration\s*setting/i.test(s.departmentName)
    );
    const configMenuItem = menuItems.find(
      (m) =>
        (m.departmentName && /configuration\s*setting/i.test(m.departmentName)) ||
        m.subItems?.some((sub) => sub.departmentName && /configuration\s*setting/i.test(sub.departmentName))
    );
    const configDeptId = configScreen?.departmentId ?? configMenuItem?.departmentId ?? null;
    const configDeptName =
      configScreen?.departmentName ?? configMenuItem?.departmentName ?? 'Configuration Settings';

    return {
      departmentId: configDeptId,
      departmentName: configDeptName,
      moduleId: null,
      moduleName: undefined,
      departmentIcon: 'Settings',
      isConfigurationSettings: true,
    };
  }

  let resolvedDeptId: number | null = null;
  let resolvedDeptName: string | undefined = undefined;
  let resolvedModId: number | null = null;
  let resolvedModName: string | undefined = undefined;

  // Flatten all items from menuItems for easy matching
  const flatMenuItems: {
    href: string;
    departmentId?: number;
    departmentName?: string;
    moduleId?: number;
    moduleName?: string;
  }[] = [];

  menuItems.forEach((item) => {
    if (item.href && item.href !== '#') {
      flatMenuItems.push({
        href: stripLocaleFromPath(item.href),
        departmentId: item.departmentId,
        departmentName: item.departmentName,
        moduleId: item.moduleId,
        moduleName: item.moduleName,
      });
    }
    if (item.subItems) {
      item.subItems.forEach((sub) => {
        if (sub.href && sub.href !== '#') {
          flatMenuItems.push({
            href: stripLocaleFromPath(sub.href),
            departmentId: sub.departmentId,
            departmentName: sub.departmentName,
            moduleId: sub.moduleId,
            moduleName: sub.moduleName,
          });
        }
      });
    }
  });

  // -------------------------------------------------------------------------
  // Tier 1: Match current path against menuItems or screens
  // Handles exact matches, child sub-paths, and root/parent department paths
  // -------------------------------------------------------------------------
  let bestMatchLength = 0;

  // Check flatMenuItems
  for (const item of flatMenuItems) {
    if (!item.href || item.href === '/') continue;
    const isExact = cleanPath === item.href;
    const isPrefix = cleanPath.startsWith(`${item.href}/`);
    const isParent = cleanPath !== '/' && (item.href.startsWith(`${cleanPath}/`) || item.href === cleanPath);
    if (isExact || isPrefix || isParent) {
      if (item.href.length > bestMatchLength) {
        bestMatchLength = item.href.length;
        if (item.departmentId != null) {
          resolvedDeptId = item.departmentId;
          resolvedDeptName = item.departmentName;
          resolvedModId = item.moduleId ?? null;
          resolvedModName = item.moduleName;
        }
      }
    }
  }

  // Check screens (if provided and longer match found)
  for (const scr of screens) {
    if (!scr.routePath || scr.routePath === '#') continue;
    const scrPath = stripLocaleFromPath(scr.routePath);
    if (!scrPath || scrPath === '/') continue;

    const isExact = cleanPath === scrPath;
    const isPrefix = cleanPath.startsWith(`${scrPath}/`);
    const isParent = cleanPath !== '/' && (scrPath.startsWith(`${cleanPath}/`) || scrPath === cleanPath);
    if (isExact || isPrefix || isParent) {
      if (scrPath.length > bestMatchLength) {
        bestMatchLength = scrPath.length;
        if (scr.departmentId != null) {
          resolvedDeptId = scr.departmentId;
          resolvedDeptName = scr.departmentName;
          resolvedModId = scr.moduleId ?? null;
          resolvedModName = scr.moduleName;
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // Tier 2: Dynamic Route Segment Matching (Zero Hardcoding)
  // Dynamically infers department identity from registered menu items or screens
  // that share any URL path segment, supporting infinite arbitrary departments.
  // Runs BEFORE ambient cookies so that route navigation is never overridden
  // by a stale cookie from a previously visited department.
  // -------------------------------------------------------------------------
  if (resolvedDeptId == null) {
    const segments = cleanPath.split('/').filter(Boolean);

    const matchesRouteSegment = (targetPath?: string, seg?: string): boolean => {
      if (!targetPath || !seg || targetPath === '#' || targetPath === '/') return false;
      const stripped = stripLocaleFromPath(targetPath);
      const targetSegments = stripped.split('/').filter(Boolean);
      return targetSegments.includes(seg);
    };

    for (const segment of segments) {
      const matched = flatMenuItems.find(
        (i) => i.departmentId != null && matchesRouteSegment(i.href, segment)
      ) || screens.find(
        (s) => s.departmentId != null && matchesRouteSegment(s.routePath, segment)
      );

      if (matched?.departmentId != null) {
        resolvedDeptId = matched.departmentId;
        resolvedDeptName = matched.departmentName;
        resolvedModId = matched.moduleId ?? null;
        resolvedModName = matched.moduleName;
        break;
      }
    }
  }

  // -------------------------------------------------------------------------
  // Tier 3: Check URL searchParams (?deptId=...)
  // -------------------------------------------------------------------------
  if (resolvedDeptId == null && searchParams) {
    const rawDeptId = searchParams.get('deptId');
    if (rawDeptId) {
      const parsedId = parseInt(rawDeptId, 10);
      if (Number.isFinite(parsedId) && parsedId > 0) {
        resolvedDeptId = parsedId;
        const rawModId = searchParams.get('modId');
        if (rawModId) {
          const parsedMod = parseInt(rawModId, 10);
          if (Number.isFinite(parsedMod) && parsedMod > 0) {
            resolvedModId = parsedMod;
          }
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // Tier 4: Check Ambient Cookies
  // Fallback ONLY when the URL path gives no indication of any department
  // -------------------------------------------------------------------------
  if (resolvedDeptId == null) {
    const cookie = cookieContext || (typeof window !== 'undefined' ? getDepartmentContextFromCookies() : undefined);
    if (cookie?.departmentId) {
      resolvedDeptId = cookie.departmentId;
      resolvedDeptName = resolvedDeptName || cookie.departmentName;
      resolvedModId = resolvedModId ?? cookie.moduleId;
      resolvedModName = resolvedModName || cookie.moduleName;
    }
  }

  // If departmentId was found from Tier 2, 3 or 4 but departmentName is missing, look it up from items/screens
  if (resolvedDeptId != null && !resolvedDeptName) {
    const matching = flatMenuItems.find((i) => Number(i.departmentId) === Number(resolvedDeptId) && i.departmentName)
      || screens.find((s) => Number(s.departmentId) === Number(resolvedDeptId) && s.departmentName);
    if (matching?.departmentName) {
      resolvedDeptName = matching.departmentName;
    }
  }

  const safeDecode = (str?: string): string | undefined => {
    if (!str) return undefined;
    if (!str.includes('%')) return str;
    try {
      return decodeURIComponent(str);
    } catch {
      return str;
    }
  };

  const safeDeptName = safeDecode(resolvedDeptName);
  const safeModName = safeDecode(resolvedModName);

  return {
    departmentId: resolvedDeptId,
    departmentName: safeDeptName,
    moduleId: resolvedModId,
    moduleName: safeModName,
    departmentIcon: getDepartmentIconName(safeDeptName),
    isConfigurationSettings: false,
  };
}
