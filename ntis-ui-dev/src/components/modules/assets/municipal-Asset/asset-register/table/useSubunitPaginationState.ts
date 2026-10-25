'use client';

import { useState } from 'react';

export function useSubunitPaginationState() {
  const [subunitSearchMap, setSubunitSearchMap] = useState<Record<number, string>>({});
  const [subunitPageSizeMap, setSubunitPageSizeMap] = useState<Record<number, number>>({});
  const [subunitPageMap, setSubunitPageMap] = useState<Record<number, number>>({});

  const handleSubunitSearchChange = (parentId: number, searchVal: string) => {
    setSubunitSearchMap((prev) => ({ ...prev, [parentId]: searchVal }));
    setSubunitPageMap((prev) => ({ ...prev, [parentId]: 1 }));
  };

  const handleSubunitPageSizeChange = (parentId: number, size: number) => {
    setSubunitPageSizeMap((prev) => ({ ...prev, [parentId]: size }));
    setSubunitPageMap((prev) => ({ ...prev, [parentId]: 1 }));
  };

  const handleSubunitPageChange = (parentId: number, page: number) => {
    setSubunitPageMap((prev) => ({ ...prev, [parentId]: page }));
  };

  return {
    subunitSearchMap,
    subunitPageSizeMap,
    subunitPageMap,
    handleSubunitSearchChange,
    handleSubunitPageSizeChange,
    handleSubunitPageChange,
  };
}
