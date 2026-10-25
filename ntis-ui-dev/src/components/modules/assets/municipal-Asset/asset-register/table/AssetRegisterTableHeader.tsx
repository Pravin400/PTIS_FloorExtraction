'use client';

import { useTranslations } from 'next-intl';

export function AssetRegisterTableHeader() {
  const t = useTranslations('assetRegister');

  return (
    <thead className="sticky top-0 z-20 bg-[#EDF4F8] shadow-2xs">
      <tr className="bg-[#EDF4F8] border-b border-slate-200 text-[10px] font-bold text-[#1E3A8A] uppercase tracking-wider [&_th]:bg-[#EDF4F8] whitespace-nowrap">
        <th className="py-2.5 px-2 w-8 text-center text-slate-400 sticky left-0 bg-[#EDF4F8] z-30 border-r border-slate-200/80"></th>
        <th className="py-2.5 px-3 min-w-[70px] text-center whitespace-nowrap text-[#1E3A8A] sticky left-8 bg-[#EDF4F8] z-30 border-r border-slate-200/80">
          {t('Photo')}
        </th>
        <th className="py-2.5 px-3 min-w-[150px] text-center whitespace-nowrap text-[#1E3A8A] sticky left-[102px] bg-[#EDF4F8] z-30 border-r border-slate-200/80 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
          {t('Asset')}
        </th>
        <th className="py-2.5 px-3 min-w-[110px] text-center whitespace-nowrap text-[#1E3A8A] border-r border-slate-200/80">
          {t('Basic_Details')}
        </th>
        <th className="py-2.5 px-3 min-w-[110px] text-center whitespace-nowrap text-[#1E3A8A] border-r border-slate-200/80">
          {t('Ownership')}
        </th>
        <th className="py-2.5 px-3 min-w-[110px] text-center whitespace-nowrap text-[#1E3A8A] border-r border-slate-200/80">
          {t('Use_Details')}
        </th>
        <th className="py-2.5 px-3 min-w-[100px] text-center whitespace-nowrap text-[#1E3A8A] border-r border-slate-200/80">
          {t('Area')}
        </th>
        <th className="py-2.5 px-3 min-w-[110px] text-center whitespace-nowrap text-[#1E3A8A] border-r border-slate-200/80">
          {t('Maintenance')}
        </th>
        <th className="py-2.5 px-3 min-w-[110px] text-center whitespace-nowrap text-[#1E3A8A] border-r border-slate-200/80">
          {t('Rent_Details')}
        </th>
        <th className="py-2.5 px-3 min-w-[100px] text-center whitespace-nowrap text-[#1E3A8A] border-r border-slate-200/80">
          {t('Encroachment')}
        </th>
        <th className="py-2.5 px-3 min-w-[100px] text-center whitespace-nowrap text-[#1E3A8A] border-r border-slate-200/80">
          {t('Valuation')}
        </th>
        <th className="py-2.5 px-3 min-w-[110px] text-center whitespace-nowrap text-[#1E3A8A] border-r border-slate-200/80">
          {t('Documents')}
        </th>
        <th className="py-2.5 px-3 min-w-[145px] text-center whitespace-nowrap text-[#1E3A8A]">
          {t('Action')}
        </th>
      </tr>
    </thead>
  );
}
