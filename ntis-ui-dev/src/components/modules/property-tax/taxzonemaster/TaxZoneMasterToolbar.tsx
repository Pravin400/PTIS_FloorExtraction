'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';

import { AddButton, SearchInput } from '@/components/common';
import { TEXT_SANITIZE } from '@/lib/utils/validation-rules';
import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';

export function TaxZoneMasterToolbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();

  const tZone = useTranslations('taxZone');
  const zoneLabel = useAliasLabel('Tax Zone', tZone('aliasFallback.taxZone'));

  const base = `/${locale}/property-tax/taxzone-master`;

  // Search state
  const currentSearchTerm = searchParams.get('search') ?? '';
  const [search, setSearch] = useState<string>(currentSearchTerm);
  const [prevSearchFromUrl, setPrevSearchFromUrl] = useState(currentSearchTerm);

  // Sync search state with URL when currentSearchTerm changes (Avoid useEffect to prevent cascading renders)
  if (currentSearchTerm !== prevSearchFromUrl) {
    setSearch(currentSearchTerm);
    setPrevSearchFromUrl(currentSearchTerm);
  }

  useEffect(() => {
    if (pathname.endsWith('/add') || pathname.includes('/edit/')) return;

    const timer = setTimeout(() => {
      const trimmedSearch = search.trim();
      const trimmedCurrent = currentSearchTerm.trim();

      if (trimmedSearch === trimmedCurrent) {
        if (!trimmedSearch && search !== '') {
          setSearch('');
        }
        return;
      }

      const params = new URLSearchParams(searchParams.toString());
      if (trimmedSearch) {
        params.set('search', trimmedSearch);
      } else {
        params.delete('search');
      }
      params.set('page', '1');

      router.push(`${pathname}?${params.toString()}`);
    }, 500);

    return () => clearTimeout(timer);
  }, [search, currentSearchTerm, pathname, router, searchParams]);

  return (
    <div className="flex items-center gap-3">
      <div className="hidden md:flex items-center">
        <SearchInput
          value={search}
          onChange={(value) => setSearch(value.replace(TEXT_SANITIZE, ''))}
          placeholder={tZone('list.filters.search', { zone: zoneLabel })}
          className="mb-0 w-64 lg:w-80 text-gray-900"
        />
      </div>

      <AddButton
        label={tZone('list.buttons.add', { zone: zoneLabel })}
        onClick={() => {
          router.push(`${base}/taxzone/add`)
        }}
      />
    </div>
  );
}
