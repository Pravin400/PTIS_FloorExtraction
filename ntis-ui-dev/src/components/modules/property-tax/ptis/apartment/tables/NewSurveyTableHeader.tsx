'use client';

import React from 'react';
import { PtisTaxMode } from '@/types/property-tax/apartment';
import type { ApartmentSortPanel, ApartmentSortState } from '@/lib/utils/apartment-sort';
import { PtisTableHeader, type PtisColumnDef } from './PtisTableHeader';
import { useTranslations } from 'next-intl';


const NEW_SURVEY_COLUMNS: PtisColumnDef[] = [
  { key: 'action', labelKey: 'srNo', titleKey: 'srNoTitle', defaultLabel: '#', defaultTitle: 'Serial Number / Row Index', className: 'px-1 py-1 text-center w-12 sticky left-0 bg-blue-100/90 text-blue-950 z-30 border-r border-blue-200 shadow-2xs' },
  { key: 'prop', labelKey: 'propNo', titleKey: 'propNoTitle', defaultLabel: 'PROP NO', defaultTitle: 'Wing / Partition Number', className: 'px-2 py-1.5 text-left border-r border-blue-200' },
  { key: 'flat', labelKey: 'flatNo', titleKey: 'flatNoTitle', defaultLabel: 'FLAT NO', defaultTitle: 'Flat / Shop Number', className: 'px-2 py-1.5 text-left border-r border-blue-200' },
  { key: 'wgFl', labelKey: 'wingFloor', titleKey: 'wingFloorTitle', defaultLabel: 'FLOOR', defaultTitle: 'Floor Code (G, 1, 2 ...)', className: 'px-2 py-1.5 text-left border-r border-blue-200' },
  { key: 'type', labelKey: 'type', titleKey: 'typeTitle', defaultLabel: 'TYPE', defaultTitle: 'Apartment Type / Property Category', className: 'px-2 py-1.5 text-left border-r border-blue-200' },
  { key: 'bhk', labelKey: 'bhk', titleKey: 'bhkTitle', defaultLabel: 'BHK', defaultTitle: 'BHK (Bedroom / Hall / Kitchen)', className: 'px-2 py-1.5 text-left border-r border-blue-200' },
  { key: 'cty', labelKey: 'constType', titleKey: 'constTypeTitle', defaultLabel: 'CONST TYPE', defaultTitle: 'Construction Type', className: 'px-2 py-1.5 text-left border-r border-blue-200' },
  { key: 'ayr', labelKey: 'asmtYear', titleKey: 'asmtYearTitle', defaultLabel: 'ASMT YEAR', defaultTitle: 'Assessment Year', className: 'px-2 py-1.5 text-center border-r border-blue-200' },
  { key: 'cyr', labelKey: 'constYear', titleKey: 'constYearTitle', defaultLabel: 'CONST YEAR', defaultTitle: 'Construction Year', className: 'px-2 py-1.5 text-center border-r border-blue-200' },
  { key: 'use', labelKey: 'use', titleKey: 'useTitle', defaultLabel: 'USE', defaultTitle: 'Type of Use / Sub-type of Use', className: 'px-2 py-1.5 text-left border-r border-blue-200' },
  { key: 'cpt', labelKey: 'carpet', titleKey: 'carpetTitle', defaultLabel: 'CARPET (FT/M)', defaultTitle: 'Carpet Area in Square Feet / Square Meters', className: 'px-2.5 py-1.5 text-right border-r border-blue-200' },
  { key: 'bua', labelKey: 'builtup', titleKey: 'builtupTitle', defaultLabel: 'BUA (FT/M)', defaultTitle: 'Built-up Area in Square Feet / Square Meters', className: 'px-2.5 py-1.5 text-right border-r border-blue-200' },
  { key: 'ocNo', labelKey: 'ocNo', titleKey: 'ocNoTitle', defaultLabel: 'OC NO', defaultTitle: 'Occupancy Certificate Number / CSN', className: 'px-2 py-1.5 text-left border-r border-blue-200' },
  { key: 'ocDate', labelKey: 'ocDate', titleKey: 'ocDateTitle', defaultLabel: 'OC DATE', defaultTitle: 'Occupancy Certificate Date', className: 'px-2 py-1.5 text-center border-r border-blue-200' },
  { key: 'renter', labelKey: 'renter', titleKey: 'renterTitle', defaultLabel: 'RENTER', defaultTitle: 'Renter / Tenant Name', className: 'px-2.5 py-1.5 text-left border-r border-blue-200' },
  { key: 'rent', labelKey: 'rent', titleKey: 'rentTitle', defaultLabel: 'RENT (M/Y)', defaultTitle: 'Rent (Monthly / Yearly)', className: 'px-2.5 py-1.5 text-right border-r border-blue-200' },
  { key: 'alv', labelKey: 'alv', titleKey: 'alvTitle', defaultLabel: 'ALV', defaultTitle: 'Annual Letting Value', className: 'px-2 py-1.5 text-right border-r border-blue-200' },
  { key: 'rv', labelKey: 'rv', titleKey: 'rvTitle', defaultLabel: 'RV', defaultTitle: 'Rateable Value', className: 'px-2 py-1.5 text-right border-r border-blue-200' },
  { key: 'cv', labelKey: 'cv', titleKey: 'cvTitle', defaultLabel: 'CV', defaultTitle: 'Capital Value', className: 'px-2 py-1.5 text-right border-r border-blue-200' },
  { key: 'tax', labelKey: 'tax', titleKey: 'taxTitle', defaultLabel: 'TAX', defaultTitle: 'Total Property Tax Amount', className: 'px-2.5 py-1.5 text-right border-r border-blue-200' },
  { key: 'img', labelKey: 'img', titleKey: 'imgTitle', defaultLabel: 'IMG', defaultTitle: 'Property Photos', className: 'px-1.5 py-1.5 text-center border-r border-blue-200' },
  { key: 'plan', labelKey: 'plan', titleKey: 'planTitle', defaultLabel: 'PLAN', defaultTitle: 'Floor Plan / Sanction Plan Document', className: 'px-1.5 py-1.5 text-center border-r border-blue-200' },
  { key: 'rules', labelKey: 'rules', titleKey: 'rulesTitle', defaultLabel: 'RULES', defaultTitle: 'Applied Assessment Rules & Discounts', className: 'px-1.5 py-1.5 text-center border-r border-blue-200' },
];

interface NewSurveyTableHeaderProps {
  taxMode?: PtisTaxMode;
  sort?: ApartmentSortState | null;
  onSort?: (panel: ApartmentSortPanel, column: string) => void;
  onClearSort?: () => void;
}

export const NewSurveyTableHeader: React.FC<NewSurveyTableHeaderProps> = ({ taxMode, sort, onSort, onClearSort }) => {
  const t = useTranslations('ptisRedesign.columns');
  const showRv = taxMode !== 'capital';
  const showCv = taxMode !== 'rateable';
  const visibleColumns = NEW_SURVEY_COLUMNS.filter((col) => {
    if (col.key === 'rv') return showRv;
    if (col.key === 'cv') return showCv;
    return true;
  });

  return (
    <PtisTableHeader
      panel="survey"
      columns={visibleColumns}
      translate={(key) => t(key)}
      theadClassName="sticky top-0 z-20 shadow-xs bg-blue-50/95 border-b border-blue-200"
      rowClassName="border-b border-blue-200 text-blue-950 font-bold uppercase tracking-wider text-[10px] h-11"
      sort={sort}
      onSort={onSort}
      onClearSort={onClearSort}
      resetSortLabel={t('resetSort')}
    />
  );
};
