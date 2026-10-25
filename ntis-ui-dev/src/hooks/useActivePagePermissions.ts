'use client';

import { useMemo } from 'react';
import { usePermissionsContext } from '@/lib/providers/PermissionsProvider';
import type { ScreenPermissions } from './usePermissions';
import { cleanPath } from '@/lib/utils/permission-helper';

const DEFAULT_NO_ACCESS: ScreenPermissions = {
  canView: false,
  canEdit: false,
  canDelete: false,
  haveFullAccess: false,
  hasAccess: false,
};

/**
 * Centralized hook that automatically resolves the current page's permissions
 * from the URL pathname — no screenCode needed.
 *
 * This mirrors the same tab/section normalization used in ActionButton.tsx and
 * server-access-guard.ts, so sibling tabs (e.g. /floor and /subfloor under
 * /floormaster) share the same permission record.
 *
 * Usage:
 *   const { canEdit, canDelete, haveFullAccess } = useActivePagePermissions();
 */
export function useActivePagePermissions(): ScreenPermissions {
  const { screens } = usePermissionsContext();
  let pathname = '';
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nextNav = require('next/navigation');
    if (nextNav && typeof nextNav.usePathname === 'function') {
      pathname = nextNav.usePathname();
    }
  } catch {}

  return useMemo(() => {
    if (!screens || screens.length === 0 || !pathname) return DEFAULT_NO_ACCESS;

    const segments = pathname.split('/').filter(Boolean);
    const hasLocale = segments.length > 0 && segments[0].length === 2;
    const cleanSegments = hasLocale ? segments.slice(1) : segments;
    const pathWithoutLocale = cleanSegments.join('/');

    const normalizedVisited = cleanPath(pathWithoutLocale);

    // 1. Try routePath prefix match (longest match wins)
    const matchingScreens = screens.filter((s) => {
      if (!s.routePath) return false;
      const normalizedRoute = cleanPath(s.routePath);
      return (
        normalizedVisited === normalizedRoute || normalizedVisited.startsWith(normalizedRoute + '/')
      );
    });

    let screenAccess = null;
    if (matchingScreens.length > 0) {
      matchingScreens.sort((a, b) => (b.routePath?.length || 0) - (a.routePath?.length || 0));
      screenAccess = matchingScreens[0];
    } else {
      // 2. Fallback: match by screenCode derived from URL segment
      screenAccess =
        screens.find((s) => {
          if (!s.screenCode) return false;
          const codeClean = s.screenCode.replace(/[_-]/g, '').toUpperCase();
          return cleanSegments.some((seg) => {
            const segClean = seg.replace(/[_-]/g, '').toUpperCase();
            return segClean === codeClean;
          });
        }) ?? null;
    }

    if (!screenAccess || screenAccess.haveNoAccess) return DEFAULT_NO_ACCESS;

    return {
      canView: Boolean(screenAccess.canView || screenAccess.haveFullAccess),
      canEdit: Boolean(screenAccess.canEdit || screenAccess.haveFullAccess),
      canDelete: Boolean(screenAccess.canDelete || screenAccess.haveFullAccess),
      haveFullAccess: Boolean(screenAccess.haveFullAccess),
      hasAccess: true,
    };
  }, [screens, pathname]);
}
