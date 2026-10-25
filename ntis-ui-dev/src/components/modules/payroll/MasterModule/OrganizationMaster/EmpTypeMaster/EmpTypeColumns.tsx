import { StatusBadge } from '@/components/common';
import type { Column } from '@/components/common';
import type { EmpTypeMasterItem } from '@/types/payroll/MasterModule';

/**
 * Returns the table column configuration for Employee Type Master.
 *
 * @param t       - Translation function for column labels
 * @param tCommon - Translation function from useTranslations('common')
 * @returns Array of column definitions
 */
export function getEmpTypeColumns(
  t: (key: string) => string,
  tCommon: (key: string) => string
): Column<EmpTypeMasterItem>[] {
  return [
    {
      key: 'employeeTypeCode',
      label: t('typeCode'),
      width: '120px',
      render: (_, row) => (
        <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 inline-block">
          {row.employeeTypeCode}
        </span>
      ),
    },
    {
      key: 'employeeTypeName',
      label: t('typeName'),
      render: (_, row) => (
        <span className="text-xs font-medium text-slate-800 break-words">
          {row.employeeTypeName}
        </span>
      ),
    },
    {
      key: 'employeeTypeNameMarathi',
      label: t('typeNameMarathi'),
      render: (_, row) => (
        <span className="text-xs text-slate-700 break-words">
          {row.employeeTypeNameMarathi || '—'}
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
