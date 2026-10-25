'use client';

import { Users, UserCheck, UserX, Award, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/common';
import { useTranslations } from 'next-intl';
import { User, UserStatsProps } from '@/types/user-management';

import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';

const STAT_COLOR_MAP = {
  blue: {
    text: 'text-blue-700',
    shadow: 'shadow-blue-500/20',
    bgGradient: 'from-blue-500/10 via-blue-500/5 to-transparent',
    iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600',
  },
  emerald: {
    text: 'text-emerald-700',
    shadow: 'shadow-emerald-500/20',
    bgGradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
    iconBg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
  },
  rose: {
    text: 'text-rose-700',
    shadow: 'shadow-rose-500/20',
    bgGradient: 'from-rose-500/10 via-rose-500/5 to-transparent',
    iconBg: 'bg-gradient-to-br from-rose-500 to-rose-600',
  },
  orange: {
    text: 'text-orange-700',
    shadow: 'shadow-orange-500/20',
    bgGradient: 'from-orange-500/10 via-orange-500/5 to-transparent',
    iconBg: 'bg-gradient-to-br from-orange-500 to-orange-600',
  },
  indigo: {
    text: 'text-indigo-700',
    shadow: 'shadow-indigo-500/20',
    bgGradient: 'from-indigo-500/10 via-indigo-500/5 to-transparent',
    iconBg: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
  },
  slate: {
    text: 'text-slate-700',
    shadow: 'shadow-slate-500/20',
    bgGradient: 'from-slate-500/10 via-slate-500/5 to-transparent',
    iconBg: 'bg-gradient-to-br from-slate-500 to-slate-600',
  },
};

export function UserStats({ users, cardFilter, onCardClick }: UserStatsProps) {
  const t = useTranslations('userManagement');
  const userLabel = useAliasLabel('User', t('aliasFallback.user'));

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === 'Active').length;
  const inactiveUsers = users.filter((u) => u.status === 'Inactive').length;

  const getProductivity = (user: User) => {
    const deptCount = user.departmentNames.length;
    const moduleCount = user.moduleNames.length;
    return { deptCount, moduleCount, score: deptCount * 10 + moduleCount };
  };

  const sortedByProductivity = [...users].sort(
    (a, b) => getProductivity(b).score - getProductivity(a).score
  );
  const highestUser = sortedByProductivity[0];
  const lowestUser = users.length > 1 ? sortedByProductivity[users.length - 1] : null;

  const highestStats = highestUser
    ? getProductivity(highestUser)
    : { deptCount: 0, moduleCount: 0 };
  const lowestStats = lowestUser ? getProductivity(lowestUser) : { deptCount: 0, moduleCount: 0 };

  const stats = [
    {
      id: 'all',
      label: t('stats.totalUsers', { user: userLabel }),
      value: totalUsers,
      icon: Users,
      color: 'indigo',
      description: t('stats.registeredUsers', { user: userLabel }),
    },
    {
      id: 'active',
      label: t('stats.activeUsers', { user: userLabel }),
      value: activeUsers,
      icon: UserCheck,
      color: 'emerald',
      description: t('stats.currentlyActive'),
    },
    {
      id: 'inactive',
      label: t('stats.inactiveUsers', { user: userLabel }),
      value: inactiveUsers,
      icon: UserX,
      color: 'slate',
      description: t('stats.deactivatedUsers', { user: userLabel }),
    },
    {
      id: 'highest',
      label: t('stats.highestProductive'),
      value: highestUser?.userName || t('stats.notAvailable'),
      subValue: highestUser
        ? t('stats.productivitySub', {
            depts: highestStats.deptCount,
            modules: highestStats.moduleCount,
          })
        : t('stats.noData'),
      icon: Award,
      color: 'orange',
      description: t('stats.mostAssigned', { user: userLabel }),
    },
    {
      id: 'lowest',
      label: t('stats.lowestProductive'),
      value: lowestUser?.userName || t('stats.notAvailable'),
      subValue: lowestUser
        ? t('stats.productivitySub', {
            depts: lowestStats.deptCount,
            modules: lowestStats.moduleCount,
          })
        : t('stats.noData'),
      icon: AlertTriangle,
      color: 'rose',
      description: t('stats.leastAssigned', { user: userLabel }),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {stats.map((stat, index) => {
        const StatIcon = stat.icon;
        const isActive = cardFilter === stat.id;
        return (
          <div
            key={index}
            onClick={() =>
              onCardClick(stat.id as 'all' | 'active' | 'inactive' | 'highest' | 'lowest')
            }
            className="cursor-pointer animate-in fade-in slide-in-from-bottom-4 duration-500"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <Card
              className={`relative overflow-hidden rounded-2xl border bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group ${
                isActive ? 'ring-2 ring-offset-2 ring-indigo-500 shadow-2xl' : ''
              }`}
            >
              <div
                className={`absolute inset-0 bg-linear-to-br ${STAT_COLOR_MAP[stat.color as keyof typeof STAT_COLOR_MAP].bgGradient} ${isActive ? 'opacity-100' : ''}`}
              />
              <CardContent className="relative p-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5 flex-1">
                    <p className="text-[10px] text-black font-medium tracking-wide uppercase">
                      {stat.label}
                    </p>
                    <p
                      className={`${
                        typeof stat.value === 'number' ? 'text-2xl' : 'text-sm'
                      } font-bold tracking-tight ${STAT_COLOR_MAP[stat.color as keyof typeof STAT_COLOR_MAP].text} truncate`}
                    >
                      {stat.value}
                    </p>
                    {stat.subValue && (
                      <p className="text-[9px] text-black font-medium">{stat.subValue}</p>
                    )}
                  </div>
                  <div
                    className={`p-2 rounded-lg ${STAT_COLOR_MAP[stat.color as keyof typeof STAT_COLOR_MAP].iconBg} shadow-md ${STAT_COLOR_MAP[stat.color as keyof typeof STAT_COLOR_MAP].shadow} ring-1 ring-white/20 transition-transform duration-300 group-hover:scale-110 ${
                      isActive ? 'scale-110' : ''
                    }`}
                  >
                    <StatIcon className="w-4 h-4 text-white" strokeWidth={2.5} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
