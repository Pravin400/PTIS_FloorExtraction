'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Percent, Building2, Home, Store, Layers, ChevronDown, ChevronRight, Pencil, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { DiscountSubTab, LevelCounts } from './types';

export interface DiscountHeaderProps {
  activeSubTab: DiscountSubTab;
  onSubTabChange: (tab: DiscountSubTab) => void;
  discountCount: number;
  socialCount: number;
  selectedLevel: string;
  onLevelSelect: (level: string) => void;
  levelCounts: LevelCounts;
  isApartmentScreen: boolean;
  hasSocDetail: boolean;
  hasWingDetail: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  isEditing?: boolean;
}

export const DiscountHeader: React.FC<DiscountHeaderProps> = ({
  activeSubTab, onSubTabChange, discountCount, socialCount, selectedLevel, onLevelSelect,
  levelCounts, isApartmentScreen, hasSocDetail, hasWingDetail, isExpanded, onToggleExpand,
  onEdit, isEditing,
}) => {
  const t = useTranslations('ptis');
  const tPanels = useTranslations('ptisRedesign.panels');
  const tRedesign = useTranslations('ptisRedesign');

  const renderScopeButton = (key: string, label: string, count: number, Icon: React.ComponentType<{ className?: string }>) => {
    const isActive = selectedLevel.toLowerCase() === key.toLowerCase();
    return (
      <button
        key={key}
        type="button"
        onClick={() => onLevelSelect(key)}
        className={cn(
          'flex items-center gap-1.5 transition-all cursor-pointer select-none rounded-md px-2.5 py-1 text-xs',
          isActive ? 'bg-blue-600 text-white font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-medium'
        )}
      >
        <Icon className={cn('w-3 h-3 shrink-0', isActive ? 'text-white' : 'text-slate-400')} />
        <span>{label}</span>
        <span className={cn('ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-medium leading-tight', isActive ? 'bg-white/20 text-white' : 'bg-slate-200/90 text-slate-700')}>
          {count}
        </span>
      </button>
    );
  };

  return (
    <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl px-3 py-1.5 mb-2 flex items-center justify-between gap-2 flex-wrap">
      {/* Left: Section Title with Expand/Collapse Trigger */}
      <div
        className="flex items-center gap-2 select-none cursor-pointer group"
        onClick={onToggleExpand}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggleExpand(); } }}
        aria-expanded={isExpanded}
      >
        <Percent className="w-4 h-4 text-blue-700 shrink-0" />
        <h2 className="text-xs sm:text-[13px] font-black text-blue-950 uppercase tracking-wide select-none">
          {tPanels('discount') || 'DISCOUNT & SOCIAL DATA (Discounts & Concessions)'}
        </h2>
        <div className="text-slate-400 group-hover:text-slate-600 transition-colors">
          {isExpanded ? <ChevronDown size={15} strokeWidth={2.5} /> : <ChevronRight size={15} strokeWidth={2.5} />}
        </div>
      </div>

      {/* Right: Sub-Tabs & Scope Pills & Edit Button */}
      <div className="flex items-center gap-2 flex-wrap ml-auto">
        {/* Sub-Tabs: Discount vs Social */}
        <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => onSubTabChange('discount')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1 text-xs rounded-md transition-all cursor-pointer font-bold',
              activeSubTab === 'discount' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            )}
          >
            <Percent className="w-3 h-3 shrink-0" />
            <span>{t('tabs.discount') || 'Discount Data'}</span>
            <span className={cn('ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold', activeSubTab === 'discount' ? 'bg-white/20 text-white' : 'bg-slate-300 text-slate-700')}>
              {discountCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSubTabChange('social')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1 text-xs rounded-md transition-all cursor-pointer font-bold',
              activeSubTab === 'social' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            )}
          >
            <Building2 className="w-3 h-3 shrink-0" />
            <span>{t('tabs.social') || 'Social Data'}</span>
            <span className={cn('ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold', activeSubTab === 'social' ? 'bg-white/20 text-white' : 'bg-slate-300 text-slate-700')}>
              {socialCount}
            </span>
          </button>
        </div>

        {/* Scope Level Pills */}
        {isApartmentScreen && (
          <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-lg">
            {renderScopeButton('All', tRedesign('buildingPermission.levels.all') || t('tabs.all') || 'All', levelCounts.all, Layers)}
            {(hasSocDetail || levelCounts.apartment > 0) &&
              renderScopeButton('Apartment', tRedesign('buildingPermission.levels.apartment') || 'Apartment Level', levelCounts.apartment, Building2)}
            {(hasWingDetail || levelCounts.wing > 0 || hasSocDetail) &&
              renderScopeButton('Wing', tRedesign('buildingPermission.levels.wing') || 'Wing Level', levelCounts.wing, Home)}
            {renderScopeButton('Unit', tRedesign('buildingPermission.levels.unit') || 'Unit Level', levelCounts.unit, Store)}
          </div>
        )}

        {/* Edit Button */}
        <button
          type="button"
          onClick={onEdit}
          disabled={isEditing}
          className={cn(
            'px-2.5 py-1 rounded-md text-xs font-medium border transition-all flex items-center gap-1 shadow-2xs shrink-0',
            isEditing
              ? 'bg-amber-500 text-white border-amber-500 cursor-wait'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 cursor-pointer'
          )}
          title={t('actions.edit') || 'Edit'}
          aria-label={t('actions.edit') || 'Edit'}
        >
          {isEditing ? <Loader2 className="w-3 h-3 text-white animate-spin shrink-0" /> : <Pencil className="w-3 h-3 text-slate-400 group-hover:text-amber-600 shrink-0" />}
          <span>{isEditing ? (t('building.editing') || 'Opening...') : (t('actions.edit') || 'Edit')}</span>
        </button>
      </div>
    </div>
  );
};
