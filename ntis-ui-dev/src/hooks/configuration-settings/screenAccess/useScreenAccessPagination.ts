'use client';

import { useCallback } from 'react';
import { useQueryTransition } from '@/hooks/useQueryTransition';

interface UseScreenAccessPaginationProps {
  pageParamKey?: string;
  pageSizeParamKey?: string;
}

export function useScreenAccessPagination({
  pageParamKey = 'page',
  pageSizeParamKey = 'pageSize',
}: UseScreenAccessPaginationProps = {}) {
  const { isPending, updateQueries } = useQueryTransition();

  const handlePageChange = useCallback(
    (page: number) => {
      updateQueries({ [pageParamKey]: page > 1 ? page : null });
    },
    [updateQueries, pageParamKey]
  );

  const handlePageSizeChange = useCallback(
    (pageSize: number) => {
      updateQueries({ [pageSizeParamKey]: pageSize }, { resetPage: true, pageParamKey });
    },
    [updateQueries, pageSizeParamKey, pageParamKey]
  );

  return {
    isPending,
    handlePageChange,
    handlePageSizeChange,
  };
}
