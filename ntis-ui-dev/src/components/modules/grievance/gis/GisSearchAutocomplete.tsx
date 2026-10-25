'use client';

/**
 * Autocomplete Search Component for Grievance GIS Application Numbers.
 * Standard: Clean Architecture / ntis-ui
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

export interface GrievanceSummaryItem {
  id: number;
  grievanceNo: string;
  citizenName?: string;
  departmentName?: string;
  currentStateName?: string;
  isResolved?: boolean;
}

interface GisSearchAutocompleteProps {
  placeholder?: string;
  value?: string;
  onChange: (value: string | undefined) => void;
  grievances?: GrievanceSummaryItem[];
  onSelectGrievance?: (grievanceId: number) => void;
}

export function GisSearchAutocomplete({
  placeholder = 'Search Application No...',
  value,
  onChange,
  grievances = [],
  onSelectGrievance,
}: GisSearchAutocompleteProps) {
  const t = useTranslations('grievance');
  const [searchQuery, setSearchQuery] = useState(value || '');
  const [prevValue, setPrevValue] = useState(value);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  if (value !== prevValue) {
    setPrevValue(value);
    setSearchQuery(value || '');
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const matchingGrievances = useMemo(() => {
    if (!searchQuery.trim() || grievances.length === 0) return [];
    const term = searchQuery.trim().toLowerCase();
    return grievances
      .filter(
        (g) =>
          g.grievanceNo?.toLowerCase().includes(term) ||
          g.citizenName?.toLowerCase().includes(term) ||
          g.departmentName?.toLowerCase().includes(term)
      )
      .slice(0, 8);
  }, [searchQuery, grievances]);

  const handleSelect = (item: GrievanceSummaryItem) => {
    setSearchQuery(item.grievanceNo);
    setShowSuggestions(false);
    onChange(item.grievanceNo);
    onSelectGrievance?.(item.id);
  };

  const handleClear = () => {
    setSearchQuery('');
    setShowSuggestions(false);
    onChange(undefined);
  };

  return (
    <div ref={containerRef} className="relative z-50 min-w-[170px] max-w-[240px] flex-1">
      <div className="relative flex items-center">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onChange(searchQuery.trim() || undefined);
              setShowSuggestions(false);
            }
          }}
          placeholder={placeholder}
          className="w-full text-xs font-medium bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl pl-8 pr-7 py-1.5 text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 p-0.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            title="Clear search"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {showSuggestions && matchingGrievances.length > 0 && (
        <div className="absolute top-full left-0 min-w-[260px] w-full sm:w-80 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden z-50 max-h-64 overflow-y-auto custom-scrollbar ring-1 ring-slate-900/5">
          <div className="p-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100">
            {t('gisApplicationsCount', { count: matchingGrievances.length })}
          </div>
          {matchingGrievances.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item)}
              className="w-full text-left px-3 py-2 hover:bg-emerald-50/60 transition-colors border-b border-slate-50 last:border-b-0 cursor-pointer flex flex-col gap-0.5"
            >
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-xs font-bold text-slate-800 truncate">
                  {item.grievanceNo}
                </span>
                {item.currentStateName && (
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                      item.isResolved || item.currentStateName.toLowerCase().includes('resolved')
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {item.currentStateName}
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-500 truncate">
                {item.citizenName ? `${item.citizenName} • ` : ''}
                {item.departmentName || 'General'}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
