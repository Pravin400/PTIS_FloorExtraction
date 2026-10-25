import { StatusBadge } from '@/components/common';
import type { Column } from '@/components/common';
import type { EmpStatusMasterItem } from '@/types/payroll/MasterModule';

/**
 * Returns the table column configuration for Employee Status Master.
 *
 * @param t       - Translation function for column labels
 * @param tCommon - Translation function from useTranslations('common')
 * @returns Array of column definitions
 */
export function getEmpStatusColumns(
  t: (key: string) => string,
  tCommon: (key: string) => string
): Column<EmpStatusMasterItem>[] {
  return [
    {
      key: 'employeeStatusCode',
      label: t('statusCode'),
      width: '120px',
      render: (_, row) => (
        <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 inline-block">
          {row.employeeStatusCode}
        </span>
      ),
    },
    {
      key: 'employeeStatus',
      label: t('statusName'),
      render: (_, row) => (
        <span className="text-xs font-medium text-slate-800 break-words">{row.employeeStatus}</span>
      ),
    },
    {
      key: 'employeeStatusMarathi',
      label: t('statusNameMarathi'),
      render: (_, row) => (
        <span className="text-xs text-slate-700 break-words">
          {row.employeeStatusMarathi || '—'}
        </span>
      ),
    },
    {
      key: 'description',
      label: t('description'),
      render: (_, row) => (
        <span className="text-xs text-slate-600 line-clamp-1" title={row.description || undefined}>
          {row.description || '—'}
        </span>
      ),
    },
    {
      key: 'isActive',
      label: t('status'),
      align: 'center',
      width: '100px',
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
