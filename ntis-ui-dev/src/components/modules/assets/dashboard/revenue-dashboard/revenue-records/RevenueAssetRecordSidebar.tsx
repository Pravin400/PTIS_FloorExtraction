'use client';

import { ArrowLeft, LayoutDashboard } from 'lucide-react';

import { Tabs } from '@/components/common/Tabs';
import { Button } from '@/components/common';
import { cn } from '@/lib/utils/cn';
import { iconForCategory } from '@/lib/utils/asset-utils/revenue-dashboard-helpers';


import type { RevenueCategorySidebarProps } from '@/types/assets/dashboard/revenue-dashboard/revenue-dashboard.types';

export function RevenueCategorySidebar({
  categories,
  selectedCategoryId,
  totalAssets,
  onCategoryChange,
  onBack,
  copy,
}: RevenueCategorySidebarProps) {

  return (
    <aside className="w-full lg:w-72 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-gray-200 bg-white">
      <div className="p-6">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-6 -ml-4 flex items-center gap-2 font-medium text-blue-600 hover:text-blue-700 hover:bg-transparent"
        >
          <ArrowLeft className="h-4 w-4" />
          {copy.records.backToDashboard}
        </Button>

        <div className="mb-6">
          <h2 className="mb-1 text-lg font-semibold text-gray-900">{copy.records.totalLeasedAssets}</h2>
        </div>

        <Tabs
          value={selectedCategoryId == null ? 'all' : selectedCategoryId}
          onChange={(val) => onCategoryChange(val === 'all' ? null : Number(val))}
          orientation="vertical"
          variant="pills"
          className="w-full space-y-2"
        >
          <Tabs.TabList className="flex w-full flex-col gap-2 border-none bg-transparent p-0">
            <Tabs.Tab
              value="all"
              className={cn(
                'w-full rounded-lg border-none px-4 py-3 text-left transition-all duration-200 [&>span]:flex [&>span]:w-full [&>span]:items-center',
                selectedCategoryId == null
                  ? 'bg-blue-600 text-white shadow-md hover:text-white'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-700'
              )}
            >
              <div className="flex w-full items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <LayoutDashboard className={cn('h-5 w-5 shrink-0', selectedCategoryId == null ? 'text-white' : 'text-gray-500')} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold leading-tight">{copy.records.allCategories}</div>
                    <div className={cn('mt-0.5 truncate text-xs font-normal leading-normal', selectedCategoryId == null ? 'text-blue-100' : 'text-gray-500')}>
                      {copy.records.allCategoriesCount.replace('{count}', String(totalAssets))}
                    </div>
                  </div>
                </div>
              </div>
            </Tabs.Tab>

            {categories.map((category) => {
              const Icon = iconForCategory(category.valuationType);
              const isActive = selectedCategoryId === category.assetCategoryId;

              return (
                <Tabs.Tab
                  key={category.assetCategoryId}
                  value={category.assetCategoryId}
                  className={cn(
                    'w-full rounded-lg border-none px-4 py-3 text-left transition-all duration-200 [&>span]:flex [&>span]:w-full [&>span]:items-center',
                    isActive
                      ? 'bg-blue-600 text-white shadow-md hover:text-white'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-700'
                  )}
                >
                  <div className="flex w-full items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Icon className={cn('h-5 w-5 shrink-0', isActive ? 'text-white' : 'text-gray-500')} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold leading-tight">{category.categoryName}</div>
                        <div className={cn('mt-0.5 truncate text-xs font-normal leading-normal', isActive ? 'text-blue-100' : 'text-gray-500')}>
                          {copy.records.allCategoriesCount.replace('{count}', String(category.assetCount))}
                        </div>
                      </div>
                    </div>
                  </div>
                </Tabs.Tab>
              );
            })}
          </Tabs.TabList>
        </Tabs>
      </div>
    </aside>
  );
}
