'use client';
import type { SidebarFilterDropdownProps } from '@/types/asset-gis.types';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Check, Filter } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Input } from '@/components/common';

export type { SidebarFilterDropdownProps as FilterDropdownProps };

export function FilterDropdown({ label, icon: Icon, options, selectedValue, onSelect, isOpen, setIsOpen, searchable, placeholder, isLoading }: SidebarFilterDropdownProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const prevIsOpenRef = useRef(isOpen);
  useEffect(() => {
    if (prevIsOpenRef.current && !isOpen) {
      setSearchTerm('');
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setIsOpen]);

  const isSelected = (id: string | number) => {
    if (Array.isArray(selectedValue)) return selectedValue.includes(String(id));
    return selectedValue === id;
  };

  const getSelectedLabel = () => {
    if (!options || options.length === 0) return 'All';
    if (Array.isArray(selectedValue)) {
      if (selectedValue.length === 0) return 'All';
      const first = options.find(o => o.id === selectedValue[0]);
      return first ? (selectedValue.length > 1 ? `${first.label} (+${selectedValue.length - 1})` : first.label) : 'All';
    }
    const found = options.find(o => o.id === selectedValue);
    return found ? found.label : 'All';
  };

  const getTotalCount = () => {
    const allOpt = options.find(o => o.id === 'all');
    if (allOpt) return allOpt.count;
    return options.reduce((acc, opt) => acc + (opt.count || 0), 0);
  };

  const renderOptionIcon = (icon: unknown, active: boolean, _customColor?: string) => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    if (
      typeof icon === 'function' ||
      (typeof icon === 'object' && icon !== null && ('$$typeof' in icon || 'render' in icon))
    ) {
      const OptionIcon = icon as React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
      return <OptionIcon className="w-4 h-4" style={{ color: active ? '#3b82f6' : '#94a3b8' }} />;
    }
    return <span>{String(icon)}</span>;
  };

  const renderHeaderIcon = () => {
    if (!Icon) return null;
    if (React.isValidElement(Icon)) return Icon;
    if (
      typeof Icon === 'function' ||
      (typeof Icon === 'object' && Icon !== null && ('$$typeof' in Icon || 'render' in Icon))
    ) {
      const HeaderIcon = Icon as React.ComponentType<{ className?: string }>;
      return <HeaderIcon className="w-3 h-3" />;
    }
    return <span>{String(Icon)}</span>;
  };

  return (
    <div className="relative mb-2" ref={containerRef}>
      <label className="text-[9px] font-black uppercase tracking-[0.2em] mb-1 flex items-center gap-2 text-slate-400">
        {renderHeaderIcon()}
        {label}
      </label>

      <motion.div
        whileHover={{ scale: 1.002 }}
        whileTap={{ scale: 0.998 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer relative overflow-hidden bg-white',
          isOpen
            ? 'border-blue-500 shadow-sm shadow-blue-500/10'
            : 'border-slate-200 shadow-2xs hover:border-slate-300'
        )}
      >
        <div className="flex items-center gap-1.5 relative z-10">
          <span className="text-[12px] font-black tracking-tight text-slate-800">
            {getSelectedLabel()}
          </span>
        </div>

        <div className="flex items-center gap-2 relative z-10">
          {isLoading ? (
            <div className="w-4 h-4 rounded-full border-2 border-slate-100 border-t-blue-500 animate-spin" />
          ) : (selectedValue === 'all' || (Array.isArray(selectedValue) && selectedValue.length === 0)) ? (
            (getTotalCount() ?? 0) > 0 ? (
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-lg bg-slate-50 text-slate-400 border border-slate-100">
                {(getTotalCount() ?? 0).toLocaleString()}
              </span>
            ) : null
          ) : (
            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
          )}
          <ChevronDown
            className={cn('w-4 h-4 transition-transform duration-300 text-slate-400', isOpen && 'rotate-180')}
          />
        </div>
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/60 pointer-events-none" />
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.98 }}
            className="absolute top-full left-0 right-0 mt-2 z-[100] rounded-2xl bg-white border border-slate-200 shadow-[0_15px_40px_rgba(0,0,0,0.12)] p-1.5 overflow-hidden backdrop-blur-xl"
          >
            {searchable && (
              <div className="p-2 border-b border-slate-50 mb-1">
                <div className="relative">
                  <Input
                    naked
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={placeholder || "Search..."}
                    className="w-full pl-8 pr-3 py-2 text-xs font-bold rounded-lg bg-slate-50 border-none focus:ring-2 focus:ring-blue-500/10 outline-none transition-all"
                    autoFocus
                  />
                  <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                </div>
              </div>
            )}
            <div className="max-h-[250px] overflow-y-auto custom-scrollbar-mini p-0.5 space-y-0.5">
              {options.filter(o =>
                o.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                o.id === 'all'
              ).map((option, idx) => {
                const active = isSelected(option.id);
                return (
                  <motion.div
                    key={`filter-opt-${option.id}-${idx}`}
                    whileHover={{ x: 2 }}
                    onClick={() => {
                      onSelect(option.id);
                      setIsOpen(false);
                    }}
                    className={cn(
                      'flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all duration-150',
                      active ? 'bg-blue-50/70' : 'bg-transparent hover:bg-slate-50'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'flex items-center justify-center w-8 h-8 rounded-xl transition-all',
                        active ? 'bg-blue-100/80 text-blue-600 ring-1 ring-blue-300/40' : 'bg-slate-100 text-slate-500'
                      )}>
                        {option.icon ? (
                          renderOptionIcon(option.icon, active, option.color)
                        ) : (
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: option.color || '#cbd5e1' }} />
                        )}
                      </div>
                      <span className={cn('text-[13px] font-black tracking-tight', active ? 'text-blue-600' : 'text-slate-600')}>
                        {option.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {(option.count !== undefined && option.count !== null) && (
                        <span className={cn(
                          'text-[9px] font-black px-2 py-0.5 rounded-lg border',
                          active ? 'bg-blue-100/60 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-500 border-slate-200'
                        )}>
                          {option.count.toLocaleString()}
                        </span>
                      )}
                      {active && (
                        <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-200">
                          <Check className="w-2.5 h-2.5 text-white stroke-[4]" />
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
