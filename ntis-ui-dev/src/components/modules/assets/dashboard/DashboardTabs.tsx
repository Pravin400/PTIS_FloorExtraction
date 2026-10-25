'use client';

import { Tabs } from '@/components/common';
import { BarChart3, DollarSign } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';

export function DashboardTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('assetmasterdashboard');

  const activeTab = pathname.includes('/revenue-dashboard')
    ? 'revenue-dashboard'
    : 'master-dashboard';

  const onTabChange = (value: string | number) => {
    router.push(`/${locale}/assets/dashboard/${value}`);
  };

  return (
    <Tabs
      value={activeTab}
      onChange={onTabChange}
      variant="pills"
      size="sm"
      justify="between"
      className="w-full"
    >
      <Tabs.TabList className="bg-slate-100 rounded-xl p-1 shadow-sm border border-slate-200">
        <Tabs.Tab
          value="master-dashboard"
          icon={BarChart3}
          className="
            text-sm
            font-semibold
            rounded-lg
            justify-center
            aria-selected:bg-blue-600
            aria-selected:text-white
          "
        >
          {t('masterDashboard')}
        </Tabs.Tab>

        <Tabs.Tab
          value="revenue-dashboard"
          icon={DollarSign}
          className="
            text-sm
            font-semibold
            rounded-lg
            justify-center
            aria-selected:bg-blue-600
            aria-selected:text-white
          "
        >
          {t('revenueDashboard')}
        </Tabs.Tab>
      </Tabs.TabList>
    </Tabs>
  );
}