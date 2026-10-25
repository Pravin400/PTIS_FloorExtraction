'use client';

import { Tabs, type TabItem } from '@/components/common';
import TableHeader from '@/components/common/TableHeader';
import { Calendar, Layers, Receipt } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

interface TariffWorkbenchTabsProps {
  locale: string;
  title: string;
  subtitle: string;
  labels: {
    master: string;
    slabs: string;
    chargeDetails: string;
  };
}

export function TariffWorkbenchTabs({
  locale,
  title,
  subtitle,
  labels,
}: TariffWorkbenchTabsProps) {
  const router = useRouter();
  const pathname = usePathname();

  const base = `/${locale}/water-bill/tariff-workbench`;

  // Determine active tab based on pathname segment
  let activeTab = 'master';
  if (pathname.includes('/slabs')) {
    activeTab = 'slabs';
  } else if (pathname.includes('/charge-details')) {
    activeTab = 'charge-details';
  }

  const tabs: TabItem[] = [
    { value: 'master', label: labels.master, icon: Calendar, content: null },
    { value: 'slabs', label: labels.slabs, icon: Layers, content: null },
    { value: 'charge-details', label: labels.chargeDetails, icon: Receipt, content: null },
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
