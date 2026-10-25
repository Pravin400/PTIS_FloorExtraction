'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ExternalLink } from 'lucide-react';
import { districtULBData, cityToDistrict } from './data/ulbData';
import { formatReassessmentCurrency } from '@/lib/utils/format';
import { MasterTable, type Column } from '@/components/common/MasterTable';
import { Badge } from '@/components/common/Badge';
import { SearchSelect } from '@/components/common';
import type { CityData, ULBType, UrbanLocalBodiesTabsProps } from '@/types/assets/map-dashboard.types';

type ULBTableRow = {
  name: string;
  totalAssets: number;
  buildings: number;
  land: number;
  infra: number;
  movable: number;
  formattedValue: string;
  city?: CityData;
};

export function UrbanLocalBodiesTabs({
  cities,
  selectedCity,
  initialTab = 'Municipal Corporations',
  initialCouncilFilter = 'all',
  initialPanchayatFilter = 'all',
  locale = 'en',
}: UrbanLocalBodiesTabsProps) {
  const t = useTranslations('mapDashboard');
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get('tab') || initialTab || 'Municipal Corporations';
  const activeTab: ULBType = (['Municipal Corporations', 'Municipal Councils', 'Nagar Panchayats'] as const).includes(tabParam as ULBType)
    ? (tabParam as ULBType)
    : 'Municipal Corporations';
  const municipalCouncilsFilter = searchParams.get('councilFilter') || initialCouncilFilter || 'all';
  const nagarPanchayatsFilter = searchParams.get('panchayatFilter') || initialPanchayatFilter || 'all';

  const tabs: { type: ULBType; label: string }[] = [
    { type: 'Municipal Corporations', label: t('tabs.municipalCorporations') },
    { type: 'Municipal Councils', label: t('tabs.municipalCouncils') },
    { type: 'Nagar Panchayats', label: t('tabs.nagarPanchayats') },
  ];

  // Get list of all districts
  const allDistricts = Object.keys(districtULBData).sort();

  const filterOptions = useMemo(() => [
    { label: t('table.allDistricts'), value: 'all' },
    ...allDistricts.map(d => ({ label: d, value: d }))
  ], [allDistricts, t]);

  // Get district-based ULB data
  const getCitiesForTab = (tabType: ULBType): ULBTableRow[] => {
    const mapItem = (name: string): ULBTableRow => {
      const matchingCity = cities.find((c: CityData) => c.name === name);
      return {
        name,
        totalAssets: matchingCity?.totalAssets || 0,
        buildings: matchingCity?.buildingCount ?? 0,
        land: matchingCity?.landCount ?? 0,
        infra: matchingCity?.infrastructureCount ?? 0,
        movable: matchingCity?.movableCount ?? 0,
        formattedValue: matchingCity?.assetValue != null ? formatReassessmentCurrency(matchingCity.assetValue) : '-',
        city: matchingCity,
      };
    };

    if (selectedCity) {
      const district = cityToDistrict[selectedCity.name] || selectedCity.name;
      if (district && districtULBData[district]) {
        const ulbNames = districtULBData[district][tabType];
        return ulbNames.map(mapItem);
      }
      return [];
    }

    const currentFilter = tabType === 'Municipal Councils' ? municipalCouncilsFilter :
      tabType === 'Nagar Panchayats' ? nagarPanchayatsFilter :
        'all';

    if (currentFilter !== 'all' && districtULBData[currentFilter]) {
      const ulbNames = districtULBData[currentFilter][tabType];
      return ulbNames.map(mapItem);
    }

    const allULBs = new Set<string>();
    Object.values(districtULBData).forEach(district => {
      district[tabType].forEach(ulb => allULBs.add(ulb));
    });

    return Array.from(allULBs).sort().map(mapItem);
  };

  const handleFilterChange = (filterType: 'councilFilter' | 'panchayatFilter', val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(filterType, val);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Define table columns with whitespace-nowrap to keep header titles on a single row
  const columns: Column<ULBTableRow>[] = [
    {
      key: 'name',
      label: t('table.columns.name'),
      align: 'left',
      headerClassName: 'whitespace-nowrap',
      cellClassName: 'font-medium whitespace-nowrap',
      render: (name: unknown, row) =>
        row.city ? (
          <Link
            href={{
              pathname: `/${locale}/assets/map-dashboard`,
              query: { district: cityToDistrict[row.city.name] ?? row.city.name, tab: activeTab },
            }}
            className="hover:underline text-[#0066cc]"
          >
            {name as string}
          </Link>
        ) : (
          name as string
        ),
    },
    {
      key: 'totalAssets',
      label: t('table.columns.totalAssets'),
      align: 'center',
      headerClassName: 'whitespace-nowrap',
      cellClassName: 'whitespace-nowrap',
    },
    {
      key: 'buildings',
      label: t('table.columns.buildings'),
      align: 'center',
      headerClassName: 'whitespace-nowrap',
      cellClassName: 'whitespace-nowrap',
    },
    {
      key: 'land',
      label: t('table.columns.land'),
      align: 'center',
      headerClassName: 'whitespace-nowrap',
      cellClassName: 'whitespace-nowrap',
    },
    {
      key: 'infra',
      label: t('table.columns.infra'),
      align: 'center',
      headerClassName: 'whitespace-nowrap',
      cellClassName: 'whitespace-nowrap',
    },
    {
      key: 'movable',
      label: t('table.columns.movable'),
      align: 'center',
      headerClassName: 'whitespace-nowrap',
      cellClassName: 'whitespace-nowrap',
    },
    {
      key: 'formattedValue',
      label: t('table.columns.valueCr'),
      align: 'center',
      headerClassName: 'whitespace-nowrap',
      cellClassName: 'whitespace-nowrap',
    },
    {
      key: 'city',
      label: t('table.columns.action'),
      align: 'center',
      headerClassName: 'whitespace-nowrap',
      cellClassName: 'whitespace-nowrap',
      render: (_: unknown, row) =>
        row.city ? (
          row.city.isLive ? (
            <Link
              href={`/${locale}/assets/dashboard/master-dashboard`}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1 bg-[#0066cc] hover:bg-blue-700 text-white rounded text-xs font-semibold"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {t('table.openButton')}
            </Link>
          ) : (
            <span
              className="inline-flex items-center justify-center px-3 py-1 bg-slate-100 text-slate-400 rounded text-xs font-semibold cursor-not-allowed"
              title={t('comingSoonToast', { city: row.city.name })}
            >
              {t('table.openButton')}
            </span>
          )
        ) : (
          '-'
        ),
    },
  ];

  const currentTabCities = getCitiesForTab(activeTab);
  const currentCount = currentTabCities.length;

  // Render collapsible sections when district is selected
  if (selectedCity) {
    const municipalCorpData = getCitiesForTab('Municipal Corporations');
    const municipalCouncilsData = getCitiesForTab('Municipal Councils');
    const nagarPanchayatsData = getCitiesForTab('Nagar Panchayats');

    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-auto border rounded-lg border-[#0066cc]/10 bg-white p-2">

          {/* Municipal Corporation */}
          {municipalCorpData.length > 0 && (
            <div className="border border-blue-100 rounded-lg overflow-hidden bg-white mb-4">
              <div className="p-2 text-[#0066cc] bg-gradient-to-r from-[#E2EEFF] via-[#D6E8FF] to-[#E2EEFF] border-b border-blue-200 flex items-center justify-between">
                <span className="font-semibold text-sm">{t('tabs.municipalCorporations')}</span>
                <Badge variant="secondary" size="sm">{municipalCorpData.length}</Badge>
              </div>
              <MasterTable<ULBTableRow>
                columns={columns}
                data={municipalCorpData}
                getRowKey={(row) => row.name}
                paginationConfig={{ enabled: false }}
              />
            </div>
          )}

          {/* Collapsible Sections for Councils and Nagar Panchayats */}
          {(['Municipal Councils', 'Nagar Panchayats'] as ULBType[]).map((tabType) => {
            const sectionData = tabType === 'Municipal Councils' ? municipalCouncilsData : nagarPanchayatsData;
            const tabLabel = tabType === 'Municipal Councils' ? t('tabs.municipalCouncils') : t('tabs.nagarPanchayats');

            return (
              <details key={tabType} open className="border border-blue-100 rounded-lg overflow-hidden bg-white mb-4">
                <summary className="p-2 font-semibold text-[#0066cc] bg-slate-50 border-b border-slate-200 cursor-pointer flex items-center justify-between select-none">
                  <span>{tabLabel} ({sectionData.length})</span>
                </summary>
                <div className="p-2">
                  <MasterTable<ULBTableRow>
                    columns={columns}
                    data={sectionData}
                    getRowKey={(row) => row.name}
                    emptyText={t('table.noULBs', { type: tabLabel.toLowerCase() })}
                    paginationConfig={{ enabled: false }}
                  />
                </div>
              </details>
            );
          })}
        </div>
      </div>
    );
  }

  // Render state-wide tabbed view when no district is selected
  return (
    <div className="flex flex-col h-full">
      {/* Tabs list */}
      <div className="flex gap-1 mb-3 border-b pb-1 border-[#0066cc]/10">
        {tabs.map((tabItem) => (
          <Link
            key={tabItem.type}
            href={{
              pathname: `/${locale}/assets/map-dashboard`,
              query: { tab: tabItem.type },
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === tabItem.type
                ? 'bg-[#0066cc] text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tabItem.label}
          </Link>
        ))}
      </div>

      {/* Count Indicator and District Filter */}
      <div className="flex justify-between items-center mb-2 gap-3">
        <Badge variant="secondary" size="md">
          {t('table.totalCount', { count: currentCount })}
        </Badge>

        {/* District Filter for Councils and Nagar Panchayats */}
        {(activeTab === 'Municipal Councils' || activeTab === 'Nagar Panchayats') && (
          <div className="w-[180px]">
            <SearchSelect
              options={filterOptions}
              value={activeTab === 'Municipal Councils' ? municipalCouncilsFilter : nagarPanchayatsFilter}
              onChange={(_, val) => handleFilterChange(activeTab === 'Municipal Councils' ? 'councilFilter' : 'panchayatFilter', val)}
              className="!text-black font-medium"
            />
          </div>
        )}
      </div>

      {/* Single Scrollable MasterTable with Fixed Header */}
      <div className="flex-1 min-h-0">
        <MasterTable<ULBTableRow>
          columns={columns}
          data={currentTabCities}
          maxBodyHeightClassName="max-h-[calc(100vh-320px)]"
          getRowKey={(row) => row.name}
          paginationConfig={{ enabled: false }}
        />
      </div>
    </div>
  );
}