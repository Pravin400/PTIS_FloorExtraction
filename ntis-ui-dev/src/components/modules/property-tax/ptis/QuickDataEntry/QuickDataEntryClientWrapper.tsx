'use client'

import { useRouter, usePathname, useSearchParams, useParams } from 'next/navigation';
import { Drawer } from '@/components/common/Drawer';
import { useTranslations } from 'next-intl';
import { ReactNode, useState, useEffect, useCallback } from 'react';
import { FileText, MapPin, Hash, Layers, Tag } from 'lucide-react';
import { TabNavigation } from "./TabNavigation";
import { cn } from '@/lib/utils/cn';
import { useConfirm } from '@/components/common/ConfirmProvider';
import { QDE_TO_MAIN_MAP } from '@/lib/utils/qde-tab-mapping';
import { MediaPanelProvider, useMediaPanel } from '@/hooks/ptis/photoplan/useMediaPanelVisibility';
import { usePropertyPhotosQuery } from '@/hooks/ptis/photoplan/usePropertyPhotosQuery';
import type { PropertyPhotoTypeWithStatusDto, PropertyPhotoDto } from '@/types/photoplan.types';
import PropertyMediaPanel from '../media/PropertyMediaPanel';
import type { WingWiseWingDetails } from '@/types/property-tax/apartment/wing-intelligence.types';
import { useQuery, QueryClient, QueryClientProvider, QueryClientContext } from '@tanstack/react-query';
import { useContext } from 'react';
import { useQdeSaveTracker, QDE_SAVED_CHANGES_KEY, QDE_INCOMPATIBLE_FLOOR_KEY, QdeSaveProvider } from '@/hooks/ptis/QuickDataEntry/useQdeSaveTracker';

function EnsureQueryClientProvider({ children }: { children: ReactNode }) {
    const existingClient = useContext(QueryClientContext);
    const [fallbackClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: { retry: false, gcTime: Infinity, staleTime: Infinity },
        },
    }));

    if (existingClient) {
        return <>{children}</>;
    }

    return (
        <QueryClientProvider client={fallbackClient}>
            {children}
        </QueryClientProvider>
    );
}

export function QuickDataEntryClientWrapper({
    children,
    categoryId,
    propertyTypeId,
    categoryName,
    propertyDescription,
    initialHasIncompatibleFloor = false,
    initialPhotoSlots = [],
    initialPhotos = [],
    societyDetailId,
    wings = [],
    wingName,
    wingDetailId,
}: {
    children: ReactNode;
    categoryId?: number | null;
    propertyTypeId?: number | null;
    categoryName?: string;
    propertyDescription?: string;
    initialHasIncompatibleFloor?: boolean;
    initialPhotoSlots?: PropertyPhotoTypeWithStatusDto[];
    initialPhotos?: PropertyPhotoDto[];
    societyDetailId?: number | null;
    wings?: WingWiseWingDetails[];
    wingName?: string;
    wingDetailId?: number | null;
}) {
    return (
        <EnsureQueryClientProvider>
            <MediaPanelProvider initialVisible={false} syncWithCookie={false}>
                <QuickDataEntryContent
                    categoryId={categoryId}
                    propertyTypeId={propertyTypeId}
                    categoryName={categoryName}
                    propertyDescription={propertyDescription}
                    initialHasIncompatibleFloor={initialHasIncompatibleFloor}
                    initialPhotoSlots={initialPhotoSlots}
                    initialPhotos={initialPhotos}
                    societyDetailId={societyDetailId}
                    wings={wings}
                    wingName={wingName}
                    wingDetailId={wingDetailId}
                >
                    {children}
                </QuickDataEntryContent>
            </MediaPanelProvider>
        </EnsureQueryClientProvider>
    );
}

