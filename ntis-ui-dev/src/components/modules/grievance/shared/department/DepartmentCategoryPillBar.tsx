'use client';

/**
 * DepartmentCategoryPillBar
 * Symmetrical Layer: src/components/modules/grievance/shared/department/
 *
 * Highly responsive, horizontally scrollable category pill bar.
 * Supports:
 * 1. Native mouse-wheel horizontal scrolling (converts vertical wheel delta to scrollLeft)
 * 2. Left & Right clickable navigation buttons with smooth scroll
 * 3. Mouse drag-to-scroll (pan gesture for desktop mouse)
 * 4. Native touch pan & trackpad horizontal swipe
 * 5. Auto-scroll active category into view
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MUNICIPAL_CATEGORIES } from '@/lib/constants/grievance';

export interface CategoryItem {
  id: string;
  nameEn: string;
  nameMr?: string;
  icon?: string;
}

export interface DepartmentCategoryPillBarProps {
  categories?: CategoryItem[];
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
  counts?: Record<string, number>;
  className?: string;
  variant?: 'modal' | 'page';
}

export function DepartmentCategoryPillBar({
  categories = MUNICIPAL_CATEGORIES,
  selectedCategory,
  onSelectCategory,
  counts,
  className = '',
  variant = 'modal',
}: DepartmentCategoryPillBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeBtnRef = useRef<HTMLButtonElement>(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Drag tracking refs
  const isDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasDraggedRef = useRef(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  // Update scroll buttons on resize or content change
  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;

    const handleResize = () => updateScrollState();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [updateScrollState, categories]);

  // Convert mouse wheel (vertical scroll) into horizontal scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        const maxScroll = el.scrollWidth - el.clientWidth;
        if (maxScroll > 0) {
          e.preventDefault();
          el.scrollLeft += e.deltaY;
          updateScrollState();
        }
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [updateScrollState]);

  // Auto-scroll selected category into view on change
  useEffect(() => {
    if (activeBtnRef.current && scrollRef.current) {
      activeBtnRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
      setTimeout(updateScrollState, 300);
    }
  }, [selectedCategory, updateScrollState]);

  const scrollByAmount = (amount: number) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    setTimeout(updateScrollState, 250);
  };

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    isDownRef.current = true;
    hasDraggedRef.current = false;
    setIsDragging(true);
    startXRef.current = e.pageX - el.offsetLeft;
    scrollLeftRef.current = el.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDownRef.current || !scrollRef.current) return;
    e.preventDefault();
    const el = scrollRef.current;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startXRef.current) * 1.3;
    if (Math.abs(walk) > 5) {
      hasDraggedRef.current = true;
    }
    el.scrollLeft = scrollLeftRef.current - walk;
    updateScrollState();
  };

  const handleMouseUpOrLeave = () => {
    if (!isDownRef.current) return;
    isDownRef.current = false;
    setIsDragging(false);
    setTimeout(() => {
      hasDraggedRef.current = false;
    }, 50);
  };

  return (
    <div className={`relative group ${className}`}>
      {/* Left Scroll Navigation Button */}
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-0 z-20 flex items-center pr-2 bg-gradient-to-r from-white via-white/95 to-transparent pointer-events-none">
          <button
            type="button"
            onClick={() => scrollByAmount(-220)}
            aria-label="Scroll categories left"
            className="pointer-events-auto w-7 h-7 rounded-full bg-white shadow-md border border-slate-200/90 flex items-center justify-center text-slate-600 hover:text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50/60 transition-all cursor-pointer active:scale-90"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      )}

      {/* Horizontal Scroll Track */}
      <div
        ref={scrollRef}
        onScroll={updateScrollState}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        className={`flex items-center gap-1.5 overflow-x-auto py-1 px-0.5 scroll-smooth touch-pan-x select-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        } [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-slate-100/60 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300/80 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-400`}
      >
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          const catLabel = cat.nameEn;
          const count = counts ? counts[cat.id] : undefined;

          return (
            <button
              key={cat.id}
              ref={isActive ? activeBtnRef : undefined}
              type="button"
              onClick={() => {
                if (hasDraggedRef.current) return;
                onSelectCategory(cat.id);
              }}
              className={`px-3 py-1.5 rounded-xl text-[10.5px] font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-xs font-black ring-1 ring-emerald-500'
                  : variant === 'page'
                  ? 'bg-slate-100/90 hover:bg-slate-200/80 text-slate-700 hover:text-slate-900 border border-slate-200/60 shadow-2xs'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/90 shadow-2xs'
              }`}
            >
              {cat.icon && <span className="text-xs">{cat.icon}</span>}
              <span>{catLabel}</span>
              {typeof count === 'number' && (
                <span
                  className={`text-[9.5px] px-1.5 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Right Scroll Navigation Button */}
      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-0 z-20 flex items-center pl-2 bg-gradient-to-l from-white via-white/95 to-transparent pointer-events-none">
          <button
            type="button"
            onClick={() => scrollByAmount(220)}
            aria-label="Scroll categories right"
            className="pointer-events-auto w-7 h-7 rounded-full bg-white shadow-md border border-slate-200/90 flex items-center justify-center text-slate-600 hover:text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50/60 transition-all cursor-pointer active:scale-90"
          >
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      )}
    </div>
  );
}
