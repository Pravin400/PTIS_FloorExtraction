'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';

import { AddButton, Tabs } from '@/components/common';
import { SearchInput } from '@/components/common/SearchInput';
import { TEXT_SANITIZE } from '@/lib/utils/validation';
import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';

type TabKey = 'floor' | 'subfloor';

export function FloorMasterToolbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();

  const tFloor = useTranslations('floor.floor');
  const tSubFloor = useTranslations('floor.subfloor');
  const floorLabel = useAliasLabel('Floor', tFloor('aliasFallback.floor'));

  const base = `/${locale}/property-tax/floormaster`;

  // Detect active tab from pathname
  const activeTab: TabKey = pathname.includes('/subfloor') ? 'subfloor' : 'floor';
  const t = activeTab === 'floor' ? tFloor : tSubFloor;
  const values = { floor: floorLabel };

  // Search functionality
  const currentSearchTerm = searchParams.get('q') ?? '';
  const [search, setSearch] = useState<string>(currentSearchTerm);

  // Sync search state with URL when currentSearchTerm changes (e.g., on Back/Forward navigation)
  const [prevSearchTerm, setPrevSearchTerm] = useState(currentSearchTerm);
  if (currentSearchTerm !== prevSearchTerm) {
    setPrevSearchTerm(currentSearchTerm);
    setSearch(currentSearchTerm);
  }

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (search === currentSearchTerm) return;

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      params.set('page', '1'); // Reset to first page on search

      if (search.trim()) {
        params.set('q', search.trim());
      } else {
        params.delete('q');
      }

      router.push(`${pathname}?${params.toString()}`);
    }, 500);

    return () => clearTimeout(timer);
  }, [search, currentSearchTerm, pathname, router, searchParams]);

  return (
    <div className="flex items-center gap-3">
      <div className="flex w-full justify-end">
        <SearchInput
          value={search}
          onChange={(value) => {
            // Sanitize search input to prevent special characters
            const sanitized = value.replace(TEXT_SANITIZE, '');
            setSearch(sanitized);
          }}
          placeholder={t('form.searchPlaceholder', values)}
          className="mb-0 w-80 text-gray-900"
        />
      </div>

      <Tabs
        className="flex items-center gap-3 mt-0 flex-row"
        value={activeTab}
        variant="pills"
        items={[
          { value: 'floor', label: floorLabel, content: null },
          { value: 'subfloor', label: tFloor('tabs.subfloor', values), content: null },
        ]}
        onChange={(v) => router.push(`${base}/${v}`)}
      />

      <AddButton
        className="w-full"
        label={t('form.addTitle', values)}
        onClick={() => router.push(`${base}/${activeTab}/add`)}
      />
    </div>
  );
}
