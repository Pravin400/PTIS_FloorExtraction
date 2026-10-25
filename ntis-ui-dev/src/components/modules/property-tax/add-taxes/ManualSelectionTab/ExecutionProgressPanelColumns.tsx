/* eslint-disable @typescript-eslint/no-explicit-any */
import { Column } from "@/components/common/MasterTable";

export const getProgressPanelColumns = (t: (key: string) => string): Column<any>[] => [
  { 
    key: 'propertyNo', 
    label: t('progressPanel.columns.propertyNo'), 
    width: '18%',
    render: (_, record) => {
      const ward = record.ward || '';
      const propNo = record.propertyNo || '';
      const partNo = record.partitionNo || '';
      return `${ward}-${propNo}${partNo ? `-${partNo}` : ''}`;
    }
  },
  { key: 'zone', label: t('progressPanel.columns.zone'), width: '12%' },
  { key: 'owner', label: t('progressPanel.columns.owner'), width: '15%' },
  { 
    key: 'taxHead', 
    label: t('progressPanel.columns.taxHead'), 
    width: '15%',
    render: (val) => <div className="text-[10px] leading-tight text-gray-500">{val || '-'}</div>
  },
  { 
    key: 'amount', 
    label: t('progressPanel.columns.amount'), 
    width: '8%',
    render: (val) => `₹${val ?? 0}`
  },
  { 
    key: 'status', 
    label: t('progressPanel.columns.status'), 
    width: '10%',
    render: (val) => {
      let label = val;
      let colorClass = 'bg-gray-100 text-gray-700';

      if (val === 'Failed') {
        label = t('progressPanel.status.failed');
        colorClass = 'bg-red-50 text-red-600';
      } else if (val === 'Pending') {
        label = t('progressPanel.status.pending');
        colorClass = 'bg-orange-50 text-orange-600';
      } else if (val === 'Success' || val === 'Added') {
        label = t('progressPanel.status.added');
        colorClass = 'bg-green-50 text-green-600';
      } else if (val === 'Skipped') {
        label = t('progressPanel.status.skipped');
        colorClass = 'bg-gray-50 text-gray-500';
      }
      
      return (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colorClass}`}>
          {label}
        </span>
      );
    }
  },
  { 
    key: 'message', 
    label: t('progressPanel.columns.message'), 
    width: '14%',
    render: (val) => <div className="text-xs text-gray-600">{val || '-'}</div>
  },
];
