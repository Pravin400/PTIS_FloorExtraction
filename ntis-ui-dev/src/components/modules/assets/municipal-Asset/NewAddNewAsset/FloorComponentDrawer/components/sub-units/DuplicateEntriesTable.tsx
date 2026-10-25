'use client';
import type { DuplicateEntriesTableProps, SortKey } from "@/types/asset/municipal-Asset/new-add-new-asset";
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  Pencil,
  Trash2,
  Building2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { fetchSubUseTypesAction } from '@/app/[locale]/assets/municipal-Asset/new-add-new-asset/floor-details/actions';





export function DuplicateEntriesTable({
  entries,
  onEdit,
  onDelete,
  conTypeLabelMap: externalConTypeMap,
  dropdownOptions,
  dynamicSubUseTypes,
  editingEntryId,
  isUnitRenter,
}: DuplicateEntriesTableProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Sorting state
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Dynamic fetched sub-use types cache (value -> label)
  const [fetchedSubUseMap, setFetchedSubUseMap] = useState<Map<string, string>>(new Map());

  // Automatically fetch sub-use types for entries that have a subUseType ID without human readable name
  useEffect(() => {
    let isCancelled = false;
    const missingSubUseEntries = entries.filter((e) => {
      const subId = e.subUseType || e.formDataSnapshot?.subUseType;
      if (!subId || subId === '—' || subId === '') return false;
      if (e.subTypeOfUseName && isNaN(Number(e.subTypeOfUseName))) return false;
      if (fetchedSubUseMap.has(String(subId))) return false;
      return true;
    });

    if (missingSubUseEntries.length > 0) {
      const useTypeIds = Array.from(
        new Set(
          missingSubUseEntries
            .map((e) => {
              const u = e.useType || e.formDataSnapshot?.useType;
              if (!u) return 0;
              let num = Number(u);
              if (isNaN(num) || num <= 0) {
                const opt = ((dropdownOptions?.useTypes || []) as Array<{ label?: string | number; value?: string | number }>).find(
                  (o) =>
                    String(o.value) === String(u) ||
                    String(o.label).toLowerCase() === String(u).toLowerCase()
                );
                num = opt ? Number(opt.value) : 0;
              }
              return num;
            })
            .filter((n) => n > 0)
        )
      );

      const fetchPromises =
        useTypeIds.length > 0
          ? useTypeIds.map((id) => fetchSubUseTypesAction(id))
          : [fetchSubUseTypesAction()];

      Promise.all(fetchPromises)
        .then((results) => {
          if (isCancelled) return;
          setFetchedSubUseMap((prev) => {
            const next = new Map(prev);
            for (const res of results) {
              if (res.success && Array.isArray(res.data)) {
                for (const item of res.data) {
                  if (item.value && item.label) {
                    next.set(String(item.value), item.label);
                  }
                }
              }
            }
            return next;
          });
        })
        .catch((err) => {
          console.warn('Failed to fetch sub-use types for table display', err);
        });
    }

    return () => {
      isCancelled = true;
    };
  }, [entries, dropdownOptions, fetchedSubUseMap]);

  // Derive label maps from dropdownOptions and fetched data
  const conTypeLabelMap = useMemo(() => {
    if (externalConTypeMap && externalConTypeMap.size > 0) return externalConTypeMap;
    const map = new Map<string, string>();
    (dropdownOptions?.constructionTypes || []).forEach((o) => {
      if (o.value !== undefined) map.set(String(o.value), String(o.label ?? ''));
    });
    return map;
  }, [externalConTypeMap, dropdownOptions]);

  const useTypeLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    (dropdownOptions?.useTypes || []).forEach((o) => {
      if (o.value !== undefined) map.set(String(o.value), String(o.label ?? ''));
    });
    return map;
  }, [dropdownOptions]);

  const subUseTypeLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    (dropdownOptions?.subUseTypes || []).forEach((o) => {
      if (o.value !== undefined) map.set(String(o.value), String(o.label ?? ''));
    });
    (dynamicSubUseTypes || []).forEach((o) => {
      if (o.value !== undefined) map.set(String(o.value), String(o.label ?? ''));
    });
    fetchedSubUseMap.forEach((label, val) => {
      map.set(val, label);
    });
    return map;
  }, [dropdownOptions, dynamicSubUseTypes, fetchedSubUseMap]);

  // Unit-wide rule: If unit is rented or ANY floor entry has Renter YES, then YES applies for all floors
  const isAnyFloorRented = useMemo(() => {
    return (
      Boolean(isUnitRenter) ||
      entries.some((e) => Boolean(e.isRenter ?? e.formDataSnapshot?.isRenter))
    );
  }, [entries, isUnitRenter]);

  // Check scroll position
  const updateScrollState = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = scrollContainerRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [entries, updateScrollState]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 300;
    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      if (sortDir === 'asc') {
        setSortDir('desc');
      } else {
        setSortKey(null);
        setSortDir('asc');
      }
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  // Sorted entries
  const sortedEntries = useMemo(() => {
    if (!sortKey) return entries;

    const list = [...entries];
    list.sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      switch (sortKey) {
        case 'floor':
          valA = a.floorLabel || '';
          valB = b.floorLabel || '';
          break;
        case 'subFloor':
          valA = a.subFloorName || '';
          valB = b.subFloorName || '';
          break;
        case 'conYear':
          valA = Number(a.conYear) || 0;
          valB = Number(b.conYear) || 0;
          break;
        case 'asstYear':
          valA = a.asstYear || a.formDataSnapshot?.asstYear || '';
          valB = b.asstYear || b.formDataSnapshot?.asstYear || '';
          break;
        case 'conType':
          valA = conTypeLabelMap.get(String(a.conType)) || a.conType || '';
          valB = conTypeLabelMap.get(String(b.conType)) || b.conType || '';
          break;
        case 'useType':
          valA = useTypeLabelMap.get(String(a.useType || a.formDataSnapshot?.useType)) || a.useType || '';
          valB = useTypeLabelMap.get(String(b.useType || b.formDataSnapshot?.useType)) || b.useType || '';
          break;
        case 'subUseType': {
          const nameA =
            (a.subTypeOfUseName && isNaN(Number(a.subTypeOfUseName)) ? a.subTypeOfUseName : '') ||
            subUseTypeLabelMap.get(String(a.subUseType || a.formDataSnapshot?.subUseType)) ||
            (a.subUseType && isNaN(Number(a.subUseType)) ? String(a.subUseType) : '');
          const nameB =
            (b.subTypeOfUseName && isNaN(Number(b.subTypeOfUseName)) ? b.subTypeOfUseName : '') ||
            subUseTypeLabelMap.get(String(b.subUseType || b.formDataSnapshot?.subUseType)) ||
            (b.subUseType && isNaN(Number(b.subUseType)) ? String(b.subUseType) : '');
          valA = nameA;
          valB = nameB;
          break;
        }
        case 'renter':
          valA = (isAnyFloorRented || a.isRenter || a.formDataSnapshot?.isRenter) ? 1 : 0;
          valB = (isAnyFloorRented || b.isRenter || b.formDataSnapshot?.isRenter) ? 1 : 0;
          break;
        case 'rooms':
          valA = a.noOfRooms ?? a.rooms?.length ?? 0;
          valB = b.noOfRooms ?? b.rooms?.length ?? 0;
          break;
        case 'carpet':
          valA = a.carpetAreaSqFeet || 0;
          valB = b.carpetAreaSqFeet || 0;
          break;
        case 'builtup':
          valA = a.builtupAreaSqFeet || (a.carpetAreaSqFeet ? a.carpetAreaSqFeet * 1.2 : 0);
          valB = b.builtupAreaSqFeet || (b.carpetAreaSqFeet ? b.carpetAreaSqFeet * 1.2 : 0);
          break;
      }

      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [entries, sortKey, sortDir, conTypeLabelMap, useTypeLabelMap, subUseTypeLabelMap, isAnyFloorRented]);

  if (entries.length === 0) return null;

  const renderSortIndicator = (key: SortKey) => {
    if (sortKey === key) {
      return sortDir === 'asc' ? (
        <ArrowUp className="size-2.5 shrink-0 text-amber-300 ml-1 inline-block" />
      ) : (
        <ArrowDown className="size-2.5 shrink-0 text-amber-300 ml-1 inline-block" />
      );
    }
    return <ArrowUpDown className="size-2.5 shrink-0 text-blue-200/70 ml-1 inline-block" />;
  };

  return (
    <div className="w-full max-w-full min-w-0 rounded-2xl border border-slate-200/80 bg-white p-2.5 shadow-sm mt-2 transition-all">
      {/* Top Banner / Card Title matching Floor & Construction Details */}
      <div className="flex items-center justify-between bg-gradient-to-r from-[#C8E1FC] via-[#DBEAFF] to-[#EDF5FF] border border-[#A3CBFA] rounded-xl py-1 px-2.5 mb-2.5 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-[#1d4ed8] p-1 rounded-lg text-white shadow-sm flex items-center justify-center shrink-0">
            <Building2 className="size-3.5 text-white" />
          </div>
          <span className="text-xs font-bold text-[#1d4ed8] uppercase tracking-widest">{'FLOOR & CONSTRUCTION DETAILS — ADDED ENTRIES ('}{entries.length}{')'}</span>
        </div>
        <div className="flex items-center gap-2">
          {editingEntryId && (
            <span className="text-[9px] font-black bg-amber-400 text-slate-900 px-1.5 py-0.5 rounded uppercase tracking-wider shadow-xs">{'Editing Entry'}</span>
          )}
          {/* Scroll Nav buttons in Title bar */}
          <div className="flex items-center gap-1 bg-white/90 p-0.5 rounded-md border border-[#A3CBFA] shadow-xs">
            <button
              type="button"
              onClick={() => handleScroll('left')}
              disabled={!canScrollLeft}
              title="Scroll table left"
              className={`p-0.5 rounded transition-all ${
                canScrollLeft
                  ? 'hover:bg-blue-100 text-[#1d4ed8] cursor-pointer active:scale-95'
                  : 'text-slate-300 cursor-not-allowed'
              }`}
            >
              <ChevronLeft className="size-3" />
            </button>
            <button
              type="button"
              onClick={() => handleScroll('right')}
              disabled={!canScrollRight}
              title="Scroll table right"
              className={`p-0.5 rounded transition-all ${
                canScrollRight
                  ? 'hover:bg-blue-100 text-[#1d4ed8] cursor-pointer active:scale-95'
                  : 'text-slate-300 cursor-not-allowed'
              }`}
            >
              <ChevronRight className="size-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Table Container - constrained strictly within the card */}
      <div
        ref={scrollContainerRef}
        className="w-full max-w-full overflow-x-auto overflow-y-hidden scroll-smooth scrollbar-thin scrollbar-thumb-blue-400/60 hover:scrollbar-thumb-blue-500 scrollbar-track-slate-100 rounded-xl border border-blue-900/30 overflow-hidden"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <table className="w-full text-left border-collapse min-w-[1050px]">
          {/* Table Header */}
          <thead className="bg-[#101b87]">
            <tr className="bg-[#101b87] text-white">
              {/* 1. FLOOR */}
              <th
                onClick={() => handleSort('floor')}
                className="bg-[#101b87] hover:bg-[#0c1566] text-white py-2 px-3 text-[9.5px] font-black uppercase tracking-wider whitespace-nowrap border-r border-blue-800/60 cursor-pointer select-none transition-colors"
              >
                <div className="flex items-center gap-0.5">
                  <span>FLOOR</span>
                  {renderSortIndicator('floor')}
                </div>
              </th>

              {/* 2. SUB FLOOR */}
              <th
                onClick={() => handleSort('subFloor')}
                className="bg-[#101b87] hover:bg-[#0c1566] text-white py-2 px-2.5 text-[9.5px] font-black uppercase tracking-wider whitespace-nowrap border-r border-blue-800/60 cursor-pointer select-none transition-colors"
              >
                <div className="flex items-center gap-0.5">
                  <span>{'SUB FLOOR'}</span>
                  {renderSortIndicator('subFloor')}
                </div>
              </th>

              {/* 3. CONSTRUCTION YEAR */}
              <th
                onClick={() => handleSort('conYear')}
                className="bg-[#101b87] hover:bg-[#0c1566] text-white py-2 px-2.5 text-[9.5px] font-black uppercase tracking-wider whitespace-nowrap border-r border-blue-800/60 text-center cursor-pointer select-none transition-colors"
              >
                <div className="flex items-center justify-center gap-0.5">
                  <span>{'CONSTRUCTION YEAR'}</span>
                  {renderSortIndicator('conYear')}
                </div>
              </th>

              {/* 4. ASSESSMENT */}
              <th
                onClick={() => handleSort('asstYear')}
                className="bg-[#101b87] hover:bg-[#0c1566] text-white py-2 px-2.5 text-[9.5px] font-black uppercase tracking-wider whitespace-nowrap border-r border-blue-800/60 text-center cursor-pointer select-none transition-colors"
              >
                <div className="flex items-center justify-center gap-0.5">
                  <span>ASSESSMENT</span>
                  {renderSortIndicator('asstYear')}
                </div>
              </th>

              {/* 5. CONSTRUCTION TYPE */}
              <th
                onClick={() => handleSort('conType')}
                className="bg-[#101b87] hover:bg-[#0c1566] text-white py-2 px-3 text-[9.5px] font-black uppercase tracking-wider whitespace-nowrap border-r border-blue-800/60 cursor-pointer select-none transition-colors"
              >
                <div className="flex items-center gap-0.5">
                  <span>{'CONSTRUCTION TYPE'}</span>
                  {renderSortIndicator('conType')}
                </div>
              </th>

              {/* 6. USE */}
              <th
                onClick={() => handleSort('useType')}
                className="bg-[#101b87] hover:bg-[#0c1566] text-white py-2 px-3 text-[9.5px] font-black uppercase tracking-wider whitespace-nowrap border-r border-blue-800/60 cursor-pointer select-none transition-colors"
              >
                <div className="flex items-center gap-0.5">
                  <span>USE</span>
                  {renderSortIndicator('useType')}
                </div>
              </th>

              {/* 7. SUB TYPE OF USE */}
              <th
                onClick={() => handleSort('subUseType')}
                className="bg-[#101b87] hover:bg-[#0c1566] text-white py-2 px-3 text-[9.5px] font-black uppercase tracking-wider whitespace-nowrap border-r border-blue-800/60 cursor-pointer select-none transition-colors"
              >
                <div className="flex items-center gap-0.5">
                  <span>{'SUB TYPE OF USE'}</span>
                  {renderSortIndicator('subUseType')}
                </div>
              </th>

              {/* 8. RENTER */}
              <th
                onClick={() => handleSort('renter')}
                className="bg-[#101b87] hover:bg-[#0c1566] text-white py-2 px-2.5 text-[9.5px] font-black uppercase tracking-wider whitespace-nowrap border-r border-blue-800/60 text-center cursor-pointer select-none transition-colors"
              >
                <div className="flex items-center justify-center gap-0.5">
                  <span>RENTER</span>
                  {renderSortIndicator('renter')}
                </div>
              </th>

              {/* 9. ROOMS */}
              <th
                onClick={() => handleSort('rooms')}
                className="bg-[#101b87] hover:bg-[#0c1566] text-white py-2 px-2.5 text-[9.5px] font-black uppercase tracking-wider whitespace-nowrap border-r border-blue-800/60 text-center cursor-pointer select-none transition-colors"
              >
                <div className="flex items-center justify-center gap-0.5">
                  <span>ROOMS</span>
                  {renderSortIndicator('rooms')}
                </div>
              </th>

              {/* 10. CARPET AREA(FT/M) */}
              <th
                onClick={() => handleSort('carpet')}
                className="bg-[#101b87] hover:bg-[#0c1566] text-white py-2 px-3 text-[9.5px] font-black uppercase tracking-wider whitespace-nowrap border-r border-blue-800/60 text-center cursor-pointer select-none transition-colors"
              >
                <div className="flex items-center justify-center gap-0.5">
                  <span>{'CARPET AREA(FT/M)'}</span>
                  {renderSortIndicator('carpet')}
                </div>
              </th>

              {/* 11. BUILTUP AREA(FT/M) */}
              <th
                onClick={() => handleSort('builtup')}
                className="bg-[#101b87] hover:bg-[#0c1566] text-white py-2 px-3 text-[9.5px] font-black uppercase tracking-wider whitespace-nowrap border-r border-blue-800/60 text-center cursor-pointer select-none transition-colors"
              >
                <div className="flex items-center justify-center gap-0.5">
                  <span>{'BUILTUP AREA(FT/M)'}</span>
                  {renderSortIndicator('builtup')}
                </div>
              </th>

              {/* 12. ACTIONS with quick scroll chevron */}
              <th className="bg-[#101b87] text-white py-2 px-3 text-[9.5px] font-black uppercase tracking-wider whitespace-nowrap text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <span>ACTIONS</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleScroll(canScrollRight ? 'right' : 'left');
                    }}
                    title={canScrollRight ? 'Scroll Right' : 'Scroll Left'}
                    className="p-1 rounded bg-[#2031a0] hover:bg-[#2b3fc2] active:bg-[#18267d] border border-blue-400/30 text-white cursor-pointer shadow-xs transition-colors"
                  >
                    {canScrollRight ? (
                      <ChevronRight className="size-2.5" />
                    ) : (
                      <ChevronLeft className="size-2.5" />
                    )}
                  </button>
                </div>
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-blue-100/70 text-[10px]">
            {sortedEntries.map((entry) => {
              const isEditing = editingEntryId === entry.entryId;

              // Floor display
              const displayFloor = entry.floorLabel || '—';

              // Sub-Floor display
              const displaySubFloor =
                entry.subFloorName && entry.subFloorName !== '—' && entry.subFloorName !== 'null'
                  ? entry.subFloorName
                  : entry.subFloorId && entry.subFloorId !== '0' && entry.subFloorId !== ''
                  ? String(entry.subFloorId)
                  : '—';

              // Assessment display
              const displayAssessment =
                entry.asstYear || entry.formDataSnapshot?.asstYear || '—';

              // Con Type display
              const displayConType =
                conTypeLabelMap.get(String(entry.conType)) || entry.conType || '—';

              // Use Type display
              const resolvedUse =
                entry.useType || entry.formDataSnapshot?.useType || '';
              const displayUseType =
                useTypeLabelMap.get(String(resolvedUse)) || resolvedUse || '—';

              // Sub Use Type display - ensure human readable name, never show raw ID
              const resolvedSubUse =
                entry.subUseType || entry.formDataSnapshot?.subUseType || '';
              const resolvedSubUseName =
                (entry.subTypeOfUseName && isNaN(Number(entry.subTypeOfUseName))
                  ? entry.subTypeOfUseName
                  : '') ||
                subUseTypeLabelMap.get(String(resolvedSubUse)) ||
                (resolvedSubUse && isNaN(Number(resolvedSubUse)) ? resolvedSubUse : '');
              const displaySubUseType = resolvedSubUseName || '—';

              // Renter status - if unit or ANY floor has Renter: Yes, apply Yes for all added floors
              const isRenter = Boolean(
                isAnyFloorRented ||
                entry.isRenter ||
                entry.formDataSnapshot?.isRenter ||
                false
              );

              // Room count
              const roomCount = entry.noOfRooms ?? entry.rooms?.length ?? 0;

              // Carpet area (Sq.Ft / Sq.M)
              const carpetSqFt = Number(entry.carpetAreaSqFeet || 0);
              const carpetSqM =
                entry.carpetAreaSqMeter != null && entry.carpetAreaSqMeter > 0
                  ? Number(entry.carpetAreaSqMeter)
                  : carpetSqFt > 0
                  ? carpetSqFt / 10.7639
                  : 0;

              // Builtup area (Sq.Ft / Sq.M)
              const builtupSqFt =
                entry.builtupAreaSqFeet != null && entry.builtupAreaSqFeet > 0
                  ? Number(entry.builtupAreaSqFeet)
                  : carpetSqFt > 0
                  ? carpetSqFt * 1.2
                  : 0;
              const builtupSqM =
                entry.builtupAreaSqMeter != null && entry.builtupAreaSqMeter > 0
                  ? Number(entry.builtupAreaSqMeter)
                  : builtupSqFt > 0
                  ? builtupSqFt / 10.7639
                  : 0;

              return (
                <tr
                  key={entry.entryId}
                  onClick={() => onEdit(entry)}
                  className={`transition-colors cursor-pointer ${
                    isEditing
                      ? 'bg-blue-50/90 border-l-4 border-l-blue-600'
                      : 'hover:bg-blue-50/60 bg-white even:bg-slate-50/50'
                  }`}
                >
                  {/* 1. FLOOR */}
                  <td className="py-2 px-3 font-semibold text-slate-800 border-r border-blue-50 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="size-3 text-blue-600 shrink-0" />
                      <span>{displayFloor}</span>
                      {isEditing && (
                        <span className="text-[8px] font-black bg-blue-600 text-white px-1.5 py-0.5 rounded ml-1 uppercase tracking-wide">{'Selected'}</span>
                      )}
                    </div>
                  </td>

                  {/* 2. SUB FLOOR */}
                  <td className="py-2 px-2.5 font-bold text-blue-900 border-r border-blue-50 whitespace-nowrap">
                    {displaySubFloor}
                  </td>

                  {/* 3. CONSTRUCTION YEAR */}
                  <td className="py-2 px-2.5 text-center font-mono font-medium text-slate-700 border-r border-blue-50 whitespace-nowrap">
                    {entry.conYear || '—'}
                  </td>

                  {/* 4. ASSESSMENT */}
                  <td className="py-2 px-2.5 text-center font-mono font-medium text-slate-700 border-r border-blue-50 whitespace-nowrap">
                    {displayAssessment}
                  </td>

                  {/* 5. CONSTRUCTION TYPE */}
                  <td className="py-2 px-3 text-slate-700 font-medium border-r border-blue-50 whitespace-nowrap">
                    {displayConType}
                  </td>

                  {/* 6. USE */}
                  <td className="py-2 px-3 text-slate-700 font-medium border-r border-blue-50 whitespace-nowrap">
                    {displayUseType}
                  </td>

                  {/* 7. SUB TYPE OF USE */}
                  <td className="py-2 px-3 text-slate-700 font-medium border-r border-blue-50 whitespace-nowrap">
                    {displaySubUseType}
                  </td>

                  {/* 8. RENTER */}
                  <td className="py-2 px-2.5 text-center border-r border-blue-50 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-wider ${
                        isRenter
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {isRenter ? 'Yes' : 'No'}
                    </span>
                  </td>

                  {/* 9. ROOMS */}
                  <td className="py-2 px-2.5 text-center border-r border-blue-50 whitespace-nowrap">
                    <span className="inline-flex items-center justify-center min-w-[22px] px-1.5 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-100 text-slate-800">
                      {roomCount}
                    </span>
                  </td>

                  {/* 10. CARPET AREA(FT/M) */}
                  <td className="py-2 px-3 text-center border-r border-blue-50 whitespace-nowrap font-mono">
                    {carpetSqFt > 0 ? (
                      <div className="flex items-center justify-center gap-1">
                        <span className="font-bold text-blue-700">
                          {carpetSqFt.toFixed(2)}
                        </span>
                        <span className="text-slate-500 font-medium text-[9px]">
                          {'('}{carpetSqM.toFixed(2)}{' Sq.M)'}
                        </span>
                      </div>
                    ) : (
                      '—'
                    )}
                  </td>

                  {/* 11. BUILTUP AREA(FT/M) */}
                  <td className="py-2 px-3 text-center border-r border-blue-50 whitespace-nowrap font-mono">
                    {builtupSqFt > 0 ? (
                      <div className="flex items-center justify-center gap-1">
                        <span className="font-bold text-slate-800">
                          {builtupSqFt.toFixed(2)}
                        </span>
                        <span className="text-slate-500 font-medium text-[9px]">
                          {'('}{builtupSqM.toFixed(2)}{' Sq.M)'}
                        </span>
                      </div>
                    ) : (
                      '—'
                    )}
                  </td>

                  {/* 12. ACTIONS */}
                  <td className="py-2 px-3 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        title="Edit this floor entry"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(entry);
                        }}
                        className="p-1 rounded text-blue-600 hover:text-blue-800 hover:bg-blue-100/70 transition-colors cursor-pointer"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        title="Remove this floor entry"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(entry.entryId);
                        }}
                        className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-100/70 transition-colors cursor-pointer"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
