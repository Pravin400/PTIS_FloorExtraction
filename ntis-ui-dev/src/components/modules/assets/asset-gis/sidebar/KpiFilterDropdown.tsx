'use client';

/**
 * KPI Filter Dropdown Component
 * Standard: Clean Architecture - UI Component
 */

import type { KpiFilterDropdownProps } from '@/types/asset-gis.types';
import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/common';

export type { KpiFilterDropdownProps };

export function KpiFilterDropdown({ label, icon: Icon, options, selectedValue, onSelect, isOpen, setIsOpen, colors }: KpiFilterDropdownProps) {
  const t = useTranslations('assetGis');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setIsOpen]);

  const selectedOption = options.find(o => o.id === (selectedValue || 'all'));

  const renderIcon = (icon: unknown, className = 'w-3.5 h-3.5', style?: React.CSSProperties) => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    if (
      typeof icon === 'function' ||
      (typeof icon === 'object' && icon !== null && ('$$typeof' in icon || 'render' in icon))
    ) {
      const IconComp = icon as React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
      return <IconComp className={className} style={style} />;
    }
    return <span>{String(icon)}</span>;
  };

  return (
    <div className="relative mt-2" ref={containerRef}>
      <Button
        type="button"
        variant="ghost"
        size="xs"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-8 flex items-center justify-between px-3 rounded-xl border border-white/40 shadow-xs transition-all active:scale-[0.98] relative overflow-hidden group bg-white/40 backdrop-blur-md cursor-pointer"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className="flex items-center gap-2 relative z-10">
          {renderIcon(Icon, 'w-3.5 h-3.5', { color: colors.accent })}
          <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: colors.text }}>
            {selectedOption?.label || label}
          </span>
        </div>
        <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-300 relative z-10', isOpen && 'rotate-180')} style={{ color: colors.accent }} />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 5, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full left-0 right-0 z-[100] bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-slate-200/50 p-1.5 overflow-hidden"
          >
            {options.map((option) => {
              const isSelected = (selectedValue || 'all') === option.id;
              const OptionIcon = option.icon || Icon;

              return (
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  key={option.id}
                  onClick={() => {
                    onSelect(option.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl transition-all group/opt h-auto border-0 ${isSelected ? 'bg-slate-100' : 'hover:bg-slate-50'}`}
                >
                  <div className="flex items-center gap-2.5">
                    <div 
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${isSelected ? 'bg-white shadow-sm' : 'bg-slate-100 group-hover/opt:bg-white'}`}
                    >
                      {renderIcon(OptionIcon, 'w-3.5 h-3.5', { color: isSelected ? colors.accent : '#64748b' })}
                    </div>
                    <div className="flex flex-col items-start text-left">
                      <span className={`text-[10px] font-black uppercase tracking-tight ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>
                        {option.label}
                      </span>
                      {option.count != null && (
                        <span className="text-[8px] font-bold text-slate-400 tabular-nums">
                          {option.count.toLocaleString()} {t('kpis.properties')}
                        </span>
                      )}
                    </div>
                  </div>
                  {isSelected && <Check className="w-3 h-3 text-blue-600" />}
                </Button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
