import type { Column } from '@/components/common/MasterTable';
import type { ZoneDivisionMasterItem } from '@/types/payroll/MasterModule';
import { StatusBadge, TruncatedText } from '@/components/common';

export function getZoneDivisionColumns(
  tCol: (key: string) => string,
  tCommon: (key: string) => string
): Column<ZoneDivisionMasterItem>[] {
  return [
    {
      key: 'zoneDivisionCode',
      label: tCol('officeCode'),
      width: '140px',
      render: (_, row) => (
        <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 inline-block">
          {row.zoneDivisionCode}
        </span>
      ),
    },
    {
      key: 'zoneDivisionName',
      label: tCol('officeName'),
      render: (_, row) => (
        <span className="text-xs font-medium text-slate-800 break-words">
          {row.zoneDivisionName}
        </span>
      ),
    },
    {
      key: 'zoneDivisionNameRegional',
      label: tCol('officeNameRegional'),
      render: (_, row) => (
        <span className="text-xs text-slate-700 break-words">
          {row.zoneDivisionNameRegional || '—'}
        </span>
      ),
    },
    {
      key: 'address',
      label: tCol('address'),
      render: (_, row) => (
        <TruncatedText
          text={row.address || '—'}
          maxLength={60}
          className="text-xs text-slate-600"
        />
      ),
    },
    {
      key: 'isActive',
      label: tCol('status'),
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
