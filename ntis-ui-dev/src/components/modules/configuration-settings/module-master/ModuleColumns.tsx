'use client';

import { Briefcase } from 'lucide-react';
import { Column } from '@/components/common/MasterTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ModuleMaster } from '@/types/moduleMaster.types';

export interface ModuleMasterTableRow extends ModuleMaster, Record<string, unknown> {}

export interface ModuleColumnLabels {
  moduleCode?: string;
  moduleName?: string;
  department?: string;
  localName?: string;
  description?: string;
}

export const getModuleColumns = (
  t: (key: string, values?: Record<string, string | number>) => string,
  tCommon: (key: string) => string,
  labels?: ModuleColumnLabels
): Column<ModuleMasterTableRow>[] => [
  {
    key: 'moduleCode',
    label: labels?.moduleCode || t('table.code'),
    width: '15%',
    render: (value) => (
      <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-semibold text-blue-700 bg-blue-50 font-mono border border-blue-300 rounded-md">
        {value ? String(value) : '—'}
      </span>
    ),
  },
  {
    key: 'moduleName',
    label: labels?.moduleName
      ? labels.department
        ? `${labels.moduleName} & ${labels.department}`
        : labels.moduleName
      : t('table.name'),
    width: '25%',
    render: (_, row) => (
      <div className="space-y-1">
        <p className="font-medium flex items-center gap-2 text-gray-800">
          <Briefcase className="w-4 h-4 text-blue-500" />
          {row.moduleName || '—'}
        </p>
        <p className="text-xs text-gray-500 ml-6">{row.departmentName || '—'}</p>
      </div>
    ),
  },
  {
    key: 'moduleNameLocal',
    label: labels?.localName || t('table.localName'),
    width: '20%',
    render: (value) => <span className="text-gray-700">{value ? String(value) : '—'}</span>,
  },
  {
    key: 'moduleDescription',
    label: labels?.description || t('table.description'),
    width: '25%',
    render: (value) => <span className="text-gray-600 text-sm">{value ? String(value) : '—'}</span>,
  },
  {
    key: 'isActive',
    label: t('table.status'),
    width: '15%',
    render: (value) => (
      <StatusBadge
        value={value as boolean}
        activeLabel={tCommon('status.active')}
        inactiveLabel={tCommon('status.inactive')}
      />
    ),
  },
];
