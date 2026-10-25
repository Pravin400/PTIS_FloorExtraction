'use client';

import { ReactNode, useState, useEffect, useContext, createContext } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { Drawer } from '@/components/common/Drawer';
import { QueryClient, QueryClientProvider, QueryClientContext } from '@tanstack/react-query';
import { useQdeSaveTracker, QdeSaveProvider } from '@/hooks/ptis/QuickDataEntry/useQdeSaveTracker';

export const ApplicableTaxesCloseContext = createContext<(() => void) | null>(null);
export const useApplicableTaxesCloseContext = () => useContext(ApplicableTaxesCloseContext);

function EnsureQueryClientProvider({ children }: { children: ReactNode }) {
  const existingClient = useContext(QueryClientContext);
  const [fallbackClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: false, gcTime: Infinity, staleTime: Infinity },
        },
      })
  );

  if (existingClient) {
    return <>{children}</>;
  }

  return <QueryClientProvider client={fallbackClient}>{children}</QueryClientProvider>;
}

function ApplicableTaxesContent({ children }: { children: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const routeParams = useParams();
  const locale = (routeParams.locale as string) || 'en';

  const propertyId = (routeParams.propertyId as string) || searchParams.get('propertyId') || '';
  const wardNo = searchParams.get('wardNo') || '';
  const wardId = searchParams.get('wardId') || '';
  const propertyNo = searchParams.get('propertyNo') || '';
  const partitionNo = searchParams.get('partitionNo') || '';
  const returnTab = searchParams.get('returnTab') || '';
  const parentPropertyId = searchParams.get('parentPropertyId') || '';
  const categoryIdParam = searchParams.get('categoryId');
  const categoryId = categoryIdParam ? Number(categoryIdParam) : undefined;

  const [isOpen, setIsOpen] = useState(true);
  const { hasSavedChanges, resetSavedChanges } = useQdeSaveTracker(propertyId);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (returnTab === 'apartment' || searchParams.get('from') === 'apartment') {
        sessionStorage.setItem('qde_is_apartment', 'true');
      } else {
        sessionStorage.removeItem('qde_is_apartment');
      }

      const isCategoryIndiv =
        categoryId === 2 ||
        (categoryId !== undefined && categoryId !== null && categoryId !== 1) ||
        searchParams.get('categoryId') === '2';

      if (returnTab === 'individual' || searchParams.get('from') === 'individual' || isCategoryIndiv) {
        sessionStorage.setItem('qde_is_individual', 'true');
      } else {
        sessionStorage.removeItem('qde_is_individual');
      }
    }
  }, [returnTab, searchParams, categoryId]);

  const doClose = () => {
    resetSavedChanges();
    const params = new URLSearchParams();
    if (propertyId) params.set('propertyId', String(propertyId));
    if (wardNo) params.set('wardNo', wardNo);
    if (wardId) params.set('wardId', wardId);

    const cleanPropertyNo =
      wardNo && propertyNo && propertyNo.startsWith(`${wardNo}-`)
        ? propertyNo.slice(wardNo.length + 1)
        : propertyNo;

    if (cleanPropertyNo) params.set('propertyNo', cleanPropertyNo);
    if (partitionNo) params.set('partitionNo', partitionNo);

    const isExplicitApartment = returnTab === 'apartment' || searchParams.get('from') === 'apartment';
    const isApartment =
      isExplicitApartment ||
      (!returnTab &&
        typeof window !== 'undefined' &&
        sessionStorage.getItem('qde_is_apartment') === 'true');

    const isCategoryIndividual =
      categoryId === 2 ||
      (categoryId !== undefined && categoryId !== null && categoryId !== 1) ||
      searchParams.get('categoryId') === '2';

    const isExplicitIndividual =
      returnTab === 'individual' ||
      searchParams.get('from') === 'individual' ||
      isCategoryIndividual;
    const isIndividual =
      isExplicitIndividual ||
      (!returnTab &&
        typeof window !== 'undefined' &&
        sessionStorage.getItem('qde_is_individual') === 'true');

    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('qde_is_apartment');
      sessionStorage.removeItem('qde_is_individual');
    }

    if (isApartment) {
      const societyId = searchParams.get('societyId') || searchParams.get('societyDetailId');
      const wingId = searchParams.get('wingId');
      const resolvedParentPropId =
        parentPropertyId ||
        searchParams.get('parentPropertyId') ||
        searchParams.get('parentpropertyid');

      if (resolvedParentPropId) {
        params.set('propertyId', String(resolvedParentPropId));
      } else if (propertyId) {
        params.set('propertyId', String(propertyId));
      }
      params.delete('partitionNo');
      if (societyId) params.set('societyId', String(societyId));
      if (wingId) params.set('wingId', String(wingId));

      params.delete('from');
      params.delete('returnTab');
      params.delete('parentPropertyId');

      router.push(`/${locale}/property-tax/ptis/apartment?${params.toString()}`);
    } else if (isIndividual) {
      params.delete('from');
      params.delete('returnTab');
      params.delete('parentPropertyId');
      params.delete('categoryId');

      router.push(`/${locale}/property-tax/ptis/individual?${params.toString()}`);
    } else {
      if (searchParams.get('valuationTab')) params.set('valuationTab', searchParams.get('valuationTab')!);
      if (returnTab) params.set('tab', returnTab);
      router.push(`/${locale}/property-tax/ptis?${params.toString()}`);
    }
  };

  const closeImmediately = () => {
    resetSavedChanges();
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      doClose();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    if (hasSavedChanges()) {
      doClose();
    } else {
      closeImmediately();
    }
  };

  return (
    <ApplicableTaxesCloseContext.Provider value={handleClose}>
      <Drawer
        open={isOpen}
        onClose={handleClose}
        width="lg"
        hideHeader={true}
        bodyClassName="overflow-hidden"
      >
        <div className="flex h-screen flex-col bg-white">
          <div className="flex-1 overflow-hidden">
            {children}
          </div>
        </div>
      </Drawer>
    </ApplicableTaxesCloseContext.Provider>
  );
}

export default function ApplicableTaxesClientWrapper({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const params = useParams();
  const propertyId = searchParams.get('propertyId') || (params.propertyId as string) || '';

  return (
    <EnsureQueryClientProvider>
      <QdeSaveProvider propertyId={propertyId}>
        <ApplicableTaxesContent>{children}</ApplicableTaxesContent>
      </QdeSaveProvider>
    </EnsureQueryClientProvider>
  );
}


