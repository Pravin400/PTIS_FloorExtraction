'use client';

import React from 'react';
import { Card } from '@/components/common/Card';
import { Monitor, FolderTree, CheckCircle, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ManagementStatsProps {
  totalScreens: number;
  totalGroups: number;
  activeScreens: number;
  inactiveScreens: number;
  screenLabel?: string;
  screenGroupLabel?: string;
}

export const ManagementStats: React.FC<ManagementStatsProps> = ({
  totalScreens,
  totalGroups,
  activeScreens,
  inactiveScreens,
  screenLabel,
  screenGroupLabel,
}) => {
  const t = useTranslations('screenAccess');

  const resolvedScreenLabel = screenLabel || t('aliasFallback.screen');
  const resolvedGroupLabel = screenGroupLabel || t('aliasFallback.screenGroup');

  const stats = React.useMemo(
    () => [
      {
        id: 'total-screens',
        label: t('stats.totalScreens', { screen: resolvedScreenLabel }),
        value: totalScreens,
        icon: Monitor,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
      },
      {
        id: 'total-groups',
        label: t('stats.totalGroups', { screenGroup: resolvedGroupLabel }),
        value: totalGroups,
        icon: FolderTree,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
      },
      {
        id: 'active-screens',
        label: t('stats.activeScreens', { screen: resolvedScreenLabel }),
        value: activeScreens,
        icon: CheckCircle,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
      },
      {
        id: 'inactive-screens',
        label: t('stats.inactiveScreens', { screen: resolvedScreenLabel }),
        value: inactiveScreens,
        icon: XCircle,
        color: 'text-rose-600',
        bgColor: 'bg-rose-50',
      },
    ],
    [
      totalScreens,
      totalGroups,
      activeScreens,
      inactiveScreens,
      resolvedScreenLabel,
      resolvedGroupLabel,
      t,
    ]
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => (
        <Card
          key={stat.id}
          className="p-4 flex items-center gap-4 border-none shadow-sm bg-white hover:shadow-md transition-shadow"
        >
          <div className={`${stat.bgColor} p-3 rounded-xl`}>
            <stat.icon className={`h-6 w-6 ${stat.color}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        </Card>
      ))}
    </div>
  );
};
