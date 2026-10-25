import Link from 'next/link';
import { RefreshCw } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import MaharashtraMap from './maps/MaharashtraMap';
import { UrbanLocalBodiesTabs } from './UrbanLocalBodiesTabs';
import { SummaryCards } from './SummaryCards';
import { createCityData } from './data/cityData';
import { cityToDistrict } from './data/ulbData';
import type { CityData, HighCommitteeDashboardProps } from '@/types/assets/map-dashboard.types';

export async function HighCommitteeDashboard({
  dashboardStats,
  initialDistrict,
  initialTab = 'Municipal Corporations',
  initialCouncilFilter = 'all',
  initialPanchayatFilter = 'all',
  locale = 'en',
}: HighCommitteeDashboardProps) {
 
  const t = await getTranslations('mapDashboard');

  // Derive selectedCity from initialDistrict
  const akolaStats = {
    totalAssets: dashboardStats?.totalAssets ?? 0,
    criticalAssets: dashboardStats?.criticalAssets ?? 0,
    pendingDocuments: dashboardStats?.pendingDocuments ?? 0,
    assetValue: dashboardStats?.totalValue ?? 0,
  };
  const citiesForSelection = createCityData(akolaStats);
  const selectedCity = initialDistrict
    ? citiesForSelection.find(
        (c) =>
          c.name.toLowerCase() === initialDistrict.toLowerCase() ||
          cityToDistrict[c.name]?.toLowerCase() === initialDistrict.toLowerCase()
      ) || {
        name: initialDistrict,
        lat: 0,
        lng: 0,
        totalAssets: 0,
        criticalAssets: 0,
        pendingDocuments: 0,
        assetValue: 0,
        x: 0,
        y: 0,
      }
    : null;

  // Derive Akola stats from live API data
  const akolaRealData = {
    totalAssets: dashboardStats?.totalAssets ?? 0,
    criticalAssets: dashboardStats?.criticalAssets ?? 0,
    pendingDocuments: dashboardStats?.pendingDocuments ?? 0,
    assetValue: dashboardStats?.totalValue ?? 0,
  };

  // Full city data for the Maharashtra map (all 29 corporations)
  const cityData: CityData[] = createCityData(akolaRealData);

  // Table shows only Akola with real API category counts
  const akolaCityForTable: CityData[] = [
    {
      name: 'Akola',
      lat: 20.7002,
      lng: 77.0082,
      totalAssets: dashboardStats?.totalAssets ?? akolaRealData.totalAssets,
      criticalAssets: akolaRealData.criticalAssets,
      pendingDocuments: akolaRealData.pendingDocuments,
      assetValue: dashboardStats?.totalValue ?? akolaRealData.assetValue,
      x: 93,
      y: 35,
      isLive: true,
      buildingCount: dashboardStats?.buildingCount ?? 0,
      landCount: dashboardStats?.landCount ?? 0,
      infrastructureCount: dashboardStats?.infrastructureCount ?? 0,
      movableCount: dashboardStats?.movableCount ?? 0,
    },
  ];
  

  // Sort Akola list: selected city first (for highlight consistency)
  const sortedCities = selectedCity
    ? [selectedCity, ...akolaCityForTable.filter(city => city.name !== selectedCity.name)]
    : akolaCityForTable;

  // KPI totals derived from API data
  const totalStats = {
    totalAssets: dashboardStats?.totalAssets ?? 0,
    criticalAssets: akolaRealData.criticalAssets,
    pendingDocuments: akolaRealData.pendingDocuments,
    assetValue: dashboardStats?.totalValue ?? akolaRealData.assetValue,
    buildingCount: dashboardStats?.buildingCount ?? 0,
    landCount: dashboardStats?.landCount ?? 0,
    infrastructureCount: dashboardStats?.infrastructureCount ?? 0,
    movableCount: dashboardStats?.movableCount ?? 0,
    monetizationCount: dashboardStats?.monetizationCount ?? 0,
    encroachmentCount: dashboardStats?.encroachmentCount ?? 0,
    totalValue: dashboardStats?.totalValue ?? 0,
  };

  // Localized labels for ULB Dashboard
  const labels = {
    title: t('title'),
    ulbLabel: t('cards.totalUlbs'),
    assetLabel: t('cards.totalAssets'),
    buildingLabel: t('cards.buildingAssets'),
    landLabel: t('cards.landAssets'),
    infraLabel: t('cards.infrastructureAssets'),
    locationLabel: 'ULB',
  };

  return (
    <div className="-mt-3 -mx-3 md:-mx-4 min-h-[calc(100vh-140px)] flex flex-col bg-white">
      {/* Main viewport area - flows directly below header */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Stats Overview wrapper */}
        <div
          className="flex-1 flex flex-col p-4 gap-4 overflow-hidden"
        >
          {/* KPI Summary Cards */}
          <div className="flex-shrink-0">
            <SummaryCards
              labels={labels}
              filteredCitiesLength={akolaCityForTable.length}
              totalStats={totalStats}
            />
          </div>

          {/* Main Content - Map and City List */}
          <div
            className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-hidden"
          >
            {/* Combined Map and City List Card */}
            <div
              className="lg:col-span-3 rounded-2xl shadow-lg border overflow-hidden hover:shadow-2xl transition-all duration-500 flex flex-col lg:flex-row gap-0 flex-1 min-h-0 bg-white border-[#0066cc]/20"
            >
              {/* Map Section */}
              <div
                className="lg:w-[60%] h-full relative pt-[5px] border-[#0066cc]/10"
              >
                <div className="absolute inset-0 pointer-events-none bg-transparent" />
                <MaharashtraMap
                  cities={cityData}
                  selectedCity={selectedCity}
                  locale={locale}
                />
              </div>

              {/* City List Section */}
              <div className="lg:w-[40%] relative h-full flex flex-col">
                <div className="absolute inset-0 pointer-events-none bg-transparent" />
                <div className="relative z-10 flex flex-col h-full">
                  <div className="p-2 flex flex-col h-full">
                    <div className="mb-2 flex-shrink-0 px-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-base font-medium mb-1 text-black">
                          {t('ulbListTitle')}
                        </h4>
                        {selectedCity && (
                          <Link
                            href={`/${locale}/assets/map-dashboard`}
                            className="!p-2 bg-blue-50 hover:bg-blue-100 text-[#0066cc] border-[#0066cc]/20 rounded-md border flex items-center justify-center"
                            title={t('clearFilterTooltip')}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* Tabbed ULB Table */}
                    <div className="flex-1 min-h-0 pl-1 pr-0">
                      <UrbanLocalBodiesTabs
                        cities={sortedCities}
                        selectedCity={selectedCity}
                        initialTab={initialTab}
                        initialCouncilFilter={initialCouncilFilter}
                        initialPanchayatFilter={initialPanchayatFilter}
                        locale={locale}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}