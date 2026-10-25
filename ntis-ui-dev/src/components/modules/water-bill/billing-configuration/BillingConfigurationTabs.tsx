'use client';

import { Tabs, type TabItem } from '@/components/common';
import TableHeader from '@/components/common/TableHeader';
import { Calendar, RefreshCw } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

interface BillingConfigurationTabsProps {
  locale: string;
  title: string;
  subtitle: string;
  labels: {
    billingFrequency: string;
    billingPeriod: string;
  };
}

export function BillingConfigurationTabs({
  locale,
  title,
  subtitle,
  labels,
}: BillingConfigurationTabsProps) {
  const router = useRouter();
  const pathname = usePathname();

  const base = `/${locale}/water-bill/billing-configuration`;

  // Determine active tab based on pathname segment
  const activeTab = pathname.includes('billing-period') ? 'billing-period' : 'billing-frequency';

  const tabs: TabItem[] = [
    { value: 'billing-frequency', label: labels.billingFrequency, icon: RefreshCw, content: null },
    { value: 'billing-period', label: labels.billingPeriod, icon: Calendar, content: null },
  ];

  return (
    <TableHeader
      title={title}
      subtitle={subtitle}
      icon={Calendar}
      rightContent={
        <Tabs
          value={activeTab}
          variant="pills"
          items={tabs}
          onChange={(v) => {
            router.push(`${base}/${v}`);
          }}
        />
      }
    />
  );
}
