'use client';

import { useCallback } from 'react';
import { useRouter, usePathname, useSearchParams, useParams } from 'next/navigation';

export const useFloorUrlSync = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams();

  const locale = params.locale as string;
  const propertyId = params.propertyId as string;

  const updateUrlParams = useCallback(
    (params: Record<string, string | null>) => {
      const current = new URLSearchParams(Array.from(searchParams.entries()));
      Object.entries(params).forEach(([key, value]) => {
        if (value === null || value === 'undefined' || value === 'null') {
          current.delete(key);
        } else {
          current.set(key, value);
        }
      });
      
      const search = current.toString();
      const query = search ? `?${search}` : '';
      
      // Optimization: Only replace if parameters have actually changed
      if (search === searchParams.toString()) return;
      
      router.replace(`${pathname}${query}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  return {
    searchParams,
    updateUrlParams,
    pathname,
    router,
    locale,
    propertyId,
  };
};
