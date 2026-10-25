'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Info, HelpCircle, Layers, X, Sparkles, Search, Check, RotateCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button, Input } from '@/components/common';
import { useCouncilBoundaryStore } from '@/hooks/store/useCouncilBoundaryStore';
import { MUNICIPAL_ASSET_TYPE_COLORS } from '@/hooks/asset-gis-map';

// Sorted order for municipal asset types according to MPMS sequence
const ORDERED_ASSET_TYPE_IDS = [
  '36', // MPMS1 - Shopping Complex
  '4',  // MPMS2 - Hospitals/Clinics
  '2',  // MPMS3 - Schools
  '65', // MPMS4 - Gardens & Parks
  '64', // MPMS5 - Memorials
  '49', // MPMS6 - Theatre
  '12', // MPMS7 - Residence
  '61', // MPMS8 - Crematoriums
  '66', // MPMS9 - Toilets
  '16', // MPMS10 - Offices & Bldgs
  '59', // MPMS11 - Open Spaces
  '60', // MPMS12 - Water Tanks
  '11', // MPMS13 - Temples
  '20', // MPMS14 - Other Assets
  '33', // MPMS15 - Animal Pounds
];

const PROPERTY_TAX_LEGEND = [
  { label: 'Assessed Property', marathiLabel: 'कर आकारणी झालेली', color: '#22C55E' },
  { label: 'Unassessed Property', marathiLabel: 'कर आकारणी न झालेली', color: '#EF4444' },
  { label: 'Under Construction', marathiLabel: 'चालू बांधकाम', color: '#0EA5E9' },
  { label: 'Government Property', marathiLabel: 'शासकीय मालमत्ता', color: '#6366F1' },
  { label: 'Survey / Field Verified', marathiLabel: 'सर्वेक्षण झालेली', color: '#EAB308' },
  { label: 'Geo-Sequencing / Numbering', marathiLabel: 'नंबरिंग / जिओ क्रमवारी', color: '#F97316' },
  { label: 'In Process', marathiLabel: 'प्रक्रियेत असलेली', color: '#1E170C' },
  { label: 'Unlinked Footprints', marathiLabel: 'असंलग्न फुटप्रिंट', color: '#333336' },
];

