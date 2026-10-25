'use client';

import { cn } from '@/lib/utils/cn';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { paletteForIndex } from '@/lib/utils/asset-utils/revenue-dashboard-helpers';
import { formatIndianCurrencyAbbreviated } from '@/lib/utils/asset-utils/currency-format';

import type {
  SummaryCardProps,
  RevenueCategoryCardProps,
  RevenueCategorySectionProps,
} from '@/types/assets/dashboard/revenue-dashboard/revenue-dashboard.types';

export function RevenueSummaryCard({
  icon: Icon,
  value,
  title,
  subtitle,
  className,
}: SummaryCardProps) {
  return (
    <Card padding="sm" className={cn('h-full', className)}>
      <CardContent className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon className="w-7 h-7" />
          <span className="text-2xl font-bold">{value}</span>
        </div>

        <div className="text-right">
          <p className="font-semibold text-xs text-slate-700">{title}</p>
          <p className="text-[11px] text-slate-500">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function RevenueCategoryCard({
  item,
  index,
  icon: Icon,
  labels,
  onClick,
  tWrapper,
}: RevenueCategoryCardProps) {
  const palette = paletteForIndex(index);

  return (
    <Card
      padding="sm"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
      className={cn(
        palette.border,
        palette.bg,
        'cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:shadow-md'
      )}
    >
      <CardContent>
        <div className="flex justify-between">
          <div className="flex gap-2">
            <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', palette.iconBg)}>
              <Icon className="h-4 w-4 text-white" />
            </div>

            <div>
              <p className="text-xs font-medium text-slate-800 leading-tight">{item.categoryName}</p>
              <p className="text-lg font-bold text-slate-900 leading-tight">{item.assetCount}</p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-[10px] font-medium text-slate-600 leading-tight mb-0.5">{labels.demand}</p>
            <p className="text-xs font-semibold text-slate-900 leading-tight">{formatIndianCurrencyAbbreviated(item.demand, tWrapper)}</p>
            <p className="mt-1 text-[10px] font-medium text-slate-600 leading-tight mb-0.5">{labels.collected}</p>
            <p className="text-xs font-semibold text-green-700 leading-tight">{formatIndianCurrencyAbbreviated(item.collection, tWrapper)}</p>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap gap-3 border-t border-slate-200 pt-2 text-[10px] font-medium text-slate-700">
          <Badge className="border-none p-0 h-auto bg-transparent hover:bg-transparent shadow-none rounded-none">
            <span className="flex items-center gap-1 text-[10px] font-medium text-slate-700">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
              {labels.lease} {item.leaseCount}
            </span>
          </Badge>
          <Badge className="border-none p-0 h-auto bg-transparent hover:bg-transparent shadow-none rounded-none">
            <span className="flex items-center gap-1 text-[10px] font-medium text-slate-700">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              {labels.rent} {item.rentCount}
            </span>
          </Badge>
          <Badge className="border-none p-0 h-auto bg-transparent hover:bg-transparent shadow-none rounded-none">
            <span className="flex items-center gap-1 text-[10px] font-medium text-slate-700">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              {labels.paid} {item.paidCount}
            </span>
          </Badge>
          <Badge className="border-none p-0 h-auto bg-transparent hover:bg-transparent shadow-none rounded-none">
            <span className="flex items-center gap-1 text-[10px] font-medium text-slate-700">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              {labels.unpaid} {item.unpaidCount}
            </span>
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export function RevenueCategorySection({
  title,
  emptyText,
  items,
  labels,
  onOpenCategory,
  getIcon,
  tWrapper,
}: RevenueCategorySectionProps) {
  return (
    <Card className="border-emerald-200" padding="sm">
      <CardHeader className="mb-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>

      <CardContent>
        {items.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-4">
            {items.map((item, index) => (
              <RevenueCategoryCard
                key={item.assetCategoryId}
                item={item}
                index={index}
                icon={getIcon(item.valuationType)}
                labels={labels}
                onClick={() => onOpenCategory(item.assetCategoryId)}
                tWrapper={tWrapper}
              />
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-slate-500">{emptyText}</p>
        )}
      </CardContent>
    </Card>
  );
}
