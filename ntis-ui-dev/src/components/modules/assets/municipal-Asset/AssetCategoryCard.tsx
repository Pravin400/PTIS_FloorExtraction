'use client';

import { motion } from 'framer-motion';
import { BarChart3, Layers, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/common';
import { formatIndianCurrencyAbbreviated } from '@/lib/utils/asset-utils/currency-format';
import type { AssetCategoryCardProps, AssetType } from '@/types/asset/municipal-Asset/municipal-asset.types';

export function AssetCategoryCard({
  category,
  assetCount,
  totalValue,
  meta,
  theme: t,
  catTypes,
  visibleCount,
  index = 0,
  onVisibleCountChange,
  onSelectCategory,
  onSelectType,
  onSelectCategoryAssetTypes,
}: AssetCategoryCardProps) {
  const Icon = meta.icon;
  const tI18n = useTranslations('municipalAsset.categoryCard');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.1 }}
      onClick={onSelectCategory}
      className={`group relative rounded-2xl overflow-hidden shadow-md border ${t.heroBorder} bg-white flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer`}
    >
      {/* ── HERO BANNER ── */}
      {/* `heroBgLight` replaces the inline ternary that was spread across 4 lines */}
      <div className={`relative bg-gradient-to-br ${t.heroBgLight} px-4 pt-4 pb-12 overflow-hidden flex-shrink-0`}>

        <div className={`absolute inset-0 bg-gradient-to-br ${t.hero} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

        <div className="relative z-[2] flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className={`relative w-10 h-10 rounded-lg ring-2 ${t.iconRing} flex items-center justify-center shadow-lg flex-shrink-0 group-hover:scale-105 transition-transform duration-300 overflow-hidden`}>
              <div className={`absolute inset-0 ${t.dot} opacity-100 group-hover:opacity-0 transition-opacity duration-300`} />
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Icon className="relative z-10 w-5 h-5 text-white" />
            </div>

            <div className="min-w-0">
              <h3 className="text-slate-900 group-hover:text-white text-[15px] font-black leading-tight truncate transition-colors duration-300">
                {category.categoryName}
              </h3>
              <p className="text-slate-500 group-hover:text-white/90 text-[9px] mt-0.5 font-medium leading-snug line-clamp-2 transition-colors duration-300">
                {category.categoryDescription || meta.description}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end justify-center px-3 py-1.5 rounded-xl bg-white/60 backdrop-blur-md border border-white/40 shadow-sm flex-shrink-0 group-hover:bg-white/80 transition-colors duration-300">
            <span className={`text-[8px] font-bold uppercase tracking-widest ${t.statLabel} leading-tight mb-0.5`}>
              {tI18n('totalValue')}
            </span>
            <span className="text-[13px] font-black text-slate-800 leading-tight">
              {formatIndianCurrencyAbbreviated(totalValue)}
            </span>
          </div>
        </div>
      </div>

      {/* ── STAT CARD ── */}
      <div className="relative -mt-7 mx-4 z-10 flex-shrink-0">
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden p-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 w-full justify-around">
              {/* CLICKABLE TOTAL ASSET TYPES BUTTON (MATCHING IMAGE DESIGN) */}
              <button
                type="button"
                title={`${category.categoryName ?? 'Category'} - Click to view Asset Types breakdown`}
                aria-label={`View ${category.categoryName ?? 'Category'} asset types breakdown`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectCategoryAssetTypes?.(category);
                }}
                className={`group/typebtn relative flex items-center gap-3 px-3.5 py-1.5 rounded-2xl border ${
                  meta.id === 'land'
                    ? 'bg-emerald-50/90 border-emerald-400 hover:bg-emerald-100/80 hover:border-emerald-500'
                    : meta.id === 'infrastructure'
                    ? 'bg-violet-50/90 border-violet-400 hover:bg-violet-100/80 hover:border-violet-500'
                    : meta.id === 'movable'
                    ? 'bg-orange-50/90 border-orange-400 hover:bg-orange-100/80 hover:border-orange-500'
                    : 'bg-blue-50/90 border-blue-400 hover:bg-blue-100/80 hover:border-blue-500'
                } hover:shadow-xs active:scale-[0.98] transition-all duration-200 cursor-pointer select-none text-left`}
              >
                <div className="w-8 h-8 rounded-xl bg-white shadow-xs border border-white/90 flex items-center justify-center group-hover/typebtn:scale-105 transition-transform duration-200">
                  <Layers className={`w-4 h-4 ${t.statLabel}`} />
                </div>
                <div>
                  <p className={`text-[9px] font-bold uppercase tracking-wider ${t.statLabel} leading-tight mb-0.5`}>
                    {tI18n('totalAssetTypes')}
                  </p>
                  <p className={`text-2xl font-black leading-none ${t.statText}`}>
                    {catTypes.length.toLocaleString('en-IN')}
                  </p>
                </div>
              </button>

              <div className={`w-px h-10 opacity-20 ${t.statLabel} bg-current`} />

              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${t.statBg} shadow-2xs`}>
                  <BarChart3 className={`w-4 h-4 ${t.statText}`} />
                </div>
                <div>
                  <p className={`text-[9px] font-bold uppercase tracking-widest ${t.statLabel} leading-none mb-1`}>
                    {tI18n('totalRegisteredAssets')}
                  </p>
                  <p className={`text-xl font-black leading-none ${t.statText}`}>
                    {assetCount.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="flex-1 px-4 pt-3 pb-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Layers className={`w-3 h-3 ${t.statLabel}`} />
          <p className={`text-[9px] font-bold uppercase tracking-widest ${t.statLabel}`}>
            {tI18n('assetTypes')}
          </p>
          <div className={`flex-1 h-px opacity-30 ${t.accentBar}`} />
        </div>

        <div className="flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
          {catTypes.length > 0
            ? catTypes.slice(0, visibleCount).map((type: AssetType) => {
                // `type.name` is declared on AssetType — no `as any` needed
                const typeName = type.assetTypeName ?? type.typeName ?? type.name ?? 'Unknown';
                return (
                  <div
                    key={type.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectType?.(type);
                    }}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-all duration-150 ${t.chipBg} ${t.chipBorder} ${t.chipText} ${t.chipHover} hover:shadow-sm ${onSelectType ? 'cursor-pointer' : ''}`}
                  >
                    <span className={`w-1 h-1 rounded-full flex-shrink-0 ${t.dot}`} />
                    {typeName}
                  </div>
                );
              })
            : (
              <div className="text-[10px] font-medium text-slate-400 italic">{tI18n('noTypesFound')}</div>
            )}
          {catTypes.length > visibleCount && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onVisibleCountChange(catTypes.length);
              }}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-white bg-slate-800 hover:opacity-90 transition-all duration-150 shadow-sm border-0"
            >
              {tI18n('showMore', { count: catTypes.length - visibleCount })}
            </Button>
          )}
        </div>

        <div className="flex items-center justify-between mt-auto pt-1" onClick={(e) => e.stopPropagation()}>
          {visibleCount > 5 && catTypes.length > 5 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onVisibleCountChange(5);
              }}
              className={`inline-flex items-center gap-1 text-[10px] font-bold ${t.statLabel} hover:underline p-0 h-auto border-0`}
            >
              {tI18n('showLess')}
            </Button>
          ) : (
            <span />
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onSelectCategory}
            className={`inline-flex items-center gap-1 text-[10px] font-bold ${t.statLabel} hover:underline ml-auto p-0 h-auto border-0`}
          >
            {tI18n('viewAllAssets')} <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
