import { TariffWorkbenchTabs } from '@/components/modules/water-bill/tariff-workbench/TariffWorkbenchTabs';
import { getTranslations } from 'next-intl/server';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function Layout({ children, params }: LayoutProps) {
  const { locale } = await params;
  
  // Using tariffWorkbench namespace for translations
  const t = await getTranslations({ locale, namespace: 'tariffWorkbench' });
  const title = t('title') || 'Tariff Workbench';
  const subtitle = t('subtitle') || 'Manage tariff configurations';
  
  const labels = {
    master: t('tabs.master') || 'Tariff Master',
    slabs: t('tabs.slabs') || 'Tariff Slabs Details',
    chargeDetails: t('tabs.chargeDetails') || 'Tariff Charge Details',
  };

  return (
    <div className='text-gray-900 h-full flex flex-col'>
      <div className="pb-0">
        <TariffWorkbenchTabs 
          locale={locale} 
          title={title} 
          subtitle={subtitle}   
          labels={labels} 
        />
      </div>
      <div className="mt-4 flex-1">
        {children}
      </div>
    </div>
  );
}
