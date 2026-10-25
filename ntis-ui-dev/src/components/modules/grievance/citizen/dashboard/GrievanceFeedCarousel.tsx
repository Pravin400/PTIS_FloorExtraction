'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { MapPin } from 'lucide-react';
import { CivicFeedCard, type CivicComparisonItem } from './GrievanceFeedCard';
interface CivicFeedCarouselProps {
  items?: CivicComparisonItem[];
  onSelectCard?: (item: CivicComparisonItem) => void;
  onDetailsClick?: (item: CivicComparisonItem) => void;
  className?: string;
}

export function CivicFeedCarousel({
  items = [],
  onSelectCard,
  onDetailsClick,
  className = '',
}: CivicFeedCarouselProps) {
  const t = useTranslations('grievance');

  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoSlidePaused, setIsAutoSlidePaused] = useState(false);

  const carouselRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const resumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToIndex = useCallback((idx: number) => {
    const container = carouselRef.current;
    const cardEl = cardRefs.current[idx];
    if (cardEl && container) {
      const targetLeft = cardEl.offsetLeft - (container.clientWidth - cardEl.clientWidth) / 2;
      container.scrollTo({
        left: Math.max(0, targetLeft),
        behavior: 'smooth',
      });
    }
  }, []);

  // Initial scroll into view on mount
  useEffect(() => {
    if (items.length === 0) return;
    const timer = setTimeout(() => {
      scrollToIndex(activeIndex);
    }, 300);
    return () => clearTimeout(timer);
  }, [activeIndex, scrollToIndex, items.length]);

  // Auto-Slide Timer: advances every 5 seconds when not paused
  useEffect(() => {
    if (isAutoSlidePaused || items.length <= 1) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % items.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoSlidePaused, items.length]);

  if (items.length === 0) {
    return null;
  }

  const currentItem = items[activeIndex] || items[0];


  // Pause on user hover or interaction, and auto-resume after 6 seconds of inactivity
  const handleInteractionStart = () => {
    setIsAutoSlidePaused(true);
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
  };

  const handleInteractionEnd = () => {
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      setIsAutoSlidePaused(false);
    }, 6000);
  };

  return (
    <div className={`w-full max-w-6xl mx-auto space-y-2 pointer-events-auto select-none px-2 ${className}`}>
      {/* Top Bar of Carousel: Ward Location Pill */}
      <div className="flex items-center justify-start px-1">
        {/* Ward Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 backdrop-blur-md text-white text-xs font-bold shadow-md border border-slate-700/60 transition-all duration-300">
          <MapPin className="w-3.5 h-3.5 text-amber-400" />
          <span>
            {`${t('wardPrefix')} ${currentItem.wardNumber}: ${currentItem.wardName}`}
          </span>
        </div>
      </div>

      {/* Horizontal Carousel Track with Auto-Slide Smooth Scroll */}
      <div
        ref={carouselRef}
        onMouseEnter={handleInteractionStart}
        onMouseLeave={handleInteractionEnd}
        className="flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth py-1 px-1 snap-x snap-mandatory"
      >
        {items.map((item, idx) => {
          const isActive = activeIndex === idx;
          return (
            <div
              key={item.id}
              ref={(el) => {
                cardRefs.current[idx] = el;
              }}
              onClick={() => {
                setActiveIndex(idx);
                onSelectCard?.(item);
                scrollToIndex(idx);
              }}
              className="w-[calc(25%-9px)] min-w-[260px] shrink-0 snap-center transition-all duration-300"
            >
              <CivicFeedCard
                item={item}
                isActive={isActive}
                onSelect={() => {
                  setActiveIndex(idx);
                  onSelectCard?.(item);
                  scrollToIndex(idx);
                }}
                onDetailsClick={onDetailsClick}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
