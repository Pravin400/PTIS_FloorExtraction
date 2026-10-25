'use client';
import type { InventorySummarySectionProps } from '@/types/asset/municipal-Asset/asset-detail.types';
import { useTranslations } from 'next-intl';
import React, { useState, useRef } from 'react';
import { SectionCard } from './SectionCard';
import { Button } from '@/components/common';
import { Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { InventoryDrawer } from './InventoryDrawer';
import { getInventoryCategoryStyling, getInventoryCategoryIcon } from './inventory.config';

export function InventorySummarySection({ data }: InventorySummarySectionProps): React.ReactElement {
  const t = useTranslations('asset-detail');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleCardClick = (label: string) => {
    setSelectedCategory(label === 'Total Inventory' ? '' : label);
    setIsDrawerOpen(true);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <>
      <SectionCard
        title={t('inventorySummary')}
        titleIcon={<Package className="w-3.5 h-3.5 text-white" />} iconBgClass="bg-purple-500"
        headerRight={
          <Button
            variant="secondary"
            className="!text-[9px] !font-bold !text-blue-600 !border-blue-200 !bg-white !rounded-full !px-2 !h-4 flex items-center hover:!bg-blue-50 transition-colors"
            onClick={() => {
              setSelectedCategory('');
              setIsDrawerOpen(true);
            }}
            aria-label={t('viewInventory')}
          >
            {t('viewInventory')}
          </Button>
        }
      >
        <div className="relative group w-full h-full flex items-center px-1">
          <Button variant="outline" onClick={() => scroll('left')} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md border border-slate-200 rounded-full !p-1 opacity-0 group-hover:opacity-100 transition-opacity -ml-2 !min-w-0 !w-6 !h-6 flex items-center justify-center">
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </Button>

          <div ref={scrollRef} className="flex gap-3 overflow-x-auto no-scrollbar scroll-smooth snap-x w-full items-center py-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {data.inventoryItems.map((item) => {
              const style = getInventoryCategoryStyling(item.label);
              const IconComponent = getInventoryCategoryIcon(item.label);

              return (
                <Button
                  variant="ghost"
                  key={item.id}
                  className={cn(
                    '!h-[115px] flex-1 min-w-[90px] max-w-[120px] !rounded-xl !p-2 !cursor-pointer hover:!opacity-80 transition-opacity snap-start flex-shrink-0 shadow-sm border border-slate-50/50',
                    style.bgColor,
                  )}
                  onClick={() => handleCardClick(item.label)}
                >
                  <div className="flex flex-col items-center justify-center w-full">
                    <span className={cn('mb-1.5', style.color)}>
                      <IconComponent className="w-6 h-6 stroke-[1.5]" />
                    </span>
                    <span className={cn('text-xl font-black leading-none mb-1.5', style.color)}>
                      {item.count}
                    </span>
                    <span className={cn('text-[11px] font-bold text-center leading-tight line-clamp-2 whitespace-normal', style.color)} title={item.label}>
                      {item.label}
                    </span>
                  </div>
                </Button>
              )
            })}
          </div>

          <Button variant="outline" onClick={() => scroll('right')} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md border border-slate-200 rounded-full !p-1 opacity-0 group-hover:opacity-100 transition-opacity -mr-2 !min-w-0 !w-6 !h-6 flex items-center justify-center">
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </Button>
        </div>
      </SectionCard>
      {isDrawerOpen && (
        <InventoryDrawer
          open={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false);
            setSelectedCategory('');
          }}
          items={data.detailedInventoryItems || []}
          kpiData={data.inventoryItems || []}
          initialCategoryFilter={selectedCategory}
        />
      )}
    </>
  );
}
