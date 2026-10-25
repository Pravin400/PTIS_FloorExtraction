'use client';

import { motion } from 'motion/react';
import { Filter, X, Activity, MapPin, Layers, Square, Building2, Settings, ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge, Button } from '@/components/common';
import { useCouncilBoundaryStore } from '@/hooks/store/useCouncilBoundaryStore';

export function AssetGisFilterBadges() {
  const t = useTranslations('assetGis');
  // Use Selectors
  const activeFilterCount = useCouncilBoundaryStore(state => {
    let count = 0;
    if (state.activeKpiFilter) count++;
    if (state.selectedZone && state.selectedZone !== 'all') count++;
    count += (state.selectedWard || []).filter(w => w !== 'all').length;
    count += (state.selectedBlock || []).filter(b => b !== 'all').length;
    if (state.selectedPropertyTypeGroup && state.selectedPropertyTypeGroup.toLowerCase() !== 'all') count++;
    if (state.selectedPropertyTypeId) count++;
    if (state.taxStatus && state.taxStatus.length > 0 && state.taxStatus[0].toLowerCase() !== 'all') count++;
    if (state.assessmentSubCategory && state.assessmentSubCategory !== 'all') count++;
    if (state.documentSubmittedStatus && state.documentSubmittedStatus !== 'all') count++;
    return count;
  });

  const activeKpiFilter = useCouncilBoundaryStore(state => state.activeKpiFilter);
  const setActiveKpiFilter = useCouncilBoundaryStore(state => state.setActiveKpiFilter);
  const selectedZone = useCouncilBoundaryStore(state => state.selectedZone);
  const selectedZoneNo = useCouncilBoundaryStore(state => state.selectedZoneNo);
  const selectedZoneLabel = useCouncilBoundaryStore(state => state.selectedZoneLabel);
  const setSelectedZone = useCouncilBoundaryStore(state => state.setSelectedZone);
  const selectedWard = useCouncilBoundaryStore(state => state.selectedWard);
  const setSelectedWard = useCouncilBoundaryStore(state => state.setSelectedWard);
  const selectedBlock = useCouncilBoundaryStore(state => state.selectedBlock);
  const selectedWardNo = useCouncilBoundaryStore(state => state.selectedWardNo);
  const selectedBlockLabel = useCouncilBoundaryStore(state => state.selectedBlockLabel);
  const setSelectedBlock = useCouncilBoundaryStore(state => state.setSelectedBlock);
  const selectedPropertyTypeGroup = useCouncilBoundaryStore(state => state.selectedPropertyTypeGroup);
  const setSelectedPropertyTypeGroup = useCouncilBoundaryStore(state => state.setSelectedPropertyTypeGroup);
  const selectedPropertyTypeId = useCouncilBoundaryStore(state => state.selectedPropertyTypeId);
  const setSelectedPropertyTypeId = useCouncilBoundaryStore(state => state.setSelectedPropertyTypeId);
  const taxStatus = useCouncilBoundaryStore(state => state.taxStatus);
  const setTaxStatus = useCouncilBoundaryStore(state => state.setTaxStatus);
  const assessmentSubCategory = useCouncilBoundaryStore(state => state.assessmentSubCategory);
  const setAssessmentSubCategory = useCouncilBoundaryStore(state => state.setAssessmentSubCategory);
  const documentSubmittedStatus = useCouncilBoundaryStore(state => state.documentSubmittedStatus);
  const setDocumentSubmittedStatus = useCouncilBoundaryStore(state => state.setDocumentSubmittedStatus);
  const resetFilters = useCouncilBoundaryStore(state => state.resetFilters);
  
  const propertyTypeGroupOptions = useCouncilBoundaryStore(state => state.propertyTypeGroupOptions);
  const propertyTypeMasterList = useCouncilBoundaryStore(state => state.propertyTypeMasterList);

  if (activeFilterCount === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: -2 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="px-3 py-2 rounded-[18px] relative overflow-hidden shrink-0 border border-sky-300/60 bg-gradient-to-br from-cyan-100/90 to-sky-200/70 backdrop-blur-md shadow-md inset-shadow-xs"
    >
      <div className="flex items-center justify-between mb-1.5 px-0.5 relative z-10">
        <div className="flex items-center gap-1 shrink-0">
          <Filter className="w-3 h-3 text-sky-900 opacity-90" />
          <div className="flex items-baseline gap-1 whitespace-nowrap">
            <p className="text-[9px] font-black uppercase tracking-wider text-sky-950 leading-none">{t('sidebar.filterTab')}</p>
            <p className="text-[8px] font-bold text-sky-800/90 uppercase leading-none tracking-tight">{activeFilterCount} {t('sidebar.activeFilters')}</p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={resetFilters}
          className="flex items-center px-2 py-0.5 rounded-full bg-white/60 border border-sky-300/40 text-[7.5px] font-bold uppercase tracking-tight text-rose-500 hover:text-rose-600 hover:bg-white transition-all shadow-2xs active:scale-95 h-4 shrink-0 whitespace-nowrap ml-1.5 backdrop-blur-md cursor-pointer"
        >
          {t('sidebar.clearAll')}
        </Button>
      </div>

      <div className="rounded-[12px] bg-white/30 p-1 inset-shadow-2xs min-h-[30px] max-h-[90px] overflow-y-auto custom-scrollbar-mini">
        <div className="flex flex-wrap gap-1.5 p-0.5">
          {activeKpiFilter && (
            <Badge className="flex items-center gap-1 px-1.5 py-0.5 border-none text-white rounded-md text-[8.5px] font-bold shadow-2xs h-4.5 bg-amber-500">
              <Activity className="w-2.5 h-2.5" />
              {activeKpiFilter}
              <div className="cursor-pointer hover:bg-black/20 rounded-full p-0.5" onClick={() => setActiveKpiFilter(null)}><X className="w-2.5 h-2.5" /></div>
            </Badge>
          )}

          {selectedZone && selectedZone !== 'all' && (
            <Badge className="flex items-center gap-1 px-1.5 py-0.5 border-none text-white rounded-md text-[8.5px] font-bold shadow-2xs h-4.5 bg-red-500">
              <MapPin className="w-2.5 h-2.5" />
              {selectedZoneLabel || (selectedZoneNo ? `${t('sidebar.zone')} ${selectedZoneNo}` : selectedZone)}
              <div className="cursor-pointer hover:bg-black/20 rounded-full p-0.5" onClick={() => setSelectedZone('all')}><X className="w-2.5 h-2.5" /></div>
            </Badge>
          )}

          {selectedWard.filter(w => w && w !== 'all').map((wardId: string) => (
            <Badge key={wardId} className="flex items-center gap-1 px-1.5 py-0.5 border-none text-white rounded-md text-[8.5px] font-bold shadow-2xs h-4.5 bg-blue-500">
              <Layers className="w-2.5 h-2.5" />
              {selectedBlockLabel || (selectedWardNo && selectedWardNo[0]) || wardId}
              <div className="cursor-pointer hover:bg-black/20 rounded-full p-0.5" onClick={() => { setSelectedWard([]); setSelectedBlock([]); }}><X className="w-2.5 h-2.5" /></div>
            </Badge>
          ))}

          {selectedBlock.filter(b => b && b !== 'all').map((blockId: string) => {
            const blockList = useCouncilBoundaryStore.getState().blocks as Array<{ id: string | number; label?: string }> | undefined;
            const blockObj = blockList?.find((b) => String(b.id) === String(blockId) || String(b.label) === String(blockId));
            const label = String(selectedBlockLabel || (selectedWardNo && selectedWardNo[0]) || (blockObj ? blockObj.label : blockId) || '');
            return (
              <Badge key={blockId} className="flex items-center gap-1 px-1.5 py-0.5 border-none text-white rounded-md text-[8.5px] font-bold shadow-2xs h-4.5 bg-orange-500">
                <Square className="w-2.5 h-2.5" />
                {t('sidebar.ward')} {label}
                <div className="cursor-pointer hover:bg-black/20 rounded-full p-0.5" onClick={() => { setSelectedBlock([]); setSelectedWard([]); }}><X className="w-2.5 h-2.5" /></div>
              </Badge>
            );
          })}

          {selectedPropertyTypeGroup && selectedPropertyTypeGroup.toLowerCase() !== 'all' && (
            <Badge className="flex items-center gap-1 px-1.5 py-0.5 border-none text-white rounded-md text-[8.5px] font-bold shadow-2xs h-4.5 bg-pink-500">
              <Building2 className="w-2.5 h-2.5" />
              {propertyTypeGroupOptions?.find((o: { id?: string | number; value?: string | number; label: string }) => String(o.id || o.value).toUpperCase() === String(selectedPropertyTypeGroup).toUpperCase())?.label || selectedPropertyTypeGroup}
              <div className="cursor-pointer hover:bg-black/20 rounded-full p-0.5" onClick={() => setSelectedPropertyTypeGroup(null)}><X className="w-2.5 h-2.5" /></div>
            </Badge>
          )}

          {selectedPropertyTypeId && (() => {
            const matched = (propertyTypeMasterList as unknown as Array<Record<string, unknown>> | undefined)?.find(t => String(t.PropertyTypeID || t.propertyTypeID || t.id) === String(selectedPropertyTypeId));
            const typeLabel = matched
              ? String(matched.PropertyDescription || matched.propertyDescription || matched.label || matched.assetTypeName || matched.typeName || '')
              : `${t('sidebar.assetType')} ${selectedPropertyTypeId}`;
            return (
              <Badge className="flex items-center gap-1 px-1.5 py-0.5 border-none text-white rounded-md text-[8.5px] font-bold shadow-2xs h-4.5 bg-indigo-500">
                <Settings className="w-2.5 h-2.5" />
                {typeLabel || `${t('sidebar.assetType')} ${selectedPropertyTypeId}`}
                <div className="cursor-pointer hover:bg-black/20 rounded-full p-0.5" onClick={() => setSelectedPropertyTypeId(null)}><X className="w-2.5 h-2.5" /></div>
              </Badge>
            );
          })()}

          {taxStatus.length > 0 && taxStatus[0].toLowerCase() !== 'all' && (
            <Badge className="flex items-center gap-1 px-1.5 py-0.5 border-none text-white rounded-md text-[8.5px] font-bold shadow-2xs h-4.5 bg-emerald-500">
              <Activity className="w-2.5 h-2.5" />
              {taxStatus[0]}
              <div className="cursor-pointer hover:bg-black/20 rounded-full p-0.5" onClick={() => setTaxStatus(['all'])}><X className="w-2.5 h-2.5" /></div>
            </Badge>
          )}

          {assessmentSubCategory && assessmentSubCategory !== 'all' && (
            <Badge className="flex items-center gap-1 px-1.5 py-0.5 border-none text-white rounded-md text-[8.5px] font-bold shadow-2xs h-4.5 bg-purple-500">
              <Layers className="w-2.5 h-2.5" />
              {assessmentSubCategory.replace(/-/g, ' ')}
              <div className="cursor-pointer hover:bg-black/20 rounded-full p-0.5" onClick={() => setAssessmentSubCategory('all')}><X className="w-2.5 h-2.5" /></div>
            </Badge>
          )}

          {documentSubmittedStatus && documentSubmittedStatus !== 'all' && (
            <Badge className="flex items-center gap-1 px-1.5 py-0.5 border-none text-white rounded-md text-[8.5px] font-bold shadow-2xs h-4.5 bg-cyan-500">
              <ShieldCheck className="w-2.5 h-2.5" />
              {documentSubmittedStatus === 'yes' ? t('sidebar.documentSubmittedStatus') : t('sidebar.assessmentSubCategory')}
              <div className="cursor-pointer hover:bg-black/20 rounded-full p-0.5" onClick={() => { setDocumentSubmittedStatus('all'); setSelectedPropertyTypeId(null); }}><X className="w-2.5 h-2.5" /></div>
            </Badge>
          )}
        </div>
      </div>
    </motion.div>
  );
}
