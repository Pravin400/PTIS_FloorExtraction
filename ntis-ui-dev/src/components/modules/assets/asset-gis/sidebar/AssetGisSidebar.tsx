'use client';

// Force recompile to clear potential HMR cache issues
import { Filter, Layers as LayersIcon, X } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/common';
import { AssetGisSearchSection } from './AssetGisSearchSection';
import { AssetGisFilterBadges } from './AssetGisFilterBadges';
import { AssetGisFilterList } from './AssetGisFilterList';
import { AssetGisLayerList } from './AssetGisLayerList';
import { useCouncilBoundaryStore } from '@/hooks/store/useCouncilBoundaryStore';
import type { AssetGisSidebarProps } from '@/types/asset-gis.types';

export type { AssetGisSidebarProps };

const AssetFilters = dynamic(() => import('../asset/AssetFilters').then(mod => mod.AssetFilters), { ssr: false });

export function AssetGisSidebar({ 
  sidebarTab, setSidebarTab, setShowSidebar, 
  activeDropdown, setActiveDropdown,
  allWardSummaries,
  isLoading
}: Omit<AssetGisSidebarProps, 'dashboardFilters'>) {
  
  const setSelectedPropertyWithSource = useCouncilBoundaryStore(state => state.setSelectedPropertyWithSource);
  const activeModule = useCouncilBoundaryStore(state => state.activeModule);
  const t = useTranslations('assetGis');

  return (
    <div className="flex flex-col h-full relative bg-white">
      {/* HEADER: FILTERS & LAYERS */}
      <div className="flex items-center justify-between mx-4 mt-4 mb-2 px-1 shrink-0">
        <h3 className="text-[15px] font-black uppercase tracking-wide text-slate-800">
          {t('sidebar.filtersAndLayers')}
        </h3>
        <Button 
          type="button"
          variant="ghost"
          size="xs"
          onClick={() => setShowSidebar(false)}
          icon={X}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all group bg-red-50 hover:bg-red-100 border border-red-200 text-red-500 shadow-2xs active:scale-95 cursor-pointer h-auto p-0"
          aria-label="Close Sidebar"
          title="Close Sidebar"
        />
      </div>

      {/* TABS: Filter | Layer */}
      <div className="mx-4 mt-1 mb-2 p-1 rounded-xl shrink-0 bg-slate-100 border border-slate-300/40 shadow-2xs">
        <div className="flex w-full gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setSidebarTab('filters')}
            icon={Filter}
            className={cn(
              'flex-1 py-2 rounded-lg text-sm font-black transition-all duration-200 relative overflow-hidden flex items-center justify-center gap-2 cursor-pointer h-auto',
              sidebarTab === 'filters'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-500/20 border border-blue-500/50 scale-[1.01] hover:text-white'
                : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 shadow-2xs'
            )}
          >
            <span className="tracking-tight">{t('sidebar.filterTab')}</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => setSidebarTab('layers')}
            icon={LayersIcon}
            className={cn(
              'flex-1 py-2 rounded-lg text-sm font-black transition-all duration-200 relative overflow-hidden flex items-center justify-center gap-2 cursor-pointer h-auto',
              sidebarTab === 'layers'
                ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md shadow-purple-500/20 border border-purple-500/50 scale-[1.01] hover:text-white'
                : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 shadow-2xs'
            )}
          >
            <span className="tracking-tight">{t('sidebar.layerTab')}</span>
          </Button>
        </div>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
        {sidebarTab === 'filters' ? (
          activeModule === 'ASSET' ? (
            <AssetFilters isLoading={isLoading} />
          ) : (
            <div className="space-y-1">
              {/* SEARCH SECTION */}
              <AssetGisSearchSection onSelectProperty={(item) => setSelectedPropertyWithSource(item, 'search')} />

              {/* ACTIVE FILTER BADGES */}
              <AssetGisFilterBadges />

              {/* MAIN FILTER LIST */}
              <AssetGisFilterList
                allWardSummaries={allWardSummaries}
                activeDropdown={activeDropdown}
                setActiveDropdown={setActiveDropdown}
                isLoading={isLoading}
              />
            </div>
          )
        ) : (
          <AssetGisLayerList />
        )}
      </div>

      {/* FOOTER */}
      <div className="p-6 bg-slate-50 border-t border-slate-100 shrink-0">
        <div className="flex items-center justify-between opacity-50 grayscale">
          <p className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.2em]">{t('sidebar.platformCopyright')}</p>
          <div className="flex gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
          </div>
        </div>
      </div>
    </div>
  );
}
