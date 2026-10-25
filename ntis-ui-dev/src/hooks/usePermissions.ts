'use client';

import { useMemo } from 'react';
import { usePermissionsContext } from '@/lib/providers/PermissionsProvider';

export interface ScreenPermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  haveFullAccess: boolean;
  hasAccess: boolean; // Computed helper: true if any access is granted
}

const DEFAULT_NO_ACCESS: ScreenPermissions = {
  canView: false,
  canEdit: false,
  canDelete: false,
  haveFullAccess: false,
  hasAccess: false,
};

/**
 * Hook to retrieve the current user's permissions for a specific screen.
 *
 * @param screenCode - The unique identifier for the screen (e.g., 'BANK_MASTER')
 * @returns ScreenPermissions object containing boolean access flags
 */
export function usePermissions(screenCode: string): ScreenPermissions {
  const { screens } = usePermissionsContext();

  return useMemo(() => {
    if (!screens || screens.length === 0) {
      return DEFAULT_NO_ACCESS;
    }

    const screenAccess = screens.find((s) => {
      const query = screenCode.toUpperCase();
      return (
        s.screenCode?.toUpperCase() === query ||
        s.screenName?.toUpperCase() === query ||
        s.routePath?.toUpperCase().includes(query) ||
        s.routePath?.toUpperCase().includes(query.replace(/_/g, '-'))
      );
    });

    if (!screenAccess || screenAccess.haveNoAccess) {
      return DEFAULT_NO_ACCESS;
    }

    return {
      canView: Boolean(screenAccess.canView || screenAccess.haveFullAccess),
      canEdit: Boolean(screenAccess.canEdit || screenAccess.haveFullAccess),
      canDelete: Boolean(screenAccess.canDelete || screenAccess.haveFullAccess),
      haveFullAccess: Boolean(screenAccess.haveFullAccess),
      hasAccess: true,
    };
  }, [screens, screenCode]);
}
