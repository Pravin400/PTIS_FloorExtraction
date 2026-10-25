/**
 * DashboardTable - Server Component
 * Renders table with SSR translations
 */

import { getTranslations } from 'next-intl/server';
import { Table } from '@/components/common';
import { TableColumn } from '@/types/common.types';
import type { DashboardData } from '@/types/service.types';
import { DeleteButton } from './DeleteButton';

interface DashboardTableProps {
  data: DashboardData[];
}

export async function DashboardTable({ data }: DashboardTableProps) {
  const tDashboard = await getTranslations('dashboard');
  const tCommon = await getTranslations('common');

  const columns: TableColumn<DashboardData>[] = [
    { key: 'route', label: tDashboard('table.columns.route') },
    {
      key: 'status',
      label: tDashboard('table.columns.status'),
      render: (value: unknown) => {
        const statusValue = String(value);
        const statusKey = statusValue.toLowerCase() as 'active' | 'delayed' | 'completed';
        const statusText = tCommon(`status.${statusKey}`);

        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              statusValue === 'Active'
                ? 'bg-green-100 text-green-800'
                : statusValue === 'Delayed'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
            }`}
          >
            {statusText}
          </span>
        );
      },
    },
    { key: 'vehicles', label: tDashboard('table.columns.vehicles') },
    {
      key: 'lastUpdate',
      label: tDashboard('table.columns.lastUpdate'),
      render: (value: unknown) => new Date(String(value)).toLocaleTimeString(),
    },
    {
      key: 'id',
      label: tDashboard('table.columns.actions'),
      render: (value: unknown) => (
        <DeleteButton
          routeId={String(value)}
          deleteLabel={tCommon('buttons.delete')}
          errorMessage={tCommon('errors.deleteError')}
        />
      ),
    },
  ];

  return <Table data={data} columns={columns} />;
}
