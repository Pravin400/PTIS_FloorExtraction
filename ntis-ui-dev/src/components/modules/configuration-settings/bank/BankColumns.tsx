'use client';

import { Building2, MapPin } from 'lucide-react';
import { Column } from '@/components/common/MasterTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { BankMasterData } from '@/types/bank-master.types';

export interface BankMasterTableRow extends BankMasterData, Record<string, unknown> {}

export interface BankColumnLabels {
  bankCode?: string;
  bankName?: string;
  branchName?: string;
  ifscCode?: string;
  location?: string;
}

export const getBankColumns = (
  t: (key: string) => string,
  tCommon: (key: string) => string,
  labels?: BankColumnLabels
): Column<BankMasterTableRow>[] => [
  {
    key: 'bankCode',
    label: labels?.bankCode || t('table.code'),
    width: '10%',
    render: (value) => (
      <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-semibold text-blue-700 bg-blue-50 font-mono border border-blue-300 rounded-md">
        {value ? String(value) : '—'}
      </span>
    ),
  },
  {
    key: 'bankName',
    label: labels?.bankName
      ? labels.branchName
        ? `${labels.bankName} & ${labels.branchName}`
        : labels.bankName
      : t('table.bankBranch'),
    width: '25%',
    render: (_, row) => (
      <div className="space-y-1">
        <p className="font-medium flex items-center gap-2 text-gray-800">
          <Building2 className="w-4 h-4 text-blue-500" />
          {row.bankName || '—'}
        </p>
        <p className="text-xs text-gray-500 ml-6">{row.branchName || '—'}</p>
      </div>
    ),
  },
  {
    key: 'ifscCode',
    label: labels?.ifscCode || t('table.ifscCode'),
    width: '13%',
    render: (value) => (
      <span className="font-mono text-xs text-gray-700 bg-gray-50 px-2 py-1 rounded border border-gray-200">
        {value ? String(value) : '—'}
      </span>
    ),
  },
  {
    key: 'city',
    label: labels?.location || t('table.location'),
    width: '25%',
    render: (_, row) => (
      <div className="space-y-0.5">
        <p className="font-medium text-sm flex items-center gap-1.5 text-gray-700">
          <MapPin className="w-3.5 h-3.5 text-gray-400" />
          {row.city || '—'}
        </p>
        <div className="flex items-center gap-2 text-xs text-gray-500 ml-5">
          <span>{row.state || '—'}</span>
          <span className="text-gray-300">•</span>
          <span>{row.pincode || '—'}</span>
        </div>
      </div>
    ),
  },
  {
    key: 'isActive',
    label: t('table.status'),
    width: '10%',
    render: (value) => (
      <StatusBadge
        value={value as boolean}
        activeLabel={tCommon('status.active')}
        inactiveLabel={tCommon('status.inactive')}
      />
    ),
  },
];