export function MapLegend() {
  const t = useTranslations('assetGis');
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const activeModule = useCouncilBoundaryStore((state) => state.activeModule);
  const selectedPropertyTypeId = useCouncilBoundaryStore((state) => state.selectedPropertyTypeId);
  const setSelectedPropertyTypeId = useCouncilBoundaryStore((state) => state.setSelectedPropertyTypeId);

  // Prepare Asset Types list
  const assetTypesList = useMemo(() => {
    return ORDERED_ASSET_TYPE_IDS.map((id) => {
      const item = MUNICIPAL_ASSET_TYPE_COLORS[id];
      return {
        id: Number(item.id || id),
        mpmsCode: item.mpmsCode || `MPMS${id}`,
        label: item.label,
        color: item.color,
        border: item.border || '#FFFFFF',
      };
    });
  }, []);

  // Filtered asset types based on search
  const filteredAssetTypes = useMemo(() => {
    if (!searchQuery.trim()) return assetTypesList;
    const q = searchQuery.toLowerCase().trim();
    return assetTypesList.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.mpmsCode.toLowerCase().includes(q)
    );
  }, [assetTypesList, searchQuery]);

  const handleToggleAssetType = (typeId: number) => {
    if (selectedPropertyTypeId === typeId) {
      setSelectedPropertyTypeId(null);
    } else {
      setSelectedPropertyTypeId(typeId);
    }
  };

  const isAssetMode = activeModule === 'ASSET';

  return (
    <div className="relative pointer-events-auto flex flex-col items-end gap-2">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-2xl p-3.5 w-[310px] mb-1 overflow-hidden relative"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                  <Info className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-800 leading-tight">
                    {isAssetMode ? 'Asset Type Index' : t('map.legend')}
                  </h3>
                  <span className="text-[9px] font-semibold text-slate-400">
                    {isAssetMode ? `${assetTypesList.length} Municipal Types` : 'Status Coloring'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {isAssetMode && selectedPropertyTypeId != null && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => setSelectedPropertyTypeId(null)}
                    icon={RotateCcw}
                    className="p-1 px-1.5 rounded-md bg-amber-50 text-amber-700 hover:bg-amber-100 text-[9px] font-bold flex items-center gap-0.5 transition-colors h-auto border-0"
                    title="Reset Filter"
                  >
                    <span>{t('sidebar.clearAll')}</span>
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => setIsOpen(false)}
                  icon={X}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors h-auto border-0"
                  title="Close Index"
                  aria-label="Close Index"
                />
              </div>
            </div>

            {/* Search filter for asset types */}
            {isAssetMode && (
              <div className="relative mb-2.5">
                <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  naked
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search asset type or MPMS..."
                  className="w-full bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-[10px] font-medium text-slate-700 placeholder-slate-400 rounded-lg pl-7 pr-6 py-1.5 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-400 outline-none transition-all"
                />
                {searchQuery && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => setSearchQuery('')}
                    icon={X}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 h-auto border-0 bg-transparent"
                    title="Clear search"
                    aria-label="Clear search"
                  />
                )}
              </div>
            )}

            {/* Colors list */}
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
              {isAssetMode ? (
                filteredAssetTypes.length > 0 ? (
                  filteredAssetTypes.map((item) => {
                    const isSelected = selectedPropertyTypeId === item.id;
                    return (
                      <Button
                        key={item.id}
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleAssetType(item.id)}
                        className={`w-full flex items-center justify-between gap-2 p-1.5 rounded-xl transition-all text-left group h-auto ${
                          isSelected
                            ? 'bg-blue-50 border border-blue-200 shadow-sm'
                            : 'hover:bg-slate-50 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-3.5 h-3.5 rounded-full shadow-sm ring-2 ring-white shrink-0 transition-transform group-hover:scale-110"
                            style={{ background: item.color }}
                          />
                          <div className="flex flex-col min-w-0">
                            <span
                              className={`text-[10px] leading-tight truncate ${
                                isSelected
                                  ? 'font-black text-blue-900'
                                  : 'font-bold text-slate-700 group-hover:text-slate-900'
                              }`}
                            >
                              {item.label}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[8.5px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 tracking-tight group-hover:bg-slate-200/80">
                            {item.mpmsCode}
                          </span>
                          {isSelected && <Check className="w-3 h-3 text-blue-600 shrink-0" />}
                        </div>
                      </Button>
                    );
                  })
                ) : (
                  <div className="py-4 text-center text-[10px] text-slate-400 font-medium">
                    {t('sidebar.noResultsFound')}
                  </div>
                )
              ) : (
                PROPERTY_TAX_LEGEND.map((item) => (
                  <div key={item.label} className="flex items-center gap-2.5 p-1.5 rounded-lg group">
                    <div
                      className="w-3.5 h-3.5 rounded-full shadow-sm ring-2 ring-white shrink-0 group-hover:scale-110 transition-transform"
                      style={{ background: item.color }}
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-bold text-slate-700 uppercase tracking-tight">
                        {item.label}
                      </span>
                      <span className="text-[8.5px] font-medium text-slate-400">
                        {item.marathiLabel}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer tip */}
            <div className="mt-2.5 pt-2 border-t border-slate-100">
              <div className="flex items-start gap-1.5">
                <HelpCircle className="w-3 h-3 text-blue-400 mt-0.5 shrink-0" />
                <p className="text-[8.5px] font-medium text-slate-400 leading-tight">
                  {isAssetMode
                    ? 'Click any asset type to filter map polygons. Click boundary for details.'
                    : 'Click any property polygon on the map for detailed information.'}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compact Attractive Shining Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative group overflow-hidden flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-800 text-white font-bold text-[10px] uppercase tracking-wider shadow-md shadow-blue-500/25 hover:shadow-blue-500/40 border border-blue-400/40 transition-all duration-300 pointer-events-auto"
      >
        {/* Shiny sweep animation overlay */}
        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/35 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />

        {/* Glow ring */}
        <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 opacity-0 group-hover:opacity-30 blur-sm transition-opacity duration-300" />

        <div className="relative flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-cyan-200 group-hover:rotate-12 transition-transform duration-300" />
          <span className="drop-shadow-sm font-extrabold text-white">
            {isAssetMode ? 'Asset Legend' : 'Map Legend'}
          </span>
          <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
        </div>
      </motion.button>
    </div>
  );
}
