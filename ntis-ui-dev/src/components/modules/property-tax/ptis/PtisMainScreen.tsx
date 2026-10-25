'use client';
 
import React, { useState, useTransition } from 'react';
import { cn } from '@/lib/utils/cn';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Tabs } from '@/components/common/Tabs';
import {
  Building,
  Home,
  Building2,
  Calculator,
  GitMerge,
  IndianRupee,
  Loader2
} from 'lucide-react';
 
const { TabList, Tab } = Tabs;
 
import { DualMethodSection } from '@/components/modules/property-tax/ptis/dualmethod';
import AppartmentQCSection from '@/components/modules/property-tax/ptis/appartmentQC/AppartmentQCSection';
import { Button } from '@/components/common';
import { AppliedRulesDrawer } from './AppliedRulesDrawer';
import { PtisSearchParams } from '@/lib/utils/params';
import type { DualMethodSectionData } from '@/components/modules/property-tax/ptis/dualmethod/dual-method-data';
import type { ApartmentQCDetail, PagedResponse } from '@/types/apartmentQC.types';
import type { PropertyRuleLogItem } from '@/types/rule-engine';
import { useOptionalPtisNavigation } from './shared/PtisNavigationContext';
 
interface PtisMainScreenProps {
  locale: string;
  propertyId?: number;
  categoryId?: number;
  ptisParams: PtisSearchParams;
  resolvedSearchParams: Record<string, string | string[] | undefined>;
  error?: string;
  initialApartmentData?: {
    amenities: PagedResponse<ApartmentQCDetail>;
    commercial: PagedResponse<ApartmentQCDetail>;
    residential: PagedResponse<ApartmentQCDetail>;
  };
  initialDualSectionData?: DualMethodSectionData;
  wardId?: number | string;
  propertyNo?: string;
  partitionNo?: string;
  rateableSection?: React.ReactNode;
  capitalSection?: React.ReactNode;
  dualRateableSection?: React.ReactNode;
  dualCapitalSection?: React.ReactNode;
  reassessmentSection?: React.ReactNode;
  hasAppliedRules?: boolean;
  appliedRules?: PropertyRuleLogItem[];
}
 
