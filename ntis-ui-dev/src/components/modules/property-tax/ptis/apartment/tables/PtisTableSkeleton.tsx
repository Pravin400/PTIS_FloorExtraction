'use client';

import React from 'react';

interface PtisTableSkeletonProps {
  columnCount: number;
  rowCount?: number;
}

const WIDTHS = ['w-3/4', 'w-1/2', 'w-4/5', 'w-2/3', 'w-full', 'w-3/5'];

export const PtisTableSkeleton: React.FC<PtisTableSkeletonProps> = ({
  columnCount,
  rowCount = 8,
}) => {
  const rows = Array.from({ length: rowCount });
  const cols = Array.from({ length: columnCount });

  return (
    <>
      {rows.map((_, rowIdx) => (
        <tr
          key={`skeleton-row-${rowIdx}`}
          className={`border-b border-zinc-100 ${
            rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
          }`}
        >
          {cols.map((_, colIdx) => {
            const widthClass = WIDTHS[(rowIdx + colIdx) % WIDTHS.length];
            return (
              <td
                key={`skeleton-cell-${rowIdx}-${colIdx}`}
                className="px-2 py-1.5 align-middle border-r border-zinc-200"
              >
                <div
                  className={`h-3.5 bg-slate-200/75 rounded-md animate-pulse ${widthClass}`}
                />
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
};
