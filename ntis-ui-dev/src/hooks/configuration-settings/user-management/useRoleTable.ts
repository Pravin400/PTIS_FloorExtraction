'use client';

import { useState, useMemo, useEffect } from 'react';
import { Role } from '@/types/user-management';

export function useRoleTable(initialRoles: Role[]) {
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRoles(initialRoles);
  }, [initialRoles]);

  const filteredRoles = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return roles.filter((r) => (r.name || '').toLowerCase().includes(term));
  }, [roles, searchTerm]);

  return {
    roles,
    setRoles,
    searchTerm,
    setSearchTerm,
    pageNumber,
    setPageNumber,
    pageSize,
    setPageSize,
    filteredRoles,
  };
}
