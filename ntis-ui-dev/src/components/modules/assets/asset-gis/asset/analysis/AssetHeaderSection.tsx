import { useRef } from 'react';
import { Building2, X, Maximize2, Minimize2, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge, Button } from '@/components/common';
import type { AssetHeaderSectionProps } from '@/types/asset-gis.types';

export type { AssetHeaderSectionProps };

export function AssetHeaderSection({
  mpmsId: _mpmsId,
  owner,
  assetTypeName: _assetTypeName,
  isShoppingComplexType,
  isMainView,
  currentShopIdx,
  combinedChildAssets = [],
  unitLabelSingular = 'Unit',
  unitLabelPlural = 'Units',
  isExpanded,
  onToggleExpand,
  onClose,
  showUnitDrawer,
  onToggleUnitDrawer,
  onSelectChildAsset,
  onPrevShop,
  onNextShop,
  parentAssetId,
}: AssetHeaderSectionProps & {
  unitLabelSingular?: string;
  unitLabelPlural?: string;
  combinedChildAssets?: Array<Record<string, unknown>>;
  showUnitDrawer?: boolean;
  onToggleUnitDrawer?: () => void;
  parentAssetId?: string | number;
}) {
  const t = useTranslations('assetGis');
  const navScrollRef = useRef<HTMLDivElement>(null);
  const hasChildUnits = combinedChildAssets.length > 0;

  const scrollNav = (direction: 'left' | 'right') => {
    if (navScrollRef.current) {
      navScrollRef.current.scrollBy({
        left: direction === 'left' ? -160 : 160,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="shrink-0 flex flex-col">
      {/* ── 1. HEADER SECTION (Gradient Banner) ── */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 px-3 py-2.5 text-white flex items-center justify-between shadow-md shrink-0 relative overflow-hidden">
        <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
          <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20 shrink-0 text-white shadow-inner">
            <Building2 className="w-5 h-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              {!isMainView && hasChildUnits ? (
                <Badge size="sm" className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider bg-white/20 text-white px-2 py-0.5 rounded backdrop-blur-xs border-0">
                  <span>{`${unitLabelSingular.toUpperCase()} DETAILS — ${currentShopIdx + 1} OF ${combinedChildAssets.length}`}</span>
                  {onPrevShop && onNextShop && (
                    <span className="inline-flex items-center gap-0.5 ml-1 pl-1 border-l border-white/30">
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPrevShop();
                        }}
                        icon={ChevronLeft}
                        className="p-0.5 hover:bg-white/30 rounded text-white transition-colors cursor-pointer h-auto border-0"
                        title="Previous Unit"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNextShop();
                        }}
                        icon={ChevronRight}
                        className="p-0.5 hover:bg-white/30 rounded text-white transition-colors cursor-pointer h-auto border-0"
                        title="Next Unit"
                      />
                    </span>
                  )}
                </Badge>
              ) : (
                <Badge size="sm" className="inline-block text-[9px] font-black uppercase tracking-wider bg-white/20 text-white px-2 py-0.5 rounded backdrop-blur-xs border-0">
                  {t('details.assetDetails') || 'ASSET DETAILS'}
                </Badge>
              )}
            </div>

            <h3
              className={`text-sm font-black text-white uppercase leading-tight mt-0.5 ${
                isExpanded ? 'whitespace-normal break-words max-w-full' : 'truncate max-w-[210px] sm:max-w-[260px]'
              }`}
              title={owner}
            >
              {owner}
            </h3>
          </div>
        </div>

        {/* Action Controls: Expand / Minimize & Close */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={onToggleExpand}
            icon={isExpanded ? Minimize2 : Maximize2}
            className="w-7 h-7 shrink-0 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center transition-all text-white backdrop-blur-sm shadow-inner cursor-pointer h-auto border-0 p-0"
            title={isExpanded ? 'Collapse View' : 'Expand View'}
          />

          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={onClose}
            icon={X}
            className="w-7 h-7 shrink-0 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center transition-all text-white backdrop-blur-sm shadow-inner cursor-pointer h-auto border-0 p-0"
            title="Close Panel"
          />
        </div>
      </div>

      {/* ── 2. MULTI-UNIT HORIZONTAL NAVIGATION TAB BAR WITH SIDE TOGGLE ARROWS ── */}
      {hasChildUnits && (
        <div className="relative flex items-center bg-indigo-50/80 border-b border-indigo-100/90 shrink-0 z-[90] px-1 py-1">
          {/* Left Side Scroll Arrow */}
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => scrollNav('left')}
            icon={ChevronLeft}
            className="w-5 h-6 shrink-0 flex items-center justify-center text-slate-500 hover:text-indigo-700 hover:bg-indigo-100/60 rounded transition-colors cursor-pointer h-auto border-0 p-0"
            title="Scroll Left"
          />

          {/* Scrollable Container */}
          <div
            ref={navScrollRef}
            className="flex items-center gap-1 overflow-x-auto px-1 py-0.5 custom-scrollbar flex-1 scroll-smooth"
          >
            {/* Main Unit Count Trigger Button */}
            {onToggleUnitDrawer && (
              <Button
                type="button"
                variant="primary"
                size="xs"
                onClick={onToggleUnitDrawer}
                icon={Users}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[9.5px] font-black uppercase tracking-wider shrink-0 transition-all cursor-pointer shadow-xs border-0 ${
                  showUnitDrawer
                    ? 'bg-indigo-700 text-white shadow-indigo-300 ring-2 ring-indigo-400'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
                title={`Open ${unitLabelSingular} Selector Drawer`}
              >
                <span>{combinedChildAssets.length} {unitLabelPlural.toUpperCase()}</span>
              </Button>
            )}

            {/* Main Complex / Parent Pill */}
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => {
                if (!isMainView && onSelectChildAsset && parentAssetId) {
                  onSelectChildAsset(parentAssetId);
                }
              }}
              className={`shrink-0 px-2.5 py-1 rounded-md text-[9.5px] font-bold transition-all duration-200 cursor-pointer flex items-center gap-1 h-auto ${
                isMainView
                  ? 'bg-blue-600 text-white shadow-sm font-black hover:bg-blue-700 border-0'
                  : 'bg-white text-blue-700 border border-blue-200/90 hover:bg-blue-50'
              }`}
            >
              <span>{isShoppingComplexType ? '🏢 Main' : '🏛️ Main'}</span>
            </Button>

            {/* Individual Unit Pills */}
            {combinedChildAssets.map((unit: Record<string, unknown>, idx: number) => {
              const uId = Number(unit.assetId ?? unit.AssetId ?? unit.id ?? unit.Id);
              const uCode = (unit.assetNo || unit.mpmsNo || unit.unitNo || unit.code || unit.subUnitCode || `${unitLabelSingular}-${idx + 1}`) as string;
              const uName = (unit.assetName || unit.name || unit.subUnitName || unit.unitName || `${unitLabelSingular} ${idx + 1}`) as string;
              const isSelected = currentShopIdx === idx;

              return (
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  key={uId || uCode || idx}
                  onClick={() => {
                    if (onSelectChildAsset && !isSelected) {
                      onSelectChildAsset(uId || uCode);
                    }
                  }}
                  className={`shrink-0 px-2 py-1 rounded-md text-[9.5px] font-bold transition-all duration-200 cursor-pointer flex items-center gap-1 h-auto ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-sm font-black hover:bg-indigo-700 border-0'
                      : 'bg-white text-slate-700 border border-slate-200/90 hover:bg-indigo-50/50 hover:text-indigo-700'
                  }`}
                  title={`${uCode}: ${uName}`}
                >
                  <span>📁 {uName}</span>
                </Button>
              );
            })}
          </div>

          {/* Right Side Scroll Arrow */}
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => scrollNav('right')}
            icon={ChevronRight}
            className="w-5 h-6 shrink-0 flex items-center justify-center text-slate-500 hover:text-indigo-700 hover:bg-indigo-100/60 rounded transition-colors cursor-pointer h-auto border-0 p-0"
            title="Scroll Right"
          />
        </div>
      )}
    </div>
  );
}
