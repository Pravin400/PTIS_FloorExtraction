'use client';

import React from 'react';
import { Users, X, ChevronRight, Building2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { SearchInput, Badge, Button } from '@/components/common';
import type { AssetSubUnitsDrawerProps } from '@/types/asset-gis.types';

export const AssetSubUnitsDrawer: React.FC<AssetSubUnitsDrawerProps> = ({
  isOpen,
  onClose,
  isShoppingComplexType,
  combinedChildAssets,
  unitLabelPlural,
  childSearchQuery,
  setChildSearchQuery,
  statusFilter,
  setStatusFilter,
  rentedCount,
  vacantCount,
  availableFloors,
  floorFilter,
  setFloorFilter,
  isMainView,
  parentAssetId,
  departmentName,
  owner,
  filteredChildAssets,
  prop,
  onSelectChildAsset,
  formatArea,
}) => {
  const t = useTranslations('assetGis');
  if (!isOpen) return null;

  return (
    <div className="absolute inset-x-0 bottom-0 top-[84px] z-[200] bg-white flex flex-col text-slate-800 animate-in fade-in slide-in-from-top-2 duration-200 rounded-b-2xl overflow-hidden shadow-2xl border-t border-slate-200 pointer-events-auto">
      {/* Drawer Header */}
      <div className="px-4 py-3 bg-white border-b border-slate-100 flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-600" />
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
            {`SELECT ${isShoppingComplexType ? 'SHOP UNIT' : 'UNIT'} (${combinedChildAssets.length} ${unitLabelPlural.toUpperCase()})`}
          </h4>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          icon={X}
          className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer h-auto border-0"
          title="Close Drawer"
        />
      </div>

      {/* Drawer Search Bar */}
      <div className="p-3 bg-slate-50/80 border-b border-slate-100 shrink-0 space-y-2">
        <SearchInput
          value={childSearchQuery}
          onChange={setChildSearchQuery}
          placeholder={`Search ${unitLabelPlural.toLowerCase()} by Number, Name, or Tenant...`}
          className="w-full mb-0"
        />

        {/* Status Filter Row */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-0.5">
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1 rounded-full text-[9.5px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs h-auto border-0 ${
              statusFilter === 'ALL'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            {`ALL ${combinedChildAssets.length}`}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => setStatusFilter('RENTED')}
            className={`px-3 py-1 rounded-full text-[9.5px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs h-auto border-0 ${
              statusFilter === 'RENTED'
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
            }`}
          >
            {`${t('details.rented')} ${rentedCount}`}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => setStatusFilter('VACANT')}
            className={`px-3 py-1 rounded-full text-[9.5px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs h-auto border-0 ${
              statusFilter === 'VACANT'
                ? 'bg-amber-600 text-white hover:bg-amber-700'
                : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
            }`}
          >
            {`${t('details.vacant')} ${vacantCount}`}
          </Button>

          {/* Floor Filters if available */}
          {availableFloors.map((fName: string) => (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              key={fName}
              onClick={() => setFloorFilter(floorFilter === fName ? 'ALL' : fName)}
              className={`px-3 py-1 rounded-full text-[9.5px] font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shadow-xs h-auto border-0 ${
                floorFilter === fName
                  ? 'bg-indigo-600 text-white font-black hover:bg-indigo-700'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {fName}
            </Button>
          ))}
        </div>
      </div>

      {/* Drawer Scrollable Units List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar bg-slate-50/50">
        {/* Building Main Item */}
        <div
          onClick={() => {
            onClose();
            if (!isMainView && onSelectChildAsset && parentAssetId) {
              onSelectChildAsset(parentAssetId);
            }
          }}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group shadow-xs ${
            isMainView
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500 shadow-md ring-2 ring-blue-400/40'
              : 'bg-white hover:bg-slate-50 border-slate-200/90 text-slate-800'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                isMainView ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600 border border-blue-100'
              }`}
            >
              <Building2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h5 className="text-[13px] font-black truncate leading-tight">{`Building Main (Shopping Complex)`}</h5>
              <p className={`text-[10px] font-semibold truncate mt-0.5 ${isMainView ? 'text-blue-100' : 'text-slate-500'}`}>
                <strong>{t('details.department')} :</strong> {departmentName}
              </p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span
                  className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded-md ${
                    isMainView ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700 font-bold'
                  }`}
                >
                  {`OWNER : ${owner}`}
                </span>
                <span className={`text-[8.5px] font-bold ${isMainView ? 'text-blue-200' : 'text-slate-500'}`}>
                  {`• ${combinedChildAssets.length} Units`}
                </span>
              </div>
            </div>
          </div>
          <ChevronRight
            className={`w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5 ${
              isMainView ? 'text-white' : 'text-slate-400'
            }`}
          />
        </div>

        {/* Individual Child Shop Cards */}
        {filteredChildAssets.map((unit: Record<string, unknown>, idx: number) => {
          const childNumericId = Number(unit.assetId ?? unit.AssetId ?? unit.id ?? unit.Id);
          const unitName = (unit.assetName || unit.name || unit.subUnitName || unit.unitName || `Shop #${idx + 1}`) as string;
          const unitCode = (unit.assetNo || unit.mpmsNo || unit.unitNo || unit.code || unit.subUnitCode || `Shop-${idx + 1}`) as string;
          const tenantName = (unit.tenantName || unit.inChargeName || unit.occupierName) as string | undefined;
          const floorName = (unit.floorName || unit.floor) as string | undefined;
          const carpetArea = (unit.carpetAreaSqFt || unit.carpetAreaSqFeet || unit.carpetArea) as number | undefined;
          const monthlyRent = unit.monthlyRent;
          const occupancy = String(unit.occupancyStatus || (tenantName ? 'Rented' : 'Vacant'));
          const isOccupied = occupancy.toLowerCase().includes('rent') || occupancy.toLowerCase().includes('occup');

          const isSelected =
            String(prop.assetId || prop.id) === String(childNumericId) ||
            String(prop.assetNo || prop.mpmsId) === String(unitCode);

          const shortBadge = unitCode.replace(/^mpms-?\d+-?\d+-?/i, '') || `${idx + 1}`;

          return (
            <div
              key={childNumericId || unitCode || idx}
              onClick={() => {
                onClose();
                if (onSelectChildAsset) {
                  onSelectChildAsset(childNumericId || unitCode);
                }
              }}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group shadow-xs ${
                isSelected
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500 shadow-lg ring-2 ring-blue-400/40'
                  : 'bg-white hover:bg-slate-50 border-slate-200/90 text-slate-800'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className={`w-10 h-10 rounded-2xl font-mono text-[12px] font-black flex items-center justify-center shrink-0 shadow-xs ${
                    isSelected
                      ? 'bg-white/20 text-white border border-white/30'
                      : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                  }`}
                >
                  {shortBadge}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <h5 className="text-[13px] font-black truncate leading-tight">
                      {`Unit ${shortBadge} (${unitName})`}
                    </h5>
                    <Badge
                      variant={isOccupied ? 'success' : 'warning'}
                      size="sm"
                      className={isSelected ? 'bg-white/20 text-white border-white/20' : ''}
                    >
                      {occupancy}
                    </Badge>
                  </div>

                  <p
                    className={`text-[10.5px] font-semibold truncate mt-0.5 ${
                      isSelected ? 'text-indigo-100' : 'text-slate-600'
                    }`}
                  >
                    <strong>{t('details.tenant')} :</strong> {tenantName || 'N/A (Vacant Unit)'}
                  </p>

                  <div className="flex items-center gap-2 mt-1.5 text-[9.5px]">
                    {carpetArea !== undefined && carpetArea !== null && (
                      <span
                        className={`font-bold px-1.5 py-0.2 rounded-md ${
                          isSelected ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {formatArea(Number(carpetArea))}
                      </span>
                    )}
                    {monthlyRent !== undefined && monthlyRent !== null && (
                      <span className={`font-extrabold ${isSelected ? 'text-emerald-200' : 'text-emerald-600'}`}>
                        {`₹${Number(monthlyRent).toLocaleString('en-IN')}/mo`}
                      </span>
                    )}
                    {floorName && (
                      <span className={isSelected ? 'text-indigo-200' : 'text-slate-400'}>{`• ${floorName}`}</span>
                    )}
                  </div>
                </div>
              </div>

              <ChevronRight
                className={`w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5 ml-2 ${
                  isSelected ? 'text-white' : 'text-slate-400'
                }`}
              />
            </div>
          );
        })}

        {filteredChildAssets.length === 0 && (
          <div className="p-8 text-center text-xs text-slate-500 font-medium">
            {t('sidebar.noResultsFound')}
          </div>
        )}
      </div>
    </div>
  );
};
