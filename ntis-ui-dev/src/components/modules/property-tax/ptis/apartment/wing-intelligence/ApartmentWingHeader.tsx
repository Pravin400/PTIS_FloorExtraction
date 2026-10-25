'use client';
import React from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/common';

export interface WingIntelligenceHeaderProps {
  totalWings?: number;
  isExpanded: boolean;
  onToggle: () => void;
}

export const ApartmentWingHeader: React.FC<WingIntelligenceHeaderProps> = ({ totalWings, isExpanded, onToggle }) => {
  const t = useTranslations('ptisRedesign.wingIntelligence');

  return (
    <div className="flex justify-between items-center">
      <div 
        className="flex items-center gap-1 cursor-pointer select-none group" 
        onClick={onToggle}
      >
        <h2 className="text-[13px] font-black text-slate-900 uppercase tracking-wide">
          {t('wingIntelligence') || 'WING INTELLIGENCE'}
        </h2>
        <span className="text-[11px] text-slate-500 font-bold">
          {t('clickAnyWingToLoadComparison') || '(Click any wing to load comparison)'}
        </span>
        <div className="text-slate-400 group-hover:text-slate-600 transition-colors">
          {isExpanded ? <ChevronDown size={16} strokeWidth={3} /> : <ChevronRight size={16} strokeWidth={3} />}
        </div>
      </div>

      {!isExpanded && (
        <div className="flex items-center gap-6">
          <Button
            onClick={onToggle}
            variant="outline"
            size="xs"
            className="rounded-full bg-blue-50 text-blue-500 border-blue-200 hover:bg-blue-100 font-bold px-3 py-1 h-auto text-[10px]"
          >
            {t('clickToExpand', { count: totalWings || 0 }) || `Click to Expand (${totalWings} Wings)`}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ApartmentWingHeader;
