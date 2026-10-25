'use client';

import { Column, Badge } from "@/components/common";
import { ProgressBar } from "@/components/common/ProgressBar";
import { DetailedCoverageItem } from "@/types/PropertyMedia/PropertyMedia.types";
import { getBadgeColor } from "@/lib/utils/PropertyMedia/propertyMediaHelper";

function formatNumberCount(val: string | number | undefined | null): string {
  if (val === null || val === undefined || val === '') return '-';
  const num = Number(val);
  return isNaN(num) ? '-' : num.toLocaleString();
}

export const getCoverageColumns = (
  t?: (key: string) => string,
  categoryLabel?: string
): Column<DetailedCoverageItem>[] => [
    {
      key: 'category',
      label: categoryLabel ?? (t ? t('detailedCoverageTable.columns.category') : "Category"),
      width: '12%',
      headerClassName: 'border-r border-blue-200/80',
      cellClassName: 'border-r border-blue-100 text-slate-700 font-normal',
    },

    {
      key: 'photoTypeName',
      label: t ? t('detailedCoverageTable.columns.typeSubtype') : "Type / Subtype",
      width: '20%',
      headerClassName: 'border-r border-blue-200/80',
      cellClassName: 'border-r border-blue-100',
      render: (_, row) => (
        <span
          className={
            row.requirement === 'Mandatory'
              ? 'font-extrabold'
              : 'text-slate-700'
          }
        >
 {String(row.photoTypeName ?? '-')}
        </span>
      ),
    },

    {
      key: 'requirement',
      label: t ? t('detailedCoverageTable.columns.requirement') : "Requirement",
      width: '12%',
      headerClassName: 'border-r border-blue-200/80',
      cellClassName: 'border-r border-blue-100 text-center',
      render: (_, row) => (
        row.requirement ? (
          <div className="flex items-center gap-3">
            <Badge variant={getBadgeColor(row.requirement)} size="sm">
              {row.requirement}
            </Badge>
          </div>
        ) : (
          <span className="text-slate-400 font-medium">-</span>
        )
      ),
    },

    {
      key: 'applicable',
      label: t ? t('detailedCoverageTable.columns.applicable') : "Applicable",
      width: '10%',
      headerClassName: 'border-r border-blue-200/80',
      cellClassName: 'border-r border-blue-100 text-slate-700',
      render: (_, row) => formatNumberCount(row.applicable),
    },

    {
      key: 'available',
      label: t ? t('detailedCoverageTable.columns.available') : "Available",
      width: '10%',
      headerClassName: 'border-r border-blue-200/80',
      cellClassName: 'border-r border-blue-100 text-slate-700',
      render: (_, row) => formatNumberCount(row.available),
    },

    {
      key: 'missing',
      label: t ? t('detailedCoverageTable.columns.missing') : "Missing",
      width: '10%',
      headerClassName: 'border-r border-blue-200/80',
      cellClassName: 'border-r border-blue-100',
      render: (_, row) => formatNumberCount(row.missing),
    },

    {
      key: 'coveragePercentage',
      label: t ? t('detailedCoverageTable.columns.coverage') : "Coverage",
      width: '18%',
      headerClassName: 'border-r border-blue-200/80',
      cellClassName: 'border-r border-blue-100',
      render: (value, row) => {
        const raw = row.coveragePercentage ?? value;
        const percentage = typeof raw === 'string' ? parseFloat(raw.replace('%', '')) : Number(raw ?? 0);

        return (
          <div className="flex items-center gap-3">
            <ProgressBar percentage={isNaN(percentage) ? 0 : percentage} showPercentage={true} />
          </div>
        );
      },
    },
  ];


