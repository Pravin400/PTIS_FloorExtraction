import { useState, useMemo, useCallback } from 'react';
import { AccessLevel, ScreenAccessPermissionData } from '@/types/screen-access.types';

export function usePermissionDeltas(initialRoleAccess: ScreenAccessPermissionData[]) {
  const mapPermissions = useMemo(() => {
    const access: Record<string, AccessLevel> = {};
    const ids: Record<string, number | undefined> = {};
    initialRoleAccess.forEach((p) => {
      access[String(p.screenId)] = p.accessLevel;
      ids[String(p.screenId)] = p.id;
    });
    return { access, ids };
  }, [initialRoleAccess]);

  const [deltas, setDeltas] = useState<Record<string, AccessLevel>>({});

  const roleAccess = useMemo(() => {
    if (Object.keys(deltas).length === 0) return mapPermissions.access;
    return { ...mapPermissions.access, ...deltas };
  }, [mapPermissions.access, deltas]);

  const pendingCount = Object.keys(deltas).length;

  const updateAccess = useCallback(
    (screenId: string, level: AccessLevel) => {
      const original = mapPermissions.access[screenId] || 'no-access';
      setDeltas((prev) => {
        const next = { ...prev };
        if (level === original) {
          delete next[screenId];
        } else {
          next[screenId] = level;
        }
        return next;
      });
    },
    [mapPermissions.access]
  );

  const resetDeltas = useCallback(() => setDeltas({}), []);

  return {
    mapPermissions,
    deltas,
    roleAccess,
    pendingCount,
    updateAccess,
    resetDeltas,
  };
}
