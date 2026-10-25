'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { OLD_DETAILS_COLUMNS } from './oldDetailsColumns';
import { cn } from '@/lib/utils/cn';

export const OldDetailsTableHeader: React.FC = () => {
  const t = useTranslations('ptisRedesign.oldDetails.columns');

  return (
    <thead className="sticky top-0 z-20 shadow-xs bg-blue-50/95 border-b border-blue-200">
      <tr className="border-b border-blue-200 text-blue-950 font-bold uppercase tracking-wider text-[10px] h-10">
        {OLD_DETAILS_COLUMNS.map((col) => {
          let label = col.label;
          try {
            label = t(col.key as Parameters<typeof t>[0]) || col.label;
          } catch {
            label = col.label;
          }

          return (
            <th
              key={col.key}
              className={cn(
                'px-3 py-2 whitespace-nowrap',
                col.key === 'index' && 'sticky left-0 bg-blue-100/95 text-blue-950 z-30 border-r border-blue-200 shadow-2xs',
                col.minWidth,
                col.align
              )}
            >
              {label}
            </th>
          );
        })}
      </tr>
    </thead>
  );
};
