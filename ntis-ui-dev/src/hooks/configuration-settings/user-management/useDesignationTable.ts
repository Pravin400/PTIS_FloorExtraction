'use client';

import { useState, useMemo, useEffect } from 'react';
import { Designation } from '@/types/user-management';

export function useDesignationTable(initialDesignations: Designation[]) {
  const [designations, setDesignations] = useState<Designation[]>(initialDesignations);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDesignations(initialDesignations);
  }, [initialDesignations]);

  const filteredDesignations = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return designations.filter(
      (d) =>
        (d.name || '').toLowerCase().includes(term) ||
        (d.code || '').toLowerCase().includes(term) ||
        (d.description || '').toLowerCase().includes(term)
    );
  }, [designations, searchTerm]);

  return {
    designations,
    setDesignations,
    searchTerm,
    setSearchTerm,
    pageNumber,
    setPageNumber,
    pageSize,
    setPageSize,
    filteredDesignations,
  };
}
