'use client';

import React, { createContext, useContext, useState, useTransition, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import type { PropertyListItem } from '@/types/ptis.types';
import { cn } from '@/lib/utils/cn';

interface PtisNavigationContextType {
  isPending: boolean;
  currentPage: number;
  totalPages: number;
  properties: PropertyListItem[];
  navigateToPage: (page: number) => void;
}

const PtisNavigationContext = createContext<PtisNavigationContextType | null>(null);

export function usePtisNavigation() {
  const context = useContext(PtisNavigationContext);
  if (!context) {
    throw new Error('usePtisNavigation must be used within a PtisNavigationProvider');
  }
  return context;
}

export function useOptionalPtisNavigation() {
  return useContext(PtisNavigationContext);
}

export function getTargetPropertyRoute(target: PropertyListItem, pathname: string): string {
  const segments = pathname.split('/');
  const locale = segments[1] || 'en';

  const rawPart = String(target.partitionNo ?? '').trim();
  const hasPartition = rawPart !== '' && rawPart !== '0' && rawPart !== '-';

  // Properties with a non-zero partition number are individual/flat/shop units
  if (hasPartition) {
    return `/${locale}/property-tax/ptis/individual`;
  }

  const catId = typeof target.category === 'number' ? target.category : undefined;
  const catLabel = String(target.categoryLabel || target.category || '').toLowerCase();

  const isExplicitIndividual = catId === 2 || catLabel.includes('individual');
  const isExplicitApartment =
    catId === 1 ||
    catId === 0 ||
    catLabel.includes('apartment') ||
    catLabel.includes('society') ||
    Boolean(target.societyDetailId) ||
    Boolean(target.societyId) ||
    Boolean(target.wings && target.wings.length > 0);

  if (isExplicitIndividual) {
    return `/${locale}/property-tax/ptis/individual`;
  }
  if (isExplicitApartment) {
    return `/${locale}/property-tax/ptis/apartment`;
  }

  // If category is not present in target metadata, keep current page route context to prevent jumping
  if (pathname.includes('/property-tax/ptis/apartment')) {
    return `/${locale}/property-tax/ptis/apartment`;
  }
  return `/${locale}/property-tax/ptis/individual`;
}

export function cleanParamsForTargetProperty(
  currentParams: { toString: () => string },
  target: PropertyListItem
): URLSearchParams {
  const newParams = new URLSearchParams(currentParams.toString());

  // Set target property identifiers
  newParams.set('propertyId', String(target.propertyId));
  newParams.set('propertyNo', target.propertyNo);
  const rawPart = target.partitionNo;
  newParams.set('partitionNo', rawPart && rawPart.trim() !== '' && rawPart !== '0' ? rawPart : '0');

  if (target.wardId) {
    newParams.set('wardId', String(target.wardId));
  }
  if (target.wardNo) {
    newParams.set('wardNo', String(target.wardNo));
  }

  // Remove previous property-specific query parameters that cause routing conflicts or infinite loops
  newParams.delete('category');
  newParams.delete('categoryLabel');
  newParams.delete('societyDetailId');
  newParams.delete('societydetailid');
  newParams.delete('societyId');
  newParams.delete('societyid');
  newParams.delete('societyMasterId');
  newParams.delete('societyMasterid');
  newParams.delete('wingDetailId');
  newParams.delete('wingdetailid');
  newParams.delete('wingId');
  newParams.delete('wingid');
  newParams.delete('wingName');
  newParams.delete('wingname');
  newParams.delete('type');
  newParams.delete('pageNumber');
  newParams.delete('valuationTab');
  newParams.delete('appartmentTab');
  newParams.delete('filterWing');
  newParams.delete('filterFlatOrShopNo');
  newParams.delete('filterApartmentType');
  newParams.delete('filterPropertyType');
  newParams.delete('searchTerm');

  // Apply new target property-specific parameters if explicitly provided on target
  if (target.category !== undefined && target.category !== null) {
    newParams.set('category', String(target.category));
  }
  if (target.categoryLabel) {
    newParams.set('categoryLabel', target.categoryLabel);
  }
  if (target.societyDetailId) {
    newParams.set('societyDetailId', String(target.societyDetailId));
  }
  if (target.wingDetailId) {
    newParams.set('wingDetailId', String(target.wingDetailId));
  }

  return newParams;
}

interface PtisNavigationProviderProps {
  children: React.ReactNode;
  properties: PropertyListItem[];
}

export function PtisNavigationProvider({ children, properties }: PtisNavigationProviderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [isPending, startTransition] = useTransition();
  // Get active index from URL searchParams (by propertyId or propertyNo)
  const rawPropId = searchParams.get('propertyId');
  const rawPropNo = searchParams.get('propertyNo');
  const rawPartNo = searchParams.get('partitionNo');

  const activePropertyId = rawPropId ? Number(rawPropId) : null;
  let activeIndex = -1;

  if (properties.length > 0) {
    if (activePropertyId) {
      activeIndex = properties.findIndex((p) => p.propertyId === activePropertyId);
    }
    if (activeIndex === -1 && rawPropNo) {
      activeIndex = properties.findIndex((p) => {
        const matchesNo = String(p.propertyNo).trim().toLowerCase() === String(rawPropNo).trim().toLowerCase();
        if (!matchesNo) return false;
        if (rawPartNo && rawPartNo !== '0' && rawPartNo !== '') {
          return String(p.partitionNo ?? '0').trim().toLowerCase() === String(rawPartNo).trim().toLowerCase();
        }
        return true;
      });
    }
    if (activeIndex === -1) {
      activeIndex = 0;
    }
  }

  const totalPages = properties.length;
  const initialPage = properties.length > 0 ? (activeIndex !== -1 ? activeIndex + 1 : 1) : 0;

  const [localPage, setLocalPage] = useState<number>(initialPage);
  const [prevInitialPage, setPrevInitialPage] = useState<number>(initialPage);

  if (initialPage !== prevInitialPage) {
    setPrevInitialPage(initialPage);
    setLocalPage(initialPage);
  }

  // Silently prefetch adjacent, first, and last property pages with the exact target route
  useEffect(() => {
    if (properties.length === 0 || localPage === 0) return;

    const prefetchUrl = (index: number) => {
      const p = properties[index];
      if (!p) return;
      const targetPath = getTargetPropertyRoute(p, pathname);
      const newParams = cleanParamsForTargetProperty(searchParams, p);
      router.prefetch(`${targetPath}?${newParams.toString()}`);
    };

    // Prefetch first property
    prefetchUrl(0);

    // Prefetch adjacent (previous and next) properties
    if (localPage > 1) {
      prefetchUrl(localPage - 2);
    }
    if (localPage < totalPages) {
      prefetchUrl(localPage);
    }

    // Prefetch last property
    if (totalPages > 1) {
      prefetchUrl(totalPages - 1);
    }
  }, [localPage, properties, totalPages, pathname, searchParams, router]);

  const navigateToPage = useCallback((page: number) => {
    if (isPending || page < 1 || page > totalPages) return;
    setLocalPage(page);

    const targetProperty = properties[page - 1];
    if (targetProperty) {
      const targetPath = getTargetPropertyRoute(targetProperty, pathname);
      const newParams = cleanParamsForTargetProperty(searchParams, targetProperty);

      startTransition(() => {
        router.replace(`${targetPath}?${newParams.toString()}`, { scroll: false });
      });
    }
  }, [isPending, totalPages, properties, pathname, searchParams, router]);

  const contextValue = useMemo(() => ({
    isPending,
    currentPage: localPage,
    totalPages,
    properties,
    navigateToPage,
  }), [isPending, localPage, totalPages, properties, navigateToPage]);

  return (
    <PtisNavigationContext.Provider value={contextValue}>
      {/* Fully transparent interaction blocker - completely blocks all clicks and sets wait cursor without any blur or tint */}
      {isPending && (
        <>
          <div
            id="ptis-property-nav-blocker"
            className="fixed inset-0 z-[99999] cursor-wait bg-transparent select-none pointer-events-auto"
            aria-label="Navigating property..."
          />
          {/* Subtle top progress bar */}
          <div className="fixed top-0 left-0 right-0 h-[2.5px] z-[100000] overflow-hidden bg-blue-100/30 pointer-events-none">
            <div className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 animate-[pulse_0.8s_ease-in-out_infinite]" />
          </div>
        </>
      )}
      <div className={cn("w-full", isPending && "pointer-events-none select-none")}>
        {children}
      </div>
    </PtisNavigationContext.Provider>
  );
}
