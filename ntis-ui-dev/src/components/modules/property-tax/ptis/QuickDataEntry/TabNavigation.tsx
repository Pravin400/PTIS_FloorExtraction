'use client';

import { useTransition, useState } from 'react';
import { useRouter, usePathname, useSearchParams, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Images, Loader2 } from 'lucide-react';
import { TABS, RETURN_TAB_BY_QDE_HREF, TAB_GRADIENT_CLASSES } from './navigation-constants';
import { useConfirm } from '@/components/common/ConfirmProvider';

interface TabNavigationProps {
  categoryName?: string;
  isIndividual?: boolean;
  hideOldDetails?: boolean;
  isMediaPanelOpen?: boolean;
  onToggleMediaPanel?: () => void;
}

export function TabNavigation({
  categoryName,
  isIndividual: isIndividualProp,
  hideOldDetails: hideOldDetailsProp,
  isMediaPanelOpen,
  onToggleMediaPanel,
}: TabNavigationProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeParams = useParams();
  const t = useTranslations('quickDataEntry');

  const propertyId = (routeParams.propertyId as string) || searchParams.get('propertyId') || '';
  const wardNo = searchParams.get('wardNo') || '';
  const wardId = searchParams.get('wardId') || '';
  const propertyNo = searchParams.get('propertyNo') || '';
  const partitionNo = searchParams.get('partitionNo') || '';
  const returnTab = searchParams.get('returnTab') || '';
  const valuationTab = searchParams.get('valuationTab') || '';
  const appartmentTab = searchParams.get('appartmentTab') || '';
  const subTab = searchParams.get('subTab') || '';
  const showDetails = searchParams.get('showDetails') || '';
  const rateableExpands = searchParams.getAll('rateableExpand');
  const capitalExpands = searchParams.getAll('capitalExpand');
  const dualExpands = searchParams.getAll('dualExpand');
  const appartmentPartition = searchParams.get('appartmentPartition') || '';
  const parentPropertyId = searchParams.get('parentPropertyId') || '';
  const societyDetailId = searchParams.get('societyDetailId') || searchParams.get('societyId') || '';
  const societyId = searchParams.get('societyId') || '';
  const wingDetailId = searchParams.get('wingDetailId') || '';
  const wingId = searchParams.get('wingId') || '';
  const isWingWise = searchParams.get('isWingWise') || '';
  const isSocietyWise = searchParams.get('isSocietyWise') || '';
  const fromSocietyEdit = searchParams.get('fromSocietyEdit') === 'true';
  const fromWingEdit = searchParams.get('fromWingEdit') === 'true';
  const fromFooterEdit = searchParams.get('fromFooterEdit') === 'true';
  const fromParam = searchParams.get('from') || '';
  const hideWing = searchParams.get('hideWing') === 'true' || fromSocietyEdit || fromFooterEdit;
  const hideSociety = searchParams.get('hideSociety') === 'true' || fromWingEdit || fromFooterEdit;

  // Check if Property Category is main Apartment or Apartment/Individual
  const rawCat = categoryName || searchParams.get('propertyCategory') || searchParams.get('categoryName') || '';
  const hasPartition = Boolean(appartmentPartition || partitionNo);
  const displayCategory = (hasPartition && rawCat.toLowerCase() === 'apartment')
    ? 'Apartment/Individual'
    : rawCat;

  const effectiveCategoryName = displayCategory.toLowerCase();
  const isMainApartmentCategory = !hasPartition && (effectiveCategoryName.includes('apartment') || returnTab === 'apartment');

  const isIndividual =
    Boolean(isIndividualProp) ||
    returnTab.toLowerCase() === 'individual' ||
    fromParam.toLowerCase() === 'individual' ||
    searchParams.get('from')?.toLowerCase() === 'individual' ||
    searchParams.get('returnTab')?.toLowerCase() === 'individual';

  const isIndividualProperty =
    isIndividual ||
    effectiveCategoryName.includes('individual');

  const hideOldDetails =
    Boolean(hideOldDetailsProp) ||
    searchParams.get('hideOldDetails') === 'true' ||
    isIndividualProperty;

  // Check if we have search parameters that can resolve authoritative property ID
  const hasPropertyKeys = wardNo && propertyNo && partitionNo;

  const params = new URLSearchParams();
  if (propertyId) params.set('propertyId', propertyId);
  if (wardNo) params.set('wardNo', wardNo);
  if (wardId) params.set('wardId', wardId);
  if (propertyNo) params.set('propertyNo', propertyNo);
  if (partitionNo) params.set('partitionNo', partitionNo);
  if (returnTab) params.set('returnTab', returnTab);
  if (valuationTab) params.set('valuationTab', valuationTab);
  if (appartmentTab) params.set('appartmentTab', appartmentTab);
  if (subTab) params.set('subTab', subTab);
  if (showDetails) params.set('showDetails', showDetails);
  if (appartmentPartition) params.set('appartmentPartition', appartmentPartition);
  if (parentPropertyId) params.set('parentPropertyId', parentPropertyId);
  if (societyDetailId) params.set('societyDetailId', societyDetailId);
  if (societyId) params.set('societyId', societyId);
  if (wingDetailId) params.set('wingDetailId', wingDetailId);
  if (wingId) params.set('wingId', wingId);
  if (isWingWise) params.set('isWingWise', isWingWise);
  if (isSocietyWise) params.set('isSocietyWise', isSocietyWise);
  if (fromSocietyEdit) params.set('fromSocietyEdit', 'true');
  if (fromWingEdit) params.set('fromWingEdit', 'true');
  if (fromFooterEdit) params.set('fromFooterEdit', 'true');
  if (fromParam) params.set('from', fromParam);
  if (hideWing) params.set('hideWing', 'true');
  if (hideSociety) params.set('hideSociety', 'true');
  if (hideOldDetails) params.set('hideOldDetails', 'true');
  rateableExpands.forEach(v => params.append('rateableExpand', v));
  capitalExpands.forEach(v => params.append('capitalExpand', v));
  dualExpands.forEach(v => params.append('dualExpand', v));

  const queryString = params.toString();

  const { confirm } = useConfirm();
  const [isPending, startTransition] = useTransition();
  const [navigatingTabHref, setNavigatingTabHref] = useState<string | null>(null);
  const activeNavigatingTabHref = isPending ? navigatingTabHref : null;

  const handleTabClick = (tabHref: string) => {
    if (isPending) return;

    const win = typeof window !== 'undefined' ? (window as unknown as {
      __buildingFormHasChanges?: boolean;
      __discountFormHasChanges?: boolean;
      __socialFormHasChanges?: boolean;
      __buildingFormIncompleteDetails?: string[] | null;
      __showBuildingUnsavedChangesModal?: ((onDiscard: () => void) => void) | null;
    }) : {} as Record<string, never>;
    const hasBuildingChanges = !!win.__buildingFormHasChanges;
    const hasDiscountChanges = !!win.__discountFormHasChanges || !!win.__socialFormHasChanges;

    const onDiscard = () => {
      win.__buildingFormHasChanges = false;
      win.__discountFormHasChanges = false;
      win.__socialFormHasChanges = false;
      win.__buildingFormIncompleteDetails = null;
      setNavigatingTabHref(tabHref);
      startTransition(() => {
        router.replace(tabHref);
      });
    };

    if (hasBuildingChanges && win.__showBuildingUnsavedChangesModal) {
      win.__showBuildingUnsavedChangesModal(onDiscard);
      return;
    }

    if (hasBuildingChanges || hasDiscountChanges) {
      const title = hasBuildingChanges
        ? (t('building.unsavedChangesTitle') || 'Unsaved Changes')
        : (t('discount.unsavedChangesTitle') || 'Unsaved Changes');

      let description = hasBuildingChanges
        ? (t('building.unsavedChangesDesc') || 'You have unsaved changes in the Building Permission tab. Do you want to discard them, or continue editing?')
        : (t('discount.unsavedChangesDesc') || 'You have unsaved changes in the Discount & Social Data tab. Do you want to discard them, or continue editing?');

      if (hasBuildingChanges && win.__buildingFormIncompleteDetails && Array.isArray(win.__buildingFormIncompleteDetails)) {
        const incompleteMsg = t('building.incompleteFloorsWarning') || 'The following floor(s) have incomplete certificate information:';
        description = `${description}\n\n⚠️ ${incompleteMsg}\n• ${win.__buildingFormIncompleteDetails.join('\n• ')}`;
      }

      const continueButton = hasBuildingChanges
        ? (t('building.continueButton') || 'Continue Editing')
        : (t('discount.continueButton') || 'Continue Editing');

      const discardButton = hasBuildingChanges
        ? (t('building.discardConfirmButton') || 'Discard Changes')
        : (t('discount.discardConfirmButton') || 'Discard Changes');

      confirm({
        variant: 'warning',
        title,
        description,
        confirmText: continueButton,
        cancelText: discardButton,
        onConfirm: () => {
          // Do nothing, stays on screen
        },
        onCancel: () => {
          const e = typeof window !== 'undefined' ? (window.event as Event | undefined) : null;
          const target = e?.target as HTMLElement | null;
          const isSafeDismiss = e && (
            e.type === 'keydown' ||
            (e.type === 'click' && !target?.closest?.('button')) ||
            target?.closest?.('button')?.getAttribute?.('aria-label') === 'Close'
          );

          if (isSafeDismiss) return;

          win.__buildingFormHasChanges = false;
          win.__discountFormHasChanges = false;
          win.__socialFormHasChanges = false;
          win.__buildingFormIncompleteDetails = null;
          setNavigatingTabHref(tabHref);
          startTransition(() => {
            router.replace(tabHref);
          });
        }
      });
    } else {
      setNavigatingTabHref(tabHref);
      startTransition(() => {
        router.replace(tabHref);
      });
    }
  };

  const isApartment = returnTab === 'apartment' || fromParam === 'apartment';

  const visibleTabs = TABS.filter((tab) => {
    // Hide Property and KYC tabs ONLY if it is pure Apartment (Main Apartment without Partition)
    if (isMainApartmentCategory && (tab.label === 'Property' || tab.label === 'Kyc')) return false;
    if (isMainApartmentCategory && tab.label === 'FloorSubmission') return false;
    if ((hideWing || isIndividualProperty) && tab.label === 'Wing') return false;
    if ((hideSociety || isIndividualProperty) && tab.label === 'Society') return false;
    if ((hideOldDetails || isIndividualProperty) && tab.label === 'OldDetails') return false;
    return true;
  });

  return (
    <div className="relative bg-white border-b-2 border-slate-300 px-3 py-2 shadow-sm overflow-x-auto no-scrollbar">
      {isPending && (
        <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-slate-100 overflow-hidden z-20">
          <div
            className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 rounded-full"
            style={{
              width: '40%',
              animation: 'qdeTabSlide 1.1s cubic-bezier(0.4, 0, 0.2, 1) infinite',
            }}
          />
          <style>{`
            @keyframes qdeTabSlide {
              0% { transform: translateX(-100%); }
              50% { transform: translateX(110%); }
              100% { transform: translateX(250%); }
            }
          `}</style>
        </div>
      )}
      <div className="flex items-center gap-2">
        <nav
          className="flex md:grid flex-1 gap-1.5 h-auto p-1 rounded-lg"
          style={{ gridTemplateColumns: `repeat(${visibleTabs.length}, minmax(0, 1fr))` }}
        >
          {visibleTabs.map((tab) => {
            const currentPath = pathname.split('?')[0];
            const pathSegments = currentPath.split('/').filter(Boolean);

            // Find the base path up to the propertyId segment.
            // The structure is expected to be .../QuickDataEntry/[propertyId]/...
            const qdeIndex = pathSegments.indexOf('QuickDataEntry');
            const baseTabPath =
              qdeIndex !== -1 && pathSegments[qdeIndex + 1]
                ? `/${pathSegments.slice(0, qdeIndex + 2).join('/')}`
                : `/${pathSegments.slice(0, -1).join('/')}`;

            const tabPath = `${baseTabPath}/${tab.href}`;

            const tabReturnValue = isApartment
              ? 'apartment'
              : isIndividual
                ? 'individual'
                : (RETURN_TAB_BY_QDE_HREF[tab.href] || returnTab);

            // For FloorSubmission tab: exclude propertyId if we have search params
            // to let the page resolve authoritative ID from backend
            let tabQueryString = queryString;
            if (tab.href === 'FloorSubmission' && hasPropertyKeys) {
              const tabParams = new URLSearchParams();
              if (wardNo) tabParams.set('wardNo', wardNo);
              if (wardId) tabParams.set('wardId', wardId);
              if (propertyNo) tabParams.set('propertyNo', propertyNo);
              if (partitionNo) tabParams.set('partitionNo', partitionNo);
              if (tabReturnValue) tabParams.set('returnTab', tabReturnValue);
              if (fromParam) tabParams.set('from', fromParam);
              if (isIndividual) {
                tabParams.set('from', 'individual');
                tabParams.set('propertyCategory', 'Individual');
              }
              if (valuationTab) tabParams.set('valuationTab', valuationTab);
              if (appartmentTab) tabParams.set('appartmentTab', appartmentTab);
              if (subTab) tabParams.set('subTab', subTab);
              if (showDetails) tabParams.set('showDetails', showDetails);
              if (appartmentPartition) tabParams.set('appartmentPartition', appartmentPartition);
              if (parentPropertyId) tabParams.set('parentPropertyId', parentPropertyId);
              if (fromSocietyEdit) tabParams.set('fromSocietyEdit', 'true');
              if (fromWingEdit) tabParams.set('fromWingEdit', 'true');
              if (fromFooterEdit) tabParams.set('fromFooterEdit', 'true');
              if (hideWing) tabParams.set('hideWing', 'true');
              if (hideSociety) tabParams.set('hideSociety', 'true');
              if (hideOldDetails) tabParams.set('hideOldDetails', 'true');
              rateableExpands.forEach(v => tabParams.append('rateableExpand', v));
              capitalExpands.forEach(v => tabParams.append('capitalExpand', v));
              dualExpands.forEach(v => tabParams.append('dualExpand', v));
              tabQueryString = tabParams.toString();
            } else {
              const tabParams = new URLSearchParams(queryString);
              if (tabReturnValue) {
                tabParams.set('returnTab', tabReturnValue);
              } else {
                tabParams.delete('returnTab');
              }
              if (isIndividual) {
                tabParams.set('from', 'individual');
                tabParams.set('propertyCategory', 'Individual');
              }
              tabQueryString = tabParams.toString();
            }

            const tabHref = tabQueryString ? `${tabPath}?${tabQueryString}` : tabPath;

            const activeSegment = pathname.split('/').pop() ?? '';
            const oldDetailsSectionPath = `${baseTabPath}/OldDetails`;

            // This is safe and intentional for single-segment tabs; OldDetails is a section tab
            // and should remain active for any nested route under /OldDetails/.
            const isOldDetailsTab = tab.href === 'OldDetails/old-taxation';
            const isActive = isOldDetailsTab
              ? pathname === tabPath ||
              pathname === oldDetailsSectionPath ||
              pathname.startsWith(`${oldDetailsSectionPath}/`)
              : activeSegment === tab.href || pathname === tabPath;

            const Icon = tab.icon;

            const gradientClass = TAB_GRADIENT_CLASSES.activeClass;

            const tabLabel = isApartment && tab.label === 'Society'
              ? (t('tabs.SocietyDetails') || 'Society Details')
              : t(`tabs.${tab.label}`);

            const isThisTabNavigating = activeNavigatingTabHref === tabHref;

            return (
              <button
                key={tab.href}
                onClick={() => handleTabClick(tabHref)}
                onMouseEnter={() => router.prefetch(tabHref)}
                onFocus={() => router.prefetch(tabHref)}
                data-href={tabHref}
                disabled={isPending}
                className={[
                  'inline-flex items-center gap-1.5 px-2 py-2 text-[11px] rounded-md border font-semibold transition-all hover:shadow-md cursor-pointer text-left focus:outline-none whitespace-nowrap justify-center',
                  isActive
                    ? `bg-gradient-to-br ${gradientClass} text-white shadow-lg`
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-slate-50',
                  isThisTabNavigating ? 'ring-2 ring-blue-400 ring-offset-1 opacity-90 cursor-wait' : '',
                  isPending && !isThisTabNavigating ? 'cursor-wait opacity-80' : '',
                ].filter(Boolean).join(' ')}
              >
                {isThisTabNavigating ? (
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                ) : (
                  <Icon className="w-4 h-4 shrink-0" />
                )}
                <span>{tabLabel}</span>
              </button>
            );
          })}
        </nav>

        {onToggleMediaPanel && (
          <button
            type="button"
            onClick={onToggleMediaPanel}
            className={[
              'shrink-0 inline-flex items-center gap-1.5 px-2.5 py-2 text-[11px] rounded-md border font-semibold transition-all hover:shadow-md cursor-pointer focus:outline-none whitespace-nowrap',
              'bg-linear-to-br from-blue-500 to-blue-600 border-blue-700 text-white shadow-md hover:from-blue-600 hover:to-blue-700 hover:shadow-lg',
              isMediaPanelOpen ? 'ring-2 ring-blue-400 ring-offset-1 shadow-lg' : '',
            ].filter(Boolean).join(' ')}
            aria-label={t('photos.showPropertyPhotos') || 'Property Photos'}
          >
            <Images className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
