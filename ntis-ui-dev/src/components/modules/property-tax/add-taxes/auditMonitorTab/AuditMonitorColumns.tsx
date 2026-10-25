/* eslint-disable @typescript-eslint/no-explicit-any, i18next/no-literal-string */
import { Column } from '@/components/common/MasterTable';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { Tooltip } from '@/components/common/Tooltip';

export interface JobAuditItem {
  id: number;
  jobId: string;
  dateTime: string;
  operation: string;
  doneBy: string;
  scope: string;
  startTime: string;
  completeTime: string;
  duration: string;
  records: string;
  status: string;
  remarks?: string | null;
}

export const getAuditColumns = (t: any): Column<any>[] => [
  { key: 'jobId', label: t('audit.columns.jobId'), width: '10%' },
  {
    key: 'dateTime',
    label: t('audit.columns.dateTime'),
    width: '12%',
    render: (val, row) => {
      if (!val) return '-';
      let date = new Date(String(val));
      if (row?.status?.toLowerCase() === 'scheduled' && typeof window !== 'undefined') {
        const storedSkew = window.sessionStorage.getItem('ntis_clock_skew_ms');
        if (storedSkew) {
          const skewMs = Number(storedSkew);
          if (!isNaN(skewMs)) {
            date = new Date(date.getTime() + skewMs);
          }
        }
      }
      return date.toLocaleString();
    },
  },
  { key: 'operation', label: t('audit.columns.operation'), width: '10%' },
  { key: 'doneBy', label: t('audit.columns.doneBy'), width: '10%' },
  { key: 'scope', label: t('audit.columns.scope'), width: '12%' },
  {
    key: 'startTime',
    label: t('audit.columns.startTime'),
    width: '10%',
    render: (val, row) => {
      if (!val) return '-';
      let date = new Date(String(val));
      if (row?.status?.toLowerCase() === 'scheduled' && typeof window !== 'undefined') {
        const storedSkew = window.sessionStorage.getItem('ntis_clock_skew_ms');
        if (storedSkew) {
          const skewMs = Number(storedSkew);
          if (!isNaN(skewMs)) {
            date = new Date(date.getTime() + skewMs);
          }
        }
      }
      return date.toLocaleTimeString();
    },
  },
  {
    key: 'completeTime',
    label: t('audit.columns.completeTime'),
    width: '10%',
    render: (val) => (val ? new Date(String(val)).toLocaleTimeString() : '-'),
  },
  { key: 'duration', label: t('audit.columns.duration'), width: '8%' },
  { key: 'records', label: t('audit.columns.records'), width: '8%' },
  {
    key: 'status',
    label: t('audit.columns.status'),
    width: '10%',
    render: (val) => {
      const s = String(val).toLowerCase();
      let classes = 'bg-slate-50 text-slate-700 border-slate-200';
      if (s === 'completed' || s === 'success') {
        classes = 'bg-green-50 text-green-700 border-green-200';
      } else if (s === 'failed' || s === 'error') {
        classes = 'bg-red-50 text-red-700 border-red-200';
      } else if (s === 'running' || s === 'inprogress') {
        classes = 'bg-blue-50 text-blue-700 border-blue-200';
      }
      const cleanStatus = s === 'inprogress' ? 'inProgress' : s;
      const statusKey = `audit.status.${cleanStatus}`;
      const statusLabel = t.has(statusKey) ? t(statusKey) : val;
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${classes}`}>
          {statusLabel}
        </span>
      );
    },
  },
  {
    key: 'remarks',
    label: t('audit.columns.remarks'),
    width: '10%',
    render: (val) => (
      <Tooltip content={String(val || '-')} placement="top">
        <span className="text-xs text-gray-500 block truncate max-w-[120px] cursor-help">
          {val || '-'}
        </span>
      </Tooltip>
    ),
  },
];

export const getDetailColumns = (t: any): Column<any>[] => [
  {
    key: 'propertyNo',
    label: t('audit.detailColumns.propertyNoUpicId', { fallback: 'Property No / UPIC ID' }),
    width: '15%',
    render: (_, row) => {
      const propStr = [row.wardNo || row.ward, row.propertyNo, row.partitionNo].filter(Boolean).join('-');
      return row.upicid ? `${propStr} / ${row.upicid}` : propStr;
    },
  },
  { key: 'owner', label: t('audit.detailColumns.owner'), width: '20%' },
  {
    key: 'amount',
    label: t('audit.detailColumns.taxHeadAmount'),
    width: '45%',
    render: (val, row) => (
      <div className="flex flex-col gap-0.5 max-w-md py-1">
        <div className="text-xs text-gray-600 break-words leading-relaxed whitespace-pre-wrap">{row.taxHead || '-'}</div>
        <div className="text-[11px] font-semibold text-gray-900 mt-1">₹{val ?? 0}</div>
      </div>
    ),
  },
  {
    key: 'status',
    label: t('audit.detailColumns.status'),
    width: '10%',
    render: (val) => {
      const isSuccess = String(val).toLowerCase() === 'added' || String(val).toLowerCase() === 'success';
      const cleanVal = String(val).toLowerCase();
      const statusKey = `progressPanel.status.${cleanVal}`;
      const statusLabel = t.has(statusKey) ? t(statusKey) : val;
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${isSuccess ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {isSuccess ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
          {statusLabel}
        </span>
      );
    },
  },
  {
    key: 'message',
    label: t('audit.detailColumns.message'),
    width: '10%',
    render: (val) => (
      <Tooltip content={String(val || '-')} placement="top">
        <span className="text-xs text-gray-500 block truncate max-w-[200px] cursor-help">
          {val || '-'}
        </span>
      </Tooltip>
    ),
  },
];