const PtisMainScreen: React.FC<PtisMainScreenProps> = ({
  locale,
  categoryId,
  initialDualSectionData,
  initialApartmentData,
  wardId,
  propertyNo,
  partitionNo,
  ptisParams,
  propertyId,
  resolvedSearchParams,
  rateableSection,
  capitalSection,
  dualRateableSection,
  dualCapitalSection,
  reassessmentSection,
  hasAppliedRules = false,
  appliedRules = [],
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('ptis');
 
  const [isAppliedRulesDrawerOpen, setIsAppliedRulesDrawerOpen] = useState(false);
  const [isTabPending, startTabTransition] = useTransition();
 
  // Apartment category logic
  const APARTMENT_CATEGORY_IDS = [1, 6];
 
  const showApartmentTab =
    categoryId == null ||
    APARTMENT_CATEGORY_IDS.includes(Number(categoryId));
 
  const requestedTab = ptisParams.tab || 'rateable';
 
  const activeTab =
    requestedTab === 'apartment' && !showApartmentTab
      ? 'rateable'
      : requestedTab;
 
  const [activeMainTab, setActiveMainTab] = useState(searchParams.get('appartmentTab') || 'amenities');
  const [activeSubTab, setActiveSubTab] = useState(searchParams.get('subTab') || 'rateable');
 
  React.useEffect(() => {
    const nextMain = searchParams.get('appartmentTab') || 'amenities';
    const nextSub = searchParams.get('subTab') || 'rateable';
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveMainTab((prev) => (prev === nextMain ? prev : nextMain));
    setActiveSubTab((prev) => (prev === nextSub ? prev : nextSub));
  }, [searchParams]);
 
  const ptisNav = useOptionalPtisNavigation();
  const isNavigating = isTabPending;
 
  const updateParams = (
    updates: Record<string, string>,
    replace = false
  ) => {
    const params = new URLSearchParams(searchParams.toString());
 
    Object.entries(updates).forEach(([key, value]) => {
      params.set(key, value);
    });
 
    const url = `?${params.toString()}`;
 
    startTabTransition(() => {
      if (replace) {
        router.replace(url, { scroll: false });
      } else {
        router.push(url);
      }
    });
  };
 
  const handleTabChange = (value: string | number) => {
    if (value.toString() === 'apartment') {
      updateParams({
        valuationTab: 'apartment',
        appartmentTab: 'amenities',
        subTab: 'rateable',
        pageNumber: '1'
      });
      setActiveMainTab('amenities');
      setActiveSubTab('rateable');
    } else {
      updateParams({ valuationTab: value.toString() });
    }
  };
 
  const updateApartmentParams = (
    appTab: string,
    subTab: string
  ) => {
    setActiveMainTab(appTab);
    setActiveSubTab(subTab);
 
    const params = new URLSearchParams(searchParams.toString());
    params.set('valuationTab', 'apartment');
    params.set('appartmentTab', appTab);
    params.set('subTab', subTab);
    params.set('pageNumber', '1');
 
    startTabTransition(() => {
      router.replace(`?${params.toString()}`, { scroll: false });
    });
  };
 
  const handleApartmentMainTabChange = (v: string | number) =>
    updateApartmentParams(v.toString(), 'rateable');
  const handleApartmentSubTabChange = (v: string | number) =>
    updateApartmentParams(activeMainTab, v.toString());
 
  const tabs = [
    {
      value: 'rateable',
      label: t('tabs.rateable'),
      activeGradient: 'from-indigo-600 to-purple-600',
    },
    {
      value: 'capital',
      label: t('tabs.capital'),
      activeGradient: 'from-purple-600 to-pink-600',
    },
    {
      value: 'dual',
      label: t('tabs.dual'),
      activeGradient: 'from-orange-600 to-red-600',
    },
    {
      value: 'reassessment',
      label: t('tabs.reassessment'),
      activeGradient: 'from-red-600 to-yellow-600',
    },
    ...(showApartmentTab
      ? [
          {
            value: 'apartment',
            label: t('tabs.apartment'),
            activeGradient: 'from-blue-600 to-blue-800',
          },
        ]
      : []),
  ];
 
  return (
    <div
      className={cn(
        'relative bg-[#f1f5f9]',
        isNavigating && 'pointer-events-none'
      )}
    >
      {isNavigating && !ptisNav?.isPending && (
        <div className="absolute inset-0 z-50 bg-white/40 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-3 rounded-xl border border-blue-200 bg-white/95 px-8 py-6 shadow-md">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="text-base font-semibold text-blue-800">{t('loading.message')}</span>
          </div>
        </div>
      )}
      <div className="w-full px-0 py-0">
        <main className="w-full mx-auto">
          <div className="bg-white rounded-xl shadow-lg border border-indigo-50 overflow-hidden">
            <div className="bg-white border-b border-gray-200 px-4 py-2">
              <div className="flex items-center justify-between">
                <Tabs
                  value={activeTab}
                  onChange={handleTabChange}
                  variant="pills"
                  size="md"
                >
                  <TabList
                    scrollable
                    className="bg-white border border-indigo-100 p-1 rounded-full flex flex-wrap gap-2 shadow-inner inline-flex"
                  >
                    {tabs.map((tab) => (
                      <Tab
                        key={tab.value}
                        value={tab.value}
                        className={cn(
                          'transition-all cursor-pointer duration-300 px-4 py-1 rounded-full text-xs font-bold min-w-[100px] text-center',
                          activeTab === tab.value
                            ? `bg-gradient-to-r ${tab.activeGradient} text-white shadow-sm`
                            : 'text-indigo-600 hover:bg-white hover:text-indigo-800'
                        )}
                      >
                        {tab.label}
                      </Tab>
                    ))}
                  </TabList>
                </Tabs>
 
                <div className="flex items-center gap-3 shrink-0 ml-auto pl-4">
                  {activeTab === 'apartment' && (
                    <>
                      <Tabs
                        value={activeMainTab}
                        onChange={handleApartmentMainTabChange}
                        variant="pills"
                        size="sm"
                        activeTabClassName="bg-blue-700 text-white shadow-sm rounded-lg border-none"
                      >
                        <TabList className="bg-gray-100 p-1 rounded-lg inline-flex gap-1">
                          <Tab value="amenities" icon={Building2}>
                            {t('apartmentTabs.amenities')}
                          </Tab>
                          <Tab value="commercial" icon={Building}>
                            {t('apartmentTabs.commercial')}
                          </Tab>
                          <Tab value="residential" icon={Home}>
                            {t('apartmentTabs.residential')}
                          </Tab>
                        </TabList>
                      </Tabs>
                      <Tabs
                        value={activeSubTab}
                        onChange={handleApartmentSubTabChange}
                        variant="pills"
                        size="sm"
                        activeTabClassName="bg-green-700 text-white shadow-sm rounded-lg border-none"
                      >
                        <TabList className="bg-gray-100 p-1 rounded-lg inline-flex gap-1">
                          <Tab value="rateable" icon={Calculator}>
                            {t('apartmentTabs.rateable')}
                          </Tab>
                          <Tab value="capital" icon={IndianRupee}>
                            {t('apartmentTabs.capital')}
                          </Tab>
                          <Tab value="dual-method" icon={GitMerge}>
                            {t('apartmentTabs.dual')}
                          </Tab>
                        </TabList>
                      </Tabs>
                    </>
                  )}
 
                  {propertyId && hasAppliedRules && (
                    <Button
                      id="applied-rules-tab-btn"
                      variant="secondary"
                      size="sm"
                      icon={GitMerge}
                      onClick={() =>
                        setIsAppliedRulesDrawerOpen(true)
                      }
                      className="bg-gradient-to-r from-indigo-50 via-white to-blue-50 border border-indigo-200 text-indigo-700 hover:from-indigo-100 hover:to-blue-100 hover:text-indigo-900 transition-all duration-300 font-bold shadow-sm rounded-lg"
                    >
                      {t('appliedRules.buttonLabel')}
                    </Button>
                  )}
                </div>
              </div>
            </div>
 
            <div className="bg-white min-h-[200px] p-0.5 sm:p-1">
              {activeTab === 'capital' && capitalSection}
 
              {activeTab === 'rateable' && rateableSection}
 
              {activeTab === 'apartment' && showApartmentTab && (
                <AppartmentQCSection
                  initialData={initialApartmentData}
                  wardId={wardId?.toString() || ''}
                  propertyNo={propertyNo || ''}
                  partitionNo={partitionNo}
                  activeMainTab={activeMainTab}
                  activeSubTab={activeSubTab}
                  locale={locale}
                />
              )}
 
              {activeTab === 'dual' && (
                <DualMethodSection
                  propertyId={propertyId}
                  searchParams={
                    resolvedSearchParams as Record<string, string | string[] | undefined>
                  }
                  locale={locale}
                  initialData={initialDualSectionData}
                  rateableSection={dualRateableSection}
                  capitalSection={dualCapitalSection}
                />
              )}
              {activeTab === 'reassessment' && reassessmentSection}
 
              {![
                'rateable',
                'capital',
                'apartment',
                'dual',
                'reassessment',
              ].includes(activeTab) && (
                <div className="flex flex-col items-center justify-center min-h-[500px] text-gray-400 p-4">
                  <div className="p-1 rounded-full bg-slate-50 border border-slate-100 mb-4 text-4xl opacity-20">
                    📊
                  </div>
                  <p className="font-medium text-lg">{t('noDataAvailable')}</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
 
      <AppliedRulesDrawer
        open={isAppliedRulesDrawerOpen}
        onClose={() =>
          setIsAppliedRulesDrawerOpen(false)
        }
        propertyId={propertyId}
        propertyNo={propertyNo}
        locale={locale}
        appliedRules={appliedRules}
      />
    </div>
  );
};
 
export default PtisMainScreen;