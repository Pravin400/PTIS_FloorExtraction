'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { Cpu, FileText, Percent, History, TrendingUp, Layers } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PtisTaxMode } from '@/types/property-tax/apartment';

export type WingIntelligenceTopNavSection = 'wing' | 'building' | 'discount' | 'oldDetails';

export interface WingIntelligenceTopNavProps {
  activeSection: WingIntelligenceTopNavSection | null;
  onToggleSection: (section: WingIntelligenceTopNavSection) => void;
  taxMode?: PtisTaxMode;
  onTaxModeChange?: (mode: PtisTaxMode) => void;
}

export const ApartmentWingTopNav: React.FC<WingIntelligenceTopNavProps> = ({
  activeSection,
  onToggleSection,
  taxMode = 'rateable',
  onTaxModeChange,
}) => {
  const [valuationView, setValuationView] = useState<'rv' | 'cvm' | 'dual'>(
    taxMode === 'capital' ? 'cvm' : taxMode === 'dual' ? 'dual' : 'rv'
  );

  const [prevTaxMode, setPrevTaxMode] = useState(taxMode);
  if (taxMode !== prevTaxMode) {
    setPrevTaxMode(taxMode);
    setValuationView(taxMode === 'capital' ? 'cvm' : taxMode === 'dual' ? 'dual' : 'rv');
  }

  const tQDE = useTranslations('quickDataEntry');
  const tWing = useTranslations('ptisRedesign.wingIntelligence');
  const tValuation = useTranslations('ptisRedesign.wingIntelligence.valuation');

  const handleValuationChange = (mode: 'rv' | 'cvm' | 'dual') => {
    setValuationView(mode);
    if (mode === 'cvm') {
      onTaxModeChange?.('capital');
    } else if (mode === 'dual') {
      onTaxModeChange?.('dual');
    } else {
      onTaxModeChange?.('rateable');
    }
  };

  const getButtonStyle = (isActive: boolean) =>
    cn(
      'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs select-none',
      isActive
        ? 'bg-white text-[#0047cc] border-2 border-[#0047cc] hover:bg-blue-50/50'
        : 'bg-[#0047cc] text-white border-2 border-[#0047cc] hover:bg-blue-800 active:bg-blue-900'
    );

  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-2 mb-2 w-full flex-wrap">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => onToggleSection('wing')}
          className={getButtonStyle(activeSection === 'wing')}
        >
          <Cpu
            className={cn(
              'w-3.5 h-3.5',
              activeSection === 'wing' ? 'text-[#0047cc]' : 'text-white'
            )}
          />
          <span>{tWing('wingIntelligence') || 'Wing Intelligence'}</span>
        </button>

        <button
          type="button"
          onClick={() => onToggleSection('building')}
          className={getButtonStyle(activeSection === 'building')}
        >
          <FileText
            className={cn(
              'w-3.5 h-3.5',
              activeSection === 'building' ? 'text-[#0047cc]' : 'text-white'
            )}
          />
          <span>{tQDE('tabs.BuildingPermission') || 'Building Permission'}</span>
        </button>

        <button
          type="button"
          onClick={() => onToggleSection('discount')}
          className={getButtonStyle(activeSection === 'discount')}
        >
          <Percent
            className={cn(
              'w-3.5 h-3.5',
              activeSection === 'discount' ? 'text-[#0047cc]' : 'text-white'
            )}
          />
          <span>{tQDE('tabs.Discount') || 'Discount & Social Data'}</span>
        </button>

        <button
          type="button"
          onClick={() => onToggleSection('oldDetails')}
          className={getButtonStyle(activeSection === 'oldDetails')}
        >
          <History
            className={cn(
              'w-3.5 h-3.5',
              activeSection === 'oldDetails' ? 'text-[#0047cc]' : 'text-white'
            )}
          />
          <span>{tQDE('tabs.OldDetails') || 'Old Details'}</span>
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap ml-auto">
        <button
          type="button"
          onClick={() => handleValuationChange('rv')}
          className={getButtonStyle(valuationView === 'rv')}
        >
          <FileText
            className={cn('w-3.5 h-3.5', valuationView === 'rv' ? 'text-[#0047cc]' : 'text-white')}
          />
          <span>{tValuation('rv')}</span>
        </button>
        <button
          type="button"
          onClick={() => handleValuationChange('cvm')}
          className={getButtonStyle(valuationView === 'cvm')}
        >
          <TrendingUp
            className={cn('w-3.5 h-3.5', valuationView === 'cvm' ? 'text-[#0047cc]' : 'text-white')}
          />
          <span>{tValuation('cvm')}</span>
        </button>
        <button
          type="button"
          onClick={() => handleValuationChange('dual')}
          className={getButtonStyle(valuationView === 'dual')}
        >
          <Layers
            className={cn(
              'w-3.5 h-3.5',
              valuationView === 'dual' ? 'text-[#0047cc]' : 'text-white'
            )}
          />
          <span>{tValuation('dual')}</span>
        </button>
      </div>
    </div>
  );
};

export default ApartmentWingTopNav;
