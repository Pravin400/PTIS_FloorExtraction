import { getTranslations } from 'next-intl/server';
import { getAliasLabelsForLocale } from '@/lib/i18n/alias-labels';
import { WeightageMasterHeader } from '../../../../components/modules/property-tax/weightage-mastercv/WeightageMasterTabs';
import { WeightageMasterErrorProvider } from '../../../../components/modules/property-tax/weightage-mastercv/WeightageMasterErrorContext';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

const Layout = async ({ children, params }: LayoutProps) => {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'weightageMaster' });
  const labels = await getAliasLabelsForLocale(locale);
  const floorAlias = labels['Floor'] || t('defaults.floor') || 'Floor';

  const tabLabels = {
    floor: t('tabs.floor', { floor: floorAlias }),
    nature: t('tabs.nature'),
    subType: t('tabs.subType'),
    age: t('tabs.age'),
  };

  return (
    <WeightageMasterErrorProvider>
      <div className='text-gray-900'>
        <WeightageMasterHeader 
          locale={locale} 
          title={t('title')}
          subtitle={t('subtitle')}
          labels={tabLabels} 
        />
        <div className="mt-0">
          {children}
        </div>
      </div>
    </WeightageMasterErrorProvider>
  );
};

export default Layout;