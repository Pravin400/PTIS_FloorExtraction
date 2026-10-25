'use client';

import { createContext, useContext, ReactNode } from 'react';
import type { UserScreenAccess } from '@/types/user-screen-access.types';

interface PermissionsContextValue {
  screens: UserScreenAccess[];
}

const PermissionsContext = createContext<PermissionsContextValue | undefined>(undefined);

interface PermissionsProviderProps {
  children: ReactNode;
  screens: UserScreenAccess[];
}

export function PermissionsProvider({ children, screens }: PermissionsProviderProps) {
  return <PermissionsContext.Provider value={{ screens }}>{children}</PermissionsContext.Provider>;
}

export function usePermissionsContext() {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissionsContext must be used within a PermissionsProvider');
  }
  return context;
}
