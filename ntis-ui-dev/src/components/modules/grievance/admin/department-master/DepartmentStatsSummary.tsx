import { Building2, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DashboardCard } from '@/components/common/DashboardCard';
import type { DepartmentStats } from '@/types/grievance/department-master.types';

interface DepartmentStatsSummaryProps {
  stats: DepartmentStats;
  className?: string;
}

export function DepartmentStatsSummary({ stats, className = '' }: DepartmentStatsSummaryProps) {
  const t = useTranslations('grievance');

  const statItems = [
    {
      label: t('totalDepartments'),
      value: stats.total,
      icon: <Building2 className="w-5 h-5 text-emerald-600" />,
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      valueColor: 'text-slate-900',
    },
    {
      label: t('activeDepartments'),
      value: stats.active,
      icon: <CheckCircle2 className="w-5 h-5 text-teal-600" />,
      iconBg: 'bg-teal-50 text-teal-600 border-teal-200',
      valueColor: 'text-slate-900',
    },
    {
      label: t('inactiveDepartments'),
      value: stats.inactive,
      icon: <AlertCircle className="w-5 h-5 text-amber-600" />,
      iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
      valueColor: stats.inactive > 0 ? 'text-amber-600' : 'text-slate-900',
    },
    {
      label: t('grievancesManaged'),
      value: stats.totalGrievances.toLocaleString(),
      icon: <FileText className="w-5 h-5 text-blue-600" />,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-200',
      valueColor: 'text-slate-900',
    },
  ];

  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 ${className}`}>
      {statItems.map((item, idx) => (
        <DashboardCard
          key={idx}
          label={item.label}
          value={item.value}
          icon={item.icon}
          iconBg={item.iconBg}
          valueColor={item.valueColor}
          className="rounded-xl border-slate-200 px-2.5 sm:px-4 py-2.5 sm:py-3 shadow-2xs hover:shadow-xs transition-shadow"
        />
      ))}
    </div>
  );
}
