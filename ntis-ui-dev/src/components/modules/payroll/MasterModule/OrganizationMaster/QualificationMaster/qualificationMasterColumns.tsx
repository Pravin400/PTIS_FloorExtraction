import { StatusBadge } from '@/components/common';
import type { Column } from '@/components/common';
import type { QualificationMasterItem } from '@/types/payroll/MasterModule';

/**
 * Returns the table column configuration for Qualification Master.
 *
 * @param t       - Translation function for column labels
 * @param tCommon - Translation function from useTranslations('common')
 * @returns Array of column definitions
 */
export function getQualificationMasterColumns(
  t: (key: string) => string,
  tCommon: (key: string) => string
): Column<QualificationMasterItem>[] {
  return [
    {
      key: 'qualificationCode',
      label: t('list.table.qualificationCode'),
      width: '140px',
      headerClassName: '!rounded-none',
      render: (_, row) => (
        <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 inline-block">
          {row.qualificationCode}
        </span>
      ),
    },
    {
      key: 'qualificationName',
      label: t('list.table.qualificationName'),
      render: (_, row) => (
        <span className="text-xs font-medium text-slate-800 break-words">
          {row.qualificationName}
        </span>
      ),
    },
    {
      key: 'qualificationNameRegional',
      label: t('list.table.qualificationNameLocal'),
      render: (_, row) => (
        <span className="text-xs text-slate-700 break-words">
          {row.qualificationNameRegional || '—'}
        </span>
      ),
    },
    {
      key: 'isActive',
      label: t('list.table.status'),
      align: 'center',
      width: '120px',
      render: (_, row) => (
        <StatusBadge
          value={row.isActive}
          activeLabel={tCommon('status.active')}
          inactiveLabel={tCommon('status.inactive')}
        />
      ),
    },
  ];
}
