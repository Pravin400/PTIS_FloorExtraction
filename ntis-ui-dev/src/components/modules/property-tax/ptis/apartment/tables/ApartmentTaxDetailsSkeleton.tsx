'use client';

import React from 'react';

export const ApartmentTaxDetailsSkeleton: React.FC = () => {
  return (
    <div className="mx-3 mt-4 bg-white border border-zinc-200 rounded-lg shadow-xs overflow-hidden font-sans select-none animate-pulse">
      <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-zinc-50 border-b border-zinc-200 flex items-center justify-between">
        <div className="flex items-center gap-2 bg-slate-200/70 p-1 rounded-lg">
          <div className="h-7 w-24 bg-white rounded-md shadow-xs" />
          <div className="h-7 w-20 bg-slate-200 rounded-md" />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs min-w-max">
          <thead>
            <tr className="bg-[#1E3A8A] text-white">
              <th className="p-2 border border-blue-900 font-bold uppercase tracking-wider text-[11px] min-w-[120px]">
                TAXES
              </th>
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <th key={i} className="p-2 border border-blue-900 text-center">
                  <div className="h-3.5 w-16 bg-blue-300/40 rounded mx-auto" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="bg-white">
              <td className="p-2 border border-zinc-200 font-extrabold text-[11px] text-[#1E3A8A]">
                NETTAX
              </td>
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <td key={i} className="p-2 border border-zinc-200 text-center">
                  <div className="h-3.5 w-12 bg-slate-200 rounded mx-auto" />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
