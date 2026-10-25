import { BillingConfigurationTabs } from '@/components/modules/water-bill/billing-configuration/BillingConfigurationTabs';

import { getTranslations } from 'next-intl/server';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function Layout({ children, params }: LayoutProps) {
  const { locale } = await params;
  
  // We use billingFrequencyMaster namespace as the parent translation file for these configuration tabs
  const t = await getTranslations({ locale, namespace: 'billingFrequencyMaster.billingConfiguration' });
  const title = t('title');
  const subtitle = t('subtitle');
  
  const labels = {
    billingFrequency: t('tabs.billingFrequencies'),
    billingPeriod: t('tabs.billingPeriods'),
  };

  return (
    <div className='text-gray-900 h-full flex flex-col'>
      <div className="pb-0">
        <BillingConfigurationTabs 
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
