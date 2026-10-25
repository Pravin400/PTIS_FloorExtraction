'use client';

import { useState, useRef } from 'react';
import { ConfigCategory } from '@/types/configMaster.types';
import { CategoryCard } from './CategoryCard';

interface ConfigurationCardsProps {
  categories: ConfigCategory[];
  activeCategoryId: string;
  search?: string;
}

export function ConfigurationCards({
  categories,
  activeCategoryId,
  search,
}: ConfigurationCardsProps) {
  const [visibleCount, setVisibleCount] = useState(24);
  const gridContainerRef = useRef<HTMLDivElement>(null);

  const activeIndex = activeCategoryId
    ? categories.findIndex((c) => c.id === activeCategoryId)
    : -1;
  const actualVisibleCount = activeIndex !== -1 && activeIndex >= visibleCount
    ? activeIndex + 12
    : visibleCount;

  // Handle scroll-based progressive rendering (lazy loading)
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
    // Load next batch when user scrolls within 120px of the bottom
    if (scrollBottom < 120 && actualVisibleCount < categories.length) {
      setVisibleCount(Math.min(actualVisibleCount + 24, categories.length));
    }
  };

  // Slice categories for progressive rendering
  const displayedCategories = categories.slice(0, actualVisibleCount);

  return (
    <div className="space-y-4">
      <style dangerouslySetInnerHTML={{__html: `
        .category-grid::-webkit-scrollbar {
          width: 5px;
        }
        .category-grid::-webkit-scrollbar-track {
          background: transparent;
        }
        .category-grid::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 9999px;
        }
        .category-grid::-webkit-scrollbar-thumb:hover {
          background-color: #94a3b8;
        }
      `}} />

      {/* Cards Scroll Container */}
      {categories.length > 0 && (
        <div
          ref={gridContainerRef}
          onScroll={handleScroll}
          className="category-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 max-h-[340px] overflow-y-auto pr-2 py-1 scroll-smooth"
        >
          {displayedCategories.map((category) => (
            <div key={category.id} className="w-full">
              <CategoryCard
                category={category}
                isActive={category.id === activeCategoryId}
                search={search}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
