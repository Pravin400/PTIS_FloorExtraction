import { useState, useCallback, useTransition, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { propertySearchSchema } from '@/lib/validations/ptis.schema';

export function usePropertySearch() {
  const t = useTranslations('ptis');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isSearchingProperty, setIsSearchingProperty] = useState(false);

  // Turn off searching state when the Next.js page transition is complete
  useEffect(() => {
    if (!isPending) {
      const timer = setTimeout(() => {
        setIsSearchingProperty(false);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams, isPending]);

  // Safety timeout: ensure isSearchingProperty cannot get stuck permanently
  useEffect(() => {
    if (isSearchingProperty) {
      const safetyTimer = setTimeout(() => {
        setIsSearchingProperty(false);
      }, 4000);
      return () => clearTimeout(safetyTimer);
    }
  }, [isSearchingProperty]);

  // Sync isSearching across multiple hook instances via window event
  useEffect(() => {
    const handleSync = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && typeof detail.isSearching === 'boolean') {
        setIsSearchingProperty(detail.isSearching);
      }
    };
    window.addEventListener('ptis:searching-property', handleSync);
    return () => window.removeEventListener('ptis:searching-property', handleSync);
  }, []);


  const updateUrl = useCallback(
    (params: Record<string, string | null>, customPath?: string): boolean | 'no-op' => {
      try {
        const newParams = new URLSearchParams(searchParams.toString());

        Object.entries(params).forEach(([key, value]) => {
          if (value === null || value === '') {
            newParams.delete(key);
          } else {
            newParams.set(key, value);
          }
        });

        const query = newParams.toString();
        const targetPathname = customPath || pathname;
        const currentFull = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
        const targetFull = `${targetPathname}${query ? `?${query}` : ''}`;

        if (currentFull === targetFull) {
          return 'no-op';
        }

        startTransition(() => {
          router.replace(targetFull, { scroll: false });
        });

        return true;
      } catch (_error) {
        return false;
      }
    },
    [searchParams, pathname, router]
  );

  const handleSearchProperty = useCallback(
    async (searchData: {
      wardNo: string;
      propertyNo: string;
      partitionNo: string;
      wardId: number | null;
      propertyId: string | null;
      category?: number;
      categoryLabel?: string;
      societyDetailId?: number | string | null;
      wingDetailId?: number | string | null;
      societyId?: number | string | null;
      wingId?: number | string | null;
    }): Promise<void> => {
      // Validate with Zod
      const validation = propertySearchSchema.safeParse(searchData);

      if (!validation.success) {
        const firstError = validation.error.issues[0];
        toast.error(firstError.message);
        return;
      }

      setIsSearchingProperty(true);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('ptis:searching-property', {
            detail: { isSearching: true, ...searchData },
          })
        );
      }

      try {
        // Extract locale prefix from pathname (e.g. /en/... or /mr/...)
        const segments = pathname.split('/').filter(Boolean);
        const locale =
          segments[0] && segments[0].length <= 5 && !segments[0].includes('property-tax')
            ? segments[0]
            : 'en';

        let targetPath: string | undefined = undefined;
        const isPartitionEmpty =
          !searchData.partitionNo ||
          searchData.partitionNo.trim() === '' ||
          searchData.partitionNo === '-' ||
          searchData.partitionNo === '0';

        const hasSocietyId = Boolean(
          (searchData.societyDetailId && Number(searchData.societyDetailId) > 0) ||
          (searchData.societyId && Number(searchData.societyId) > 0)
        );

        const isApartmentSociety =
          isPartitionEmpty &&
          (searchData.category === 0 ||
           searchData.categoryLabel?.toLowerCase() === 'apartment society property' ||
           hasSocietyId ||
           ((searchData.category === 1 || String(searchData.categoryLabel).toLowerCase().includes('apartment')) &&
             searchData.categoryLabel?.toLowerCase() !== 'individual property' &&
             searchData.category !== 2));

        if (isApartmentSociety) {
          targetPath = `/${locale}/property-tax/ptis/apartment`;
        } else {
          targetPath = `/${locale}/property-tax/ptis/individual`;
        }

        try {
          router.prefetch(targetPath);
        } catch {
          // ignore
        }

        const currentValuationTab =
          searchParams.get('valuationTab') || searchParams.get('tab') || null;

        const params: Record<string, string | null> = {
          wardNo: searchData.wardNo,
          propertyNo: searchData.propertyNo,
          partitionNo: searchData.partitionNo,
          wardId: searchData.wardId ? searchData.wardId.toString() : null,
          propertyId: searchData.propertyId,
          category: searchData.category !== undefined && searchData.category !== null ? String(searchData.category) : null,
          categoryLabel: searchData.categoryLabel || null,
          societyDetailId: searchData.societyDetailId ? String(searchData.societyDetailId) : null,
          wingDetailId: searchData.wingDetailId ? String(searchData.wingDetailId) : null,
          societyId: searchData.societyId ? String(searchData.societyId) : null,
          wingId: searchData.wingId ? String(searchData.wingId) : null,
          wingName: null,
          valuationTab: isApartmentSociety ? 'apartment' : (currentValuationTab === 'apartment' ? 'rateable' : currentValuationTab),
          appartmentTab: null,
          subTab: null,
          pageNumber: null,
          searchTerm: null,
          drawer: null,
          photoCategoryIndex: null,
          selectedImageIndex: null,
          viewMode: null,
          action: null,
        };

        const result = updateUrl(params, targetPath);

        if (result !== true) {
          setIsSearchingProperty(false);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('ptis:searching-property', { detail: { isSearching: false } })
            );
          }
        }
      } catch (_error) {
        toast.error(t('search.errors.navigationFailed'));
        setIsSearchingProperty(false);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('ptis:searching-property', { detail: { isSearching: false } })
          );
        }
      }
    },
    [updateUrl, t, pathname, searchParams, router]
  );

  return {
    isSearching: isSearchingProperty || isPending,
    handleSearchProperty,
    updateUrl,
  };
}