function QuickDataEntryContent({
    children,
    categoryId,
    propertyTypeId,
    categoryName,
    propertyDescription,
    initialHasIncompatibleFloor = false,
    initialPhotoSlots = [],
    initialPhotos = [],
    societyDetailId,
    wings = [],
    wingName,
    wingDetailId,
}: {
    children: ReactNode;
    categoryId?: number | null;
    propertyTypeId?: number | null;
    categoryName?: string;
    propertyDescription?: string;
    initialHasIncompatibleFloor?: boolean;
    initialPhotoSlots?: PropertyPhotoTypeWithStatusDto[];
    initialPhotos?: PropertyPhotoDto[];
    societyDetailId?: number | null;
    wings?: WingWiseWingDetails[];
    wingName?: string;
    wingDetailId?: number | null;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const routeParams = useParams();
    const t = useTranslations('quickDataEntry');

    const locale = routeParams.locale as string;
    const propertyId = (routeParams.propertyId as string) || searchParams.get('propertyId') || "";
    const wardNo = searchParams.get("wardNo") || "";
    const wardId = searchParams.get("wardId") || "";
    const propertyNo = searchParams.get("propertyNo") || "";
    const partitionNo = searchParams.get("partitionNo") || "";
    const returnTab = searchParams.get("returnTab") || "";
    const valuationTab = searchParams.get("valuationTab") || "";
    const appartmentTab = searchParams.get("appartmentTab") || "";
    const subTab = searchParams.get("subTab") || "";
    const showDetails = searchParams.get("showDetails") || "";
    const rateableExpands = searchParams.getAll("rateableExpand");
    const capitalExpands = searchParams.getAll("capitalExpand");
    const dualExpands = searchParams.getAll("dualExpand");
    const parentPropertyId = searchParams.get("parentPropertyId") || "";
    const appartmentPartition = searchParams.get("appartmentPartition") || "";

    const pathSegments = pathname?.split('/').filter(Boolean) || [];
    const qdeIndex = pathSegments.findIndex((segment) => segment.toLowerCase() === 'quickdataentry');
    const remainingSegments = qdeIndex >= 0 ? pathSegments.slice(qdeIndex + 2) : [];
    const matchedSegment = remainingSegments.map(s => s.toLowerCase()).find(s => QDE_TO_MAIN_MAP[s]);
    const derivedReturnTab = (matchedSegment ? QDE_TO_MAIN_MAP[matchedSegment] : '') || '';
    const resolvedReturnTab = returnTab || derivedReturnTab || 'olddetails';

    const { confirm } = useConfirm();
    const { isPanelVisible, togglePanel } = useMediaPanel();
    const isMediaPanelOpen = isPanelVisible;

    const isDrawerOpen = searchParams.get('drawer') === 'photo-plan';

    const numericPropertyId = propertyId ? Number(propertyId) : undefined;
    const searchSocietyId =
        searchParams.get('societyDetailId') ||
        searchParams.get('societydetailid') ||
        searchParams.get('societyId') ||
        searchParams.get('societyid');
    const numericSocietyId = searchSocietyId ? Number(searchSocietyId) : (societyDetailId ? Number(societyDetailId) : null);

    const searchWingDetailId = searchParams.get('wingDetailId') || searchParams.get('wingdetailid');
    const numericWingDetailId = searchWingDetailId ? Number(searchWingDetailId) : (wingDetailId ? Number(wingDetailId) : null);

    const {
        loading: mediaLoading,
        photoSlots,
        photos,
        setPhotos,
        setPhotoSlots,
    } = usePropertyPhotosQuery(
        numericPropertyId,
        isPanelVisible,
        isDrawerOpen,
        initialPhotoSlots,
        initialPhotos,
        numericSocietyId,
        undefined,
        undefined,
        numericWingDetailId
    );

    const [isFormSaving] = useState(false);
    const [isOpen, setIsOpen] = useState(true);
    const { hasSavedChanges, resetSavedChanges } = useQdeSaveTracker(propertyId);

    const { data: isSaved = false } = useQuery({
        queryKey: QDE_SAVED_CHANGES_KEY(propertyId),
        queryFn: () => hasSavedChanges(),
        initialData: false,
        staleTime: Infinity,
    });

    const { data: hasIncompatibleFloor = initialHasIncompatibleFloor } = useQuery({
        queryKey: QDE_INCOMPATIBLE_FLOOR_KEY(propertyId),
        queryFn: () => initialHasIncompatibleFloor,
        initialData: initialHasIncompatibleFloor,
        staleTime: Infinity,
    });
    const showIncompatibleBanner = Boolean(hasIncompatibleFloor || initialHasIncompatibleFloor);

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

    const getTargetParentUrl = useCallback((): string => {
        const params = new URLSearchParams();
        if (propertyId) params.set('propertyId', propertyId);
        if (wardNo) params.set('wardNo', wardNo);
        if (wardId) params.set('wardId', wardId);

        const cleanPropertyNo =
            wardNo && propertyNo && propertyNo.startsWith(`${wardNo}-`)
                ? propertyNo.slice(wardNo.length + 1)
                : propertyNo;

        if (cleanPropertyNo) params.set('propertyNo', cleanPropertyNo);
        if (partitionNo) params.set('partitionNo', partitionNo);

        const isExplicitApartment = returnTab === 'apartment' || searchParams.get('from') === 'apartment';
        const isApartment = isExplicitApartment ||
                           (!returnTab && (
                               resolvedReturnTab === 'apartment' ||
                               (typeof window !== 'undefined' && sessionStorage.getItem('qde_is_apartment') === 'true')
                           ));

        const isCategoryIndividual =
            categoryId === 2 ||
            (categoryId !== undefined && categoryId !== null && categoryId !== 1) ||
            searchParams.get('categoryId') === '2';

        const isExplicitIndividual =
            returnTab === 'individual' ||
            searchParams.get('from') === 'individual' ||
            isCategoryIndividual;
        const isIndividual = isExplicitIndividual ||
                             (!returnTab && (
                                 resolvedReturnTab === 'individual' ||
                                 (typeof window !== 'undefined' && sessionStorage.getItem('qde_is_individual') === 'true')
                             ));

        if (isApartment) {
            const societyId = searchParams.get('societyId') || searchParams.get('societyDetailId') || societyDetailId;
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
            if (wingDetailId) params.set('wingDetailId', String(wingDetailId));
            if (wingName) params.set('wingName', String(wingName));

            // Clean up QDE internal params
            params.delete('fromFooterEdit');
            params.delete('fromSocietyEdit');
            params.delete('fromWingEdit');
            params.delete('hideWing');
            params.delete('hideSociety');
            params.delete('from');
            params.delete('returnTab');
            params.delete('parentPropertyId');

            return `/${locale}/property-tax/ptis/apartment?${params.toString()}`;
        } else if (isIndividual) {
            // Clean up QDE internal and routing params
            params.delete('from');
            params.delete('returnTab');
            params.delete('floorId');
            params.delete('tab');
            params.delete('valuationTab');
            params.delete('appartmentTab');
            params.delete('subTab');
            params.delete('showDetails');
            params.delete('parentPropertyId');
            params.delete('fromFooterEdit');
            params.delete('fromSocietyEdit');
            params.delete('fromWingEdit');
            params.delete('hideWing');
            params.delete('hideSociety');
            params.delete('categoryId');

            return `/${locale}/property-tax/ptis/individual?${params.toString()}`;
        } else {
            if (resolvedReturnTab) params.set('tab', resolvedReturnTab);
            if (valuationTab) params.set('valuationTab', valuationTab);
            if (appartmentTab) params.set('appartmentTab', appartmentTab);
            if (subTab) params.set('subTab', subTab);
            if (showDetails) params.set('showDetails', showDetails);
            if (parentPropertyId) params.set('parentPropertyId', parentPropertyId);
            if (wingDetailId) params.set('wingDetailId', String(wingDetailId));
            if (wingName) params.set('wingName', wingName);
            if (societyDetailId) params.set('societyDetailId', String(societyDetailId));
            rateableExpands.forEach(v => params.append('rateableExpand', v));
            capitalExpands.forEach(v => params.append('capitalExpand', v));
            dualExpands.forEach(v => params.append('dualExpand', v));

            return `/${locale}/property-tax/ptis?${params.toString()}`;
        }
    }, [
        propertyId, wardNo, wardId, propertyNo, partitionNo, returnTab, searchParams,
        resolvedReturnTab, categoryId, societyDetailId, wingDetailId, wingName,
        parentPropertyId, locale, valuationTab, appartmentTab, subTab, showDetails,
        rateableExpands, capitalExpands, dualExpands
    ]);

    // Fast Prefetch 1: Prefetch parent route immediately on mount so browser cache is ready
    useEffect(() => {
        try {
            const url = getTargetParentUrl();
            if (url) {
                router.prefetch(url);
            }
        } catch (_err) { }
    }, [getTargetParentUrl, router]);

    // Fast Prefetch 2: Re-prefetch parent route as soon as any form saves changes
    useEffect(() => {
        if (isSaved) {
            try {
                const url = getTargetParentUrl();
                if (url) {
                    router.prefetch(url);
                }
            } catch (_err) { }
        }
    }, [isSaved, getTargetParentUrl, router]);

    const handleClose = () => {
        const win = typeof window !== 'undefined' ? (window as unknown as {
            __buildingFormIsSaving?: boolean;
            __buildingFormHasChanges?: boolean;
            __discountFormHasChanges?: boolean;
            __socialFormHasChanges?: boolean;
            __buildingFormIncompleteDetails?: string[] | null;
            __showBuildingUnsavedChangesModal?: ((onDiscard: () => void) => void) | null;
        }) : {} as Record<string, never>;

        const isSavingActive = isFormSaving || (typeof window !== 'undefined' && (
            !!(window as unknown as { __buildingFormIsSaving?: boolean }).__buildingFormIsSaving ||
            !!(window as unknown as { __isQuickDataEntrySaving?: boolean }).__isQuickDataEntrySaving
        ));

        if (isSavingActive) {
            return;
        }

        const closeImmediately = () => {
            setIsOpen(false);
            resetSavedChanges();
            if (typeof window !== 'undefined' && window.history.length > 1) {
                router.back();
            } else {
                doClose();
            }
        };

        const doClose = () => {
            setIsOpen(false);
            resetSavedChanges();
            if (typeof window !== 'undefined') {
                sessionStorage.removeItem('qde_is_apartment');
                sessionStorage.removeItem('qde_is_individual');
            }
            const targetUrl = getTargetParentUrl();
            router.push(targetUrl);
        };

        const hasBuildingChanges = !!win.__buildingFormHasChanges;
        const hasDiscountChanges = !!win.__discountFormHasChanges || !!win.__socialFormHasChanges;

        const onDiscard = () => {
            win.__buildingFormHasChanges = false;
            win.__discountFormHasChanges = false;
            win.__socialFormHasChanges = false;
            win.__buildingFormIncompleteDetails = null;
            if (hasSavedChanges()) {
                doClose();
            } else {
                closeImmediately();
            }
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

                    if (isSafeDismiss) {
                        return;
                    }

                    win.__buildingFormHasChanges = false;
                    win.__discountFormHasChanges = false;
                    win.__socialFormHasChanges = false;
                    win.__buildingFormIncompleteDetails = null;
                    if (hasSavedChanges()) {
                        doClose();
                    } else {
                        closeImmediately();
                    }
                }
            });
        } else {
            if (hasSavedChanges()) {
                doClose();
            } else {
                closeImmediately();
            }
        }
    };

    const isRenterPage = pathname ? pathname.toLowerCase().includes("/renter") : false;
    const isBusy = isFormSaving || (typeof window !== 'undefined' && !!(window as unknown as { __buildingFormIsSaving?: boolean }).__buildingFormIsSaving);

    const drawerClassName = cn(
        `quick-data-entry-wrapper transition-[width] duration-300 ease-in-out overflow-hidden ${
            isMediaPanelOpen
                ? 'w-[75vw] [&_div.fixed.right-0]:!w-[75vw]'
                : 'w-[60vw] [&_div.fixed.right-0]:!w-[60vw]'
        }`,
        "[&_div.fixed.right-0]:transition-[width] [&_div.fixed.right-0]:duration-300 [&_div.fixed.right-0]:ease-in-out [&_div.fixed.right-0]:overflow-hidden",
        !isRenterPage && "[&_div.fixed.right-0>div:first-child]:!bg-blue-600",
        !isRenterPage && "[&_div.fixed.right-0>div:first-child_h2]:!text-white",
        !isRenterPage && "[&_div.fixed.right-0>div:first-child_button_svg]:!text-white",
        !isRenterPage && "[&_div.fixed.right-0>div:first-child_button]:hover:!bg-blue-700"
    );

    const drawerTitle = (
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4 lg:gap-6">
            <h2 className="flex items-center gap-2 text-[15px] font-bold leading-tight text-white">
                <FileText className="h-4 w-4 text-white" />
                {t('roomSubmission.quickDataEntry')}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 text-[11px] font-semibold text-white border border-white/10 backdrop-blur-xs transition-colors hover:bg-white/15">
                    <MapPin className="h-3 w-3 text-white/80" />
                    <span>{t('roomSubmission.info.ward')}: {wardNo || '—'}</span>
                </div>
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 text-[11px] font-semibold text-white border border-white/10 backdrop-blur-xs transition-colors hover:bg-white/15">
                    <Hash className="h-3 w-3 text-white/80" />
                    <span>{t('roomSubmission.info.property')}: {propertyNo || '—'}</span>
                </div>
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 text-[11px] font-semibold text-white border border-white/10 backdrop-blur-xs transition-colors hover:bg-white/15">
                    <Layers className="h-3 w-3 text-white/80" />
                    <span>{t('roomSubmission.info.partition')}: {appartmentPartition || partitionNo || '—'}</span>
                </div>
                {(() => {
                    const wing = searchParams.get('wingName') || searchParams.get('wingname');
                    if (!wing) return null;
                    return (
                        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 text-[11px] font-semibold text-white border border-white/10 backdrop-blur-xs transition-colors hover:bg-white/15">
                            <Layers className="h-3 w-3 text-white/80" />
                            <span>{t('aliasFallback.wing') || 'Wing'}: {wing}</span>
                        </div>
                    );
                })()}
                {(() => {
                    const rawCat = categoryName || searchParams.get('propertyCategory') || searchParams.get('categoryName') || '';
                    const hasPartition = Boolean(appartmentPartition || partitionNo);
                    const displayCategory = (hasPartition && rawCat.toLowerCase() === 'apartment')
                        ? 'Apartment/Individual'
                        : rawCat;

                    if (!displayCategory || displayCategory.toLowerCase() === 'apartment/individual') return null;

                    return (
                        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/15 text-[11px] font-semibold text-white border border-white/20 backdrop-blur-xs transition-colors hover:bg-white/20">
                            <Tag className="h-3 w-3 text-white/95" />
                            <span>{t('floor.propertyCategory')}: {displayCategory}</span>
                        </div>
                    );
                })()}
                {propertyDescription && (
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/15 text-[11px] font-semibold text-white border border-white/20 backdrop-blur-xs transition-colors hover:bg-white/20">
                        <Tag className="h-3 w-3 text-white/95" />
                        <span>{t('property.propertyDescription')}: {propertyDescription}</span>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className={drawerClassName}>
            {isBusy && (
                <div
                    className="fixed inset-0 z-[99999] bg-transparent cursor-wait select-none pointer-events-auto"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                    onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                    onPointerDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                    onTouchStart={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                />
            )}
            <Drawer
                open={isOpen}
                onClose={handleClose}
                onCloseHover={() => {
                    try {
                        const url = getTargetParentUrl();
                        if (url) router.prefetch(url);
                    } catch (_err) { }
                }}
                title={drawerTitle}
                width="xl"
                hideHeader={isRenterPage}
                bodyClassName="overflow-y-auto overflow-x-hidden"
                className={`transition-[width] duration-300 ease-in-out overflow-hidden ${
                    isMediaPanelOpen ? '!w-[75vw]' : '!w-[60vw]'
                }`}
            >
                <div className="flex flex-col border-slate-300 bg-white shadow-sm min-h-[calc(100vh-60px)] overflow-x-hidden">
                    {!isRenterPage && (
                        <TabNavigation
                            categoryName={categoryName}
                            isIndividual={
                                categoryId === 2 ||
                                Boolean(categoryName?.toLowerCase().includes('individual')) ||
                                returnTab?.toLowerCase() === 'individual' ||
                                searchParams.get('from')?.toLowerCase() === 'individual'
                            }
                            hideOldDetails={
                                categoryId === 2 ||
                                Boolean(categoryName?.toLowerCase().includes('individual')) ||
                                returnTab?.toLowerCase() === 'individual' ||
                                searchParams.get('from')?.toLowerCase() === 'individual'
                            }
                            isMediaPanelOpen={isMediaPanelOpen}
                            onToggleMediaPanel={togglePanel}
                        />
                    )}
                    {showIncompatibleBanner && (
                        <div className="mx-4 mt-3 flex items-start gap-3 p-3.5 bg-amber-50/90 border border-amber-200/80 text-amber-900 rounded-xl shadow-xs transition-all duration-300">
                            <div className="p-1 bg-amber-100/80 rounded-lg text-amber-700 shrink-0 mt-0.5">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                                    <line x1="12" y1="9" x2="12" y2="13" />
                                    <line x1="12" y1="17" x2="12.01" y2="17" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <p className="text-xs leading-relaxed font-medium">
                                    {t('property.propertyDescriptionFloorIncompatible') ||
                                        "Property Description has been changed. One or more existing Floor records contain a Use that is not valid for the selected Property Description. Please update or remove the incompatible Floor records."}
                                </p>
                            </div>
                        </div>
                    )}
                    <div className="flex-1 flex flex-row min-h-0 relative p-1.5 md:p-2 gap-2 transition-all duration-300 overflow-x-hidden">
                        <div className="flex-1 min-w-0 flex flex-col transition-all duration-300 ease-in-out">
                            <QdeSaveProvider propertyId={propertyId}>
                                {children}
                            </QdeSaveProvider>
                        </div>

                        {!isRenterPage && (
                            <div
                                className={cn(
                                    "transition-all duration-300 ease-in-out z-30 shrink-0 sticky top-0 self-start h-[calc(100vh-140px)]",
                                    isMediaPanelOpen
                                        ? 'w-[208px] shrink-0 opacity-100 translate-x-0'
                                        : 'w-0 opacity-0 translate-x-full pointer-events-none overflow-hidden'
                                )}
                            >
                                <PropertyMediaPanel
                                    key={`qde:${numericPropertyId ?? 'no-prop'}:${numericSocietyId ?? ''}:${numericWingDetailId ?? ''}:${wardNo}:${propertyNo}:${partitionNo}`}
                                    propertyId={numericPropertyId}
                                    categoryId={
                                        categoryId ??
                                        (searchParams.get('categoryId') ? Number(searchParams.get('categoryId')) : null) ??
                                        (searchParams.get('hideWing') === 'true' && searchParams.get('hideSociety') === 'true' ? 2 : null) ??
                                        (categoryName?.toLowerCase().includes('individual') ? 2 : categoryName?.toLowerCase().includes('apartment') ? 1 : null)
                                    }
                                    propertyTypeId={propertyTypeId ?? undefined}
                                    initialPhotoSlots={photoSlots}
                                    initialPhotos={photos}
                                    loading={mediaLoading}
                                    onPhotosChange={setPhotos}
                                    onPhotoSlotsChange={setPhotoSlots}
                                    societyDetailId={numericSocietyId ?? undefined}
                                    wings={wings}
                                    wingName={wingName || (searchParams.get('wingName') || searchParams.get('wingname') || undefined)}
                                    wingDetailId={numericWingDetailId ?? undefined}
                                    wardNo={wardNo}
                                    propertyNo={propertyNo}
                                    partitionNo={partitionNo}
                                    propertyDescription={propertyDescription}
                                    isQuickDataEntry={true}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </Drawer>
        </div>
    );
}