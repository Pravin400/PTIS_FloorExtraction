import { cookies } from 'next/headers';
import { getUserIdFromCookies } from '@/lib/utils/auth-session';
import { userScreenAccessService } from '@/lib/api/user-screen-access.service';
import { getUserById } from '@/lib/api/configuration-settings/user-management/user.services';
import { filterScreensByAllocatedRoles, mergeUserScreens } from '@/lib/utils/module-access-guard';
import { cleanPath } from '@/lib/utils/permission-helper';

export async function verifyServerActionAccess(
  screenCode: string,
  requiredAccess: 'view' | 'edit' | 'delete'
): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth_token')?.value;
    const userId = getUserIdFromCookies(cookieStore);
    if (!authToken || userId == null) return false;

    const screensRes = await userScreenAccessService.getScreensForUser(userId, authToken);
    if (!screensRes.success || !screensRes.data) return false;

    let screens = screensRes.data;

    // Apply department-role filtering if user profile allocations exist
    const userProfileRes = await getUserById(String(userId));
    if (userProfileRes && userProfileRes.roleAccess) {
      screens = filterScreensByAllocatedRoles(screens, userProfileRes.roleAccess);
    }

    const merged = mergeUserScreens(screens);
    const target = merged.find((s) => s.screenCode?.toUpperCase() === screenCode.toUpperCase());
    if (!target) return false;

    if (target.haveFullAccess) return true;
    if (requiredAccess === 'view') return target.canView;
    if (requiredAccess === 'edit') return target.canEdit;
    if (requiredAccess === 'delete') return target.canDelete;

    return false;
  } catch {
    return false;
  }
}

import type { UserScreenAccess } from '@/types/user-screen-access.types';

export async function verifyServerRouteAccess(
  pathname: string,
  requiredAccess: 'view' | 'edit' | 'delete' = 'view'
): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth_token')?.value;
    const userId = getUserIdFromCookies(cookieStore);
    if (!authToken || userId == null) return false;

    const screensRes = await userScreenAccessService.getScreensForUser(userId, authToken);
    if (!screensRes.success || !screensRes.data) return false;

    let screens = screensRes.data;

    // Apply department-role filtering if user profile allocations exist
    const userProfileRes = await getUserById(String(userId));
    if (userProfileRes && userProfileRes.roleAccess) {
      screens = filterScreensByAllocatedRoles(screens, userProfileRes.roleAccess);
    }

    const merged = mergeUserScreens(screens);

    // Normalize path by splitting segments
    const segments = pathname.split('/').filter(Boolean);
    const hasLocale = segments.length > 0 && segments[0].length === 2; // e.g. 'en', 'mr', 'hi'
    const cleanSegments = hasLocale ? segments.slice(1) : segments;

    if (cleanSegments.length === 0) {
      return true; // Root or home route
    }

    const pathWithoutLocale = '/' + cleanSegments.join('/');

    // 1. Try exact or prefix match on routePath (pick the most specific/longest routePath)
    const matchingScreens = merged.filter((s) => {
      if (!s.routePath) return false;
      const normalizedRoute = cleanPath(s.routePath);
      const normalizedVisited = cleanPath(pathWithoutLocale);

      if (
        normalizedVisited === normalizedRoute ||
        normalizedVisited.startsWith(normalizedRoute + '/')
      ) {
        return true;
      }
      const firstSegment = cleanSegments[0].toLowerCase();
      if (!normalizedRoute.startsWith(firstSegment) && cleanSegments.length > 1) {
        const subPath = cleanSegments.slice(1).join('/').toLowerCase();
        const normalizedSubPath = cleanPath(subPath);
        if (
          normalizedSubPath === normalizedRoute ||
          normalizedSubPath.startsWith(normalizedRoute + '/')
        ) {
          return true;
        }
      }

      return false;
    });

    if (matchingScreens.length > 0) {
      // Sort by length descending to get the most specific match first
      matchingScreens.sort((a, b) => (b.routePath?.length || 0) - (a.routePath?.length || 0));
      const target = matchingScreens[0];
      return checkAccess(target, requiredAccess);
    }

    // 2. Second try: Match screen by screenCode comparison after removing all dashes and underscores
    const targetByCode = merged.find((s) => {
      if (!s.screenCode) return false;
      const codeClean = s.screenCode.replace(/[_-]/g, '').toUpperCase();
      return cleanSegments.some((seg) => {
        const segClean = seg.replace(/[_-]/g, '').toUpperCase();
        return segClean === codeClean;
      });
    });

    if (targetByCode) {
      return checkAccess(targetByCode, requiredAccess);
    }

    if (pathWithoutLocale.startsWith('/configuration-settings')) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function checkAccess(
  target: UserScreenAccess,
  requiredAccess: 'view' | 'edit' | 'delete'
): boolean {
  if (target.haveFullAccess) return true;
  if (requiredAccess === 'view') return target.canView;
  if (requiredAccess === 'edit') return target.canEdit;
  if (requiredAccess === 'delete') return target.canDelete;
  return false;
}
