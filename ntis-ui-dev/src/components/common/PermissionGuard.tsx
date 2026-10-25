'use client';

import { usePermissions, ScreenPermissions } from '@/hooks/usePermissions';

interface PermissionGuardProps {
  screenCode: string;
  require: keyof Omit<ScreenPermissions, 'hasAccess'>;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGuard({
  screenCode,
  require,
  children,
  fallback = null,
}: PermissionGuardProps) {
  const permissions = usePermissions(screenCode);

  // If 'haveFullAccess' is true, they automatically have view/edit/delete/full rights
  const hasAccess = permissions[require] || permissions.haveFullAccess;

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
