'use client';

import type { ReactNode } from 'react';
import { useIsAuthPage } from '@/hooks/useIsAuthPage';

interface ConditionalShellProps {
  children: ReactNode;
  shell: ReactNode;
  initialIsAuthOrHome?: boolean;
}

/**
 * Conditionally renders either the raw children (for home/login)
 * or wraps them in the main application shell (for module pages).
 */
export function ConditionalShell({ 
  children, 
  shell, 
  initialIsAuthOrHome = false 
}: ConditionalShellProps) {
  const isAuthOrHome = useIsAuthPage(initialIsAuthOrHome);

  if (isAuthOrHome) {
    return <>{children}</>;
  }

  return <>{shell}</>;
}
