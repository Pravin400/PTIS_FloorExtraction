'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { motion, useReducedMotion } from 'framer-motion';
import { ApartmentWingCard } from './ApartmentWingCard';
import { WingData } from '@/types/property-tax/apartment';

export interface WingCardListProps {
  mappedWings: WingData[];
  activeWingDetailId: number | null;
  activeWingMasterId: number | null;
  activeWingName?: string | null;
  initScrollRef?: (el: HTMLDivElement | null) => void;
  leftArrowRef?: React.RefObject<HTMLButtonElement | HTMLDivElement | null>;
  rightArrowRef?: React.RefObject<HTMLButtonElement | HTMLDivElement | null>;
  scrollPrev?: () => void;
  scrollNext?: () => void;
  checkScroll?: () => void;
  hiddenLeftCount?: number;
  hiddenRightCount?: number;
  onCardSelect: (wing: WingData) => void;
  onAmcClick: (wing: WingData) => void;
  onCardEdit: (wing: WingData) => void;
}

export const ApartmentWingCardList: React.FC<WingCardListProps> = ({
  mappedWings,
  activeWingDetailId,
  activeWingMasterId,
  activeWingName,
  initScrollRef,
  leftArrowRef,
  rightArrowRef,
  scrollPrev,
  scrollNext,
  checkScroll,
  onCardSelect,
  onAmcClick,
  onCardEdit,
}) => {
  const t = useTranslations('ptisRedesign.wingIntelligence');
  const shouldReduceMotion = useReducedMotion();
  const [startIndex, setStartIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [columnsCount, setColumnsCount] = useState(3);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef<number | null>(null);
  const dragOffsetRef = useRef<number>(0);
  const hasMovedFar = useRef(false);
  const hasCapturedRef = useRef(false);
  const activePointerTargetRef = useRef<HTMLElement | null>(null);

  const totalWings = mappedWings?.length || 0;
  const maxStartIndex = Math.max(0, totalWings - columnsCount);

  // Responsive column count with bounds re-clamping
  useEffect(() => {
    const updateColumns = () => {
      if (typeof window === 'undefined') return;
      let nextCols = 3;
      if (window.innerWidth >= 1024) {
        nextCols = 3;
      } else if (window.innerWidth >= 768) {
        nextCols = 2;
      } else {
        nextCols = 1;
      }
      setColumnsCount(nextCols);
      // Re-clamp startIndex to prevent out-of-bounds rendering when window expands
      setStartIndex((prev) => Math.min(prev, Math.max(0, (mappedWings?.length || 0) - nextCols)));
    };
    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, [mappedWings?.length]);

  // Adjust state during render when active wing prop changes (React recommended pattern)
  const [prevActiveDetailId, setPrevActiveDetailId] = useState(activeWingDetailId);
  const [prevActiveMasterId, setPrevActiveMasterId] = useState(activeWingMasterId);
  const [prevActiveWingName, setPrevActiveWingName] = useState(activeWingName);

  if (
    activeWingDetailId !== prevActiveDetailId ||
    activeWingMasterId !== prevActiveMasterId ||
    activeWingName !== prevActiveWingName
  ) {
    setPrevActiveDetailId(activeWingDetailId);
    setPrevActiveMasterId(activeWingMasterId);
    setPrevActiveWingName(activeWingName);
    if (mappedWings && mappedWings.length > 0) {
      const selectedIdx = mappedWings.findIndex(
        (w) =>
          (activeWingDetailId != null && w.wingDetailId === activeWingDetailId) ||
          (activeWingMasterId != null && w.wingMasterId === activeWingMasterId) ||
          (w.isCommonAmenity && Boolean(activeWingName) && (w.name === activeWingName || w.wingNo === activeWingName))
      );
      if (selectedIdx !== -1) {
        if (selectedIdx < startIndex) {
          setDirection(-1);
          setStartIndex(selectedIdx);
        } else if (selectedIdx >= startIndex + columnsCount) {
          setDirection(1);
          setStartIndex(Math.min(selectedIdx - columnsCount + 1, maxStartIndex));
        }
      }
    }
  }

  useEffect(() => {
    checkScroll?.();
  }, [mappedWings, checkScroll]);

  const handlePrev = useCallback(() => {
    if (startIndex <= 0) return;
    setDirection(-1);
    setStartIndex((prev) => Math.max(0, prev - 1));
    scrollPrev?.();
  }, [startIndex, scrollPrev]);

  const handleNext = useCallback(() => {
    if (startIndex >= maxStartIndex) return;
    setDirection(1);
    setStartIndex((prev) => Math.min(maxStartIndex, prev + 1));
    scrollNext?.();
  }, [startIndex, maxStartIndex, scrollNext]);

  const handleStackRightClick = (stackIdx: number) => {
    setDirection(1);
    setStartIndex((prev) => Math.min(maxStartIndex, prev + stackIdx + 1));
  };

  const handleStackLeftClick = (stackIdx: number) => {
    setDirection(-1);
    setStartIndex((prev) => Math.max(0, prev - (stackIdx + 1)));
  };

  // Pointer drag/swipe gestures: capture pointer ONLY after passing movement threshold to preserve child clicks
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || totalWings <= columnsCount) return;
    dragStartX.current = e.clientX;
    dragOffsetRef.current = 0;
    hasMovedFar.current = false;
    hasCapturedRef.current = false;
    activePointerTargetRef.current = e.currentTarget as HTMLElement;
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragStartX.current === null) return;
    const delta = e.clientX - dragStartX.current;
    if (Math.abs(delta) > 6) {
      hasMovedFar.current = true;
      // Capture pointer only when actively dragging to prevent stealing clicks from Edit/AMC buttons
      if (!hasCapturedRef.current && activePointerTargetRef.current) {
        try {
          activePointerTargetRef.current.setPointerCapture(e.pointerId);
          hasCapturedRef.current = true;
        } catch {
          // Defensive fallback
        }
      }
    }
    dragOffsetRef.current = delta;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (hasCapturedRef.current && activePointerTargetRef.current) {
      try {
        activePointerTargetRef.current.releasePointerCapture(e.pointerId);
      } catch {
        // Defensive fallback
      }
    }
    hasCapturedRef.current = false;
    activePointerTargetRef.current = null;

    if (dragStartX.current !== null) {
      const offset = dragOffsetRef.current;
      if (offset < -45) {
        handleNext();
      } else if (offset > 45) {
        handlePrev();
      }
    }
    dragStartX.current = null;
    dragOffsetRef.current = 0;
    setIsDragging(false);
  };

  const handlePointerCancel = (e: React.PointerEvent) => {
    if (hasCapturedRef.current && activePointerTargetRef.current) {
      try {
        activePointerTargetRef.current.releasePointerCapture(e.pointerId);
      } catch {
        // Defensive fallback
      }
    }
    hasCapturedRef.current = false;
    activePointerTargetRef.current = null;
    dragStartX.current = null;
    dragOffsetRef.current = 0;
    setIsDragging(false);
  };

  // Keyboard navigation: Guard against hijacking inputs or selects inside the cards
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handlePrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleNext();
    }
  };

  // Visible main columns
  const visibleWings = useMemo(() => {
    if (!mappedWings) return [];
    return mappedWings.slice(startIndex, startIndex + columnsCount);
  }, [mappedWings, startIndex, columnsCount]);

  // Stacked preview wings behind the rightmost column
  const stackedRightWings = useMemo(() => {
    if (!mappedWings) return [];
    const afterIndex = startIndex + columnsCount;
    return mappedWings.slice(afterIndex, afterIndex + 3);
  }, [mappedWings, startIndex, columnsCount]);

  // Stacked preview wings behind the leftmost column
  const stackedLeftWings = useMemo(() => {
    if (!mappedWings || startIndex === 0) return [];
    const beforeWings = mappedWings.slice(0, startIndex);
    return beforeWings.slice(-2).reverse();
  }, [mappedWings, startIndex]);

  const remainingRightCount = Math.max(0, totalWings - (startIndex + columnsCount));
  const remainingLeftCount = startIndex;

  if (!mappedWings || mappedWings.length === 0) {
    return null;
  }

  const defaultWingText = t('wing');

  return (
    <div
      ref={initScrollRef}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label={t('wingIntelligence')}
      onKeyDown={handleKeyDown}
      className="relative w-full focus:outline-hidden select-none py-0.5"
    >
      {/* Cards Deck Container with 3D Perspective */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        style={{ perspective: 1400 }}
        className={`relative w-full overflow-visible pt-3.5 pb-2.5 ${
          remainingRightCount >= 2
            ? 'pr-10 sm:pr-24 md:pr-48 lg:pr-56'
            : remainingRightCount === 1
              ? 'pr-8 sm:pr-16 md:pr-32'
              : 'pr-2'
        } ${remainingLeftCount > 0 ? 'pl-8 sm:pl-12 md:pl-14' : 'pl-1'} ${
          isDragging ? 'cursor-grabbing' : 'cursor-default'
        }`}
      >
        <div className="flex items-stretch gap-3 md:gap-4 lg:gap-5">
          {visibleWings.map((wing, colIndex) => {
            const isFirstColumn = colIndex === 0;
            const isLastColumn = colIndex === visibleWings.length - 1;

            const isSelected = !!(
              (activeWingDetailId != null && wing.wingDetailId === activeWingDetailId) ||
              (activeWingMasterId != null && wing.wingMasterId === activeWingMasterId) ||
              (wing.isCommonAmenity && Boolean(activeWingName) && (wing.name === activeWingName || wing.wingNo === activeWingName))
            );

            const wingKey = wing.wingDetailId ?? wing.wingMasterId ?? wing.id ?? colIndex;

            return (
              <div
                key={`col-wrapper-${wingKey}`}
                style={{ perspective: 1200 }}
                className={`min-w-0 relative shrink-0 w-full md:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-2.5rem)/3)] max-w-full md:max-w-[calc((100%-1rem)/2)] lg:max-w-[calc((100%-2.5rem)/3)] ${
                  totalWings < 3 ? 'flex-none' : 'flex-1'
                }`}
              >
                {/* Left Stacked Cards (Cascading behind Column 0 to top-left) */}
                {isFirstColumn &&
                  stackedLeftWings.map((stackedWing, stackIdx) => {
                    const offsetMultiplier = stackIdx + 1;
                    const offsetX = -1 * (offsetMultiplier * 26);
                    const offsetY = -1 * (offsetMultiplier * 5);
                    const scale = 1 - offsetMultiplier * 0.03;
                    const zIndex = 8 - stackIdx * 2;
                    const opacity = 0.9 - stackIdx * 0.12;
                    const stackedKey =
                      stackedWing.wingDetailId ??
                      stackedWing.wingMasterId ??
                      stackedWing.id ??
                      stackIdx;
                    const stackedWingName =
                      stackedWing.name || stackedWing.wingNo || defaultWingText;

                    return (
                      <div
                        key={`stack-left-${stackedKey}`}
                        role="button"
                        tabIndex={-1}
                        aria-label={t('viewWing', { name: stackedWingName })}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (hasMovedFar.current) return;
                          handleStackLeftClick(stackIdx);
                        }}
                        style={{
                          transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
                          zIndex,
                          opacity,
                          transformOrigin: 'bottom right',
                        }}
                        className="absolute inset-0 rounded-xl transition-all duration-300 ease-out cursor-pointer hover:opacity-100 hover:shadow-xl pointer-events-auto group/stack focus:outline-hidden"
                        title={t('viewWing', { name: stackedWingName })}
                      >
                        <div className="w-full h-full pointer-events-none rounded-xl overflow-hidden border-2 border-white shadow-lg ring-1 ring-slate-200/80 bg-white">
                          <ApartmentWingCard data={stackedWing} isSelected={false} />
                        </div>
                      </div>
                    );
                  })}

                {/* Right Stacked Cards (Wide fan-out cascading behind Last Column to top-right) */}
                {isLastColumn &&
                  stackedRightWings.map((stackedWing, stackIdx) => {
                    const offsetX = stackIdx === 0 ? 75 : stackIdx === 1 ? 145 : 195;
                    const offsetY = stackIdx === 0 ? -5 : stackIdx === 1 ? -10 : -14;
                    const scale = stackIdx === 0 ? 0.975 : stackIdx === 1 ? 0.95 : 0.92;
                    const zIndex = 8 - stackIdx * 2;
                    const opacity = 1;
                    const stackedKey =
                      stackedWing.wingDetailId ??
                      stackedWing.wingMasterId ??
                      stackedWing.id ??
                      stackIdx;
                    const stackedWingName =
                      stackedWing.name || stackedWing.wingNo || defaultWingText;

                    return (
                      <div
                        key={`stack-right-${stackedKey}`}
                        role="button"
                        tabIndex={-1}
                        aria-label={t('viewWing', { name: stackedWingName })}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (hasMovedFar.current) return;
                          handleStackRightClick(stackIdx);
                        }}
                        style={{
                          transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
                          zIndex,
                          opacity,
                          transformOrigin: 'bottom left',
                        }}
                        className="absolute inset-0 rounded-xl transition-all duration-300 ease-out cursor-pointer hover:translate-x-[calc(var(--tw-translate-x)+8px)] hover:shadow-2xl hover:scale-[0.985] pointer-events-auto group/stack focus:outline-hidden"
                        title={t('viewWing', { name: stackedWingName })}
                      >
                        <div className="w-full h-full pointer-events-none rounded-xl overflow-hidden border-2 border-white shadow-xl ring-1 ring-slate-300/80 bg-white">
                          <ApartmentWingCard data={stackedWing} isSelected={false} />
                        </div>
                      </div>
                    );
                  })}

                {/* Main Visible Card with 3D Flip Animation (keyed strictly by wingKey to prevent unmounting) */}
                <motion.div
                  key={`visible-card-${wingKey}`}
                  initial={
                    shouldReduceMotion
                      ? { opacity: 1 }
                      : direction === 1 && isLastColumn
                        ? { rotateY: 72, scale: 0.94, x: 55, z: 40, opacity: 0.75 }
                        : direction === -1 && isFirstColumn
                          ? { rotateY: -72, scale: 0.94, x: -55, z: 40, opacity: 0.75 }
                          : direction === 1
                            ? { x: 30, opacity: 0.9 }
                            : direction === -1
                              ? { x: -30, opacity: 0.9 }
                              : { opacity: 1 }
                  }
                  animate={{ rotateY: 0, scale: 1, x: 0, z: 0, opacity: 1 }}
                  transition={{
                    duration: shouldReduceMotion ? 0 : 0.44,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  style={{
                    transformStyle: 'preserve-3d',
                    transformOrigin: isLastColumn
                      ? 'left center'
                      : isFirstColumn
                        ? 'right center'
                        : 'center center',
                  }}
                  className={`relative z-10 w-full h-full bg-white rounded-xl shadow-md border-2 border-white ring-1 ring-slate-200/80 transition-shadow ${
                    isSelected ? 'border-blue-600 ring-2 ring-blue-500/40 shadow-xl' : ''
                  }`}
                >
                  <ApartmentWingCard
                    data={wing}
                    isSelected={isSelected}
                    onClick={() => {
                      if (hasMovedFar.current) return;
                      onCardSelect(wing);
                    }}
                    onDoubleClick={() => {
                      if (hasMovedFar.current) return;
                      onCardSelect(wing);
                    }}
                    onAmcClick={(e) => {
                      e.stopPropagation();
                      onAmcClick(wing);
                    }}
                    onEdit={(e) => {
                      e.stopPropagation();
                      onCardEdit(wing);
                    }}
                  />
                </motion.div>
              </div>
            );
          })}
        </div>

        {/* Floating Left Arrow Navigation Button */}
        {remainingLeftCount > 0 && (
          <button
            ref={leftArrowRef as React.RefObject<HTMLButtonElement>}
            type="button"
            aria-label={t('scrollLeft')}
            title={t('previousWings', { count: remainingLeftCount })}
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2.5 bg-gradient-to-r from-[#1d4ed8] to-[#0b28aa] hover:from-[#1740b3] hover:to-[#081e80] text-white h-8.5 px-3 flex items-center gap-1.5 rounded-full shadow-lg shadow-blue-900/30 border-2 border-white ring-2 ring-blue-500/30 cursor-pointer z-30 transition-all duration-200 select-none group active:scale-95 hover:scale-105 hover:shadow-xl"
          >
            <ChevronLeft
              className="text-white group-hover:-translate-x-0.5 transition-transform shrink-0"
              size={16}
              strokeWidth={3}
            />
            <span className="text-[12px] font-black text-white leading-none tracking-tight">
              +{remainingLeftCount}
            </span>
          </button>
        )}

        {/* Floating Right Arrow Navigation Button */}
        {remainingRightCount > 0 && (
          <button
            ref={rightArrowRef as React.RefObject<HTMLButtonElement>}
            type="button"
            aria-label={t('scrollRight')}
            title={t('moreWings', { count: remainingRightCount })}
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-1 md:right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-[#0b28aa] to-[#1d4ed8] hover:from-[#081e80] hover:to-[#1740b3] text-white h-8.5 px-3 flex items-center gap-1.5 rounded-full shadow-lg shadow-blue-900/30 border-2 border-white ring-2 ring-blue-500/30 cursor-pointer z-30 transition-all duration-200 select-none group active:scale-95 hover:scale-105 hover:shadow-xl"
          >
            <span className="text-[12px] font-black text-white leading-none tracking-tight">
              +{remainingRightCount}
            </span>
            <ChevronRight
              className="text-white group-hover:translate-x-0.5 transition-transform shrink-0"
              size={16}
              strokeWidth={3}
            />
          </button>
        )}
      </div>
    </div>
  );
};

export default ApartmentWingCardList;
