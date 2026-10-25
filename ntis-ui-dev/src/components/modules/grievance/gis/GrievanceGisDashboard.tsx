'use client';

/**
 * Grievance GIS Dashboard Coordinator
 * Architecture: Clean Component Coordinator / ntis-ui
 * Orchestrates KPIs, Cascading Filters, Google Hybrid Map, and Detail Inspector Drawer.
 * Logic & Data Fetching encapsulated in useGisDashboard hook.
 */

import dynamic from 'next/dynamic';
import { GrievanceGisKpiCards } from './GrievanceGisKpiCards';
import { GrievanceGisFilterBar } from './GrievanceGisFilterBar';
import { GrievanceGisDetailDrawer } from './GrievanceGisDetailDrawer';
import { GrievanceGisLegendBar } from './GrievanceGisLegendBar';
import { useGisDashboard } from '@/hooks/grievance/gis';

// Dynamic import Leaflet map to prevent SSR issues
const GrievanceGisMap = dynamic(
  () => import('./GrievanceGisMap').then((mod) => mod.GrievanceGisMap),
  { ssr: false }
);

export function GrievanceGisDashboard() {
  const {
    activeFilters,
    filterGroups,
    kpiSummary,
    isKpiLoading,
    selectedGrievanceId,
    popupDetails,
    isDrawerOpen,
    isDetailsLoading,
    corpConfig,
    gisLayers,
    publicGrievances,
    isExporting,
    handleSelectGrievance,
    handleFilterChange,
    handleSelectKpi,
    handleResetFilters,
    handleExportExcel,
    closeDrawer,
  } = useGisDashboard();

  return (
    <div className="w-full h-full min-h-[580px] flex flex-col p-2.5 sm:p-3.5 gap-2.5 overflow-hidden bg-slate-100/70">
      {/* 1. Dynamic KPI Metrics Bar */}
      <div className="shrink-0">
        <GrievanceGisKpiCards
          cards={kpiSummary?.cards || []}
          totalGrievances={kpiSummary?.totalGrievances || 0}
          activeKpiCode={activeFilters.kpiCode}
          onSelectKpi={handleSelectKpi}
          isLoading={isKpiLoading}
        />
      </div>

      {/* 2. Cascading Filter Bar */}
      <div className="shrink-0 relative z-30">
        <GrievanceGisFilterBar
          filterGroups={filterGroups}
          activeFilters={activeFilters}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
          onExportExcel={handleExportExcel}
          isExporting={isExporting}
          grievances={publicGrievances}
          onSelectGrievance={handleSelectGrievance}
        />
      </div>

      {/* 3. Interactive Map Canvas with Floating Inspector Panel */}
      <div className="flex-1 min-h-0 relative z-0 w-full h-full rounded-2xl overflow-hidden border border-slate-300 shadow-md ring-1 ring-slate-900/5 bg-slate-900">
        <GrievanceGisMap
          filters={activeFilters}
          filterGroups={filterGroups}
          onSelectGrievanceId={handleSelectGrievance}
          selectedGrievanceId={selectedGrievanceId}
          config={corpConfig}
          layers={gisLayers}
          grievances={publicGrievances}
        />

        {/* 4. Docked Dynamic Spatial Details Inspector */}
        <GrievanceGisDetailDrawer
          details={popupDetails}
          isOpen={isDrawerOpen}
          onClose={closeDrawer}
          isLoading={isDetailsLoading}
        />
      </div>

      {/* 4. Visual Pin & Dynamic Boundary Legend Bar */}
      <div className="shrink-0">
        <GrievanceGisLegendBar config={corpConfig} layers={gisLayers} filterGroups={filterGroups} />
      </div>
    </div>
  );
}
