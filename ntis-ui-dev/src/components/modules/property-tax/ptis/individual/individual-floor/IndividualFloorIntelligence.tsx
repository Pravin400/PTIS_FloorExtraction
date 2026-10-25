'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight, ChevronUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { IndividualFloorTopNav, type IndividualFloorTopNavSection } from './IndividualFloorTopNav';
import { RateableTaxTable } from './rateable/components/RateableTaxTable';
import { CapitalTaxTable } from './capital/components/CapitalTaxTable';
import { DualMethodComparisonTable } from './dualmethod/components/ComparisonTable';
import { DualMethodFloorDetails } from './dualmethod/components/DualMethodFloorDetails';
import { PTIS_UI_CLASSES } from '@/components/modules/property-tax/ptis/constants';

import BuildingPermissionTab from '@/components/modules/property-tax/ptis/tabs/BuildingPermissionTab';
import DiscountDataTab from '@/components/modules/property-tax/ptis/tabs/DiscountDataTab';
import IndividualOldDetailsTab from '../old-details/IndividualOldDetailsTab';

import type { RateableValueResponse } from '@/types/rateableValue.types';
import type { CapitalValueResponse } from '@/types/capitalValue.types';
import type { DualMethodResponse } from '@/types/dualMethod.types';
import type {
  BuildingPermissionData,
  DiscountData,
  OldDetailsData,
  OldFloorDetailsData,
  OldTaxesData,
  MappedPropertyItem,
} from '@/types/ptis.types';
import type { PtisTaxMode } from '@/types/property-tax/apartment';
import type { PropertyComparisonResponse } from '@/types/propertyComparison.types';
import type { TaxDetailsData } from '@/types/ptisMain-taxdetails.types';
import TaxDetails from '../individual-tax-details/TaxDetails/TaxDetails';
import {
  fetchIndividualRateableValueAction,
  fetchIndividualCapitalValueAction,
  fetchIndividualDualMethodAction,
  getIndividualBuildingCertificatesAction,
  fetchIndividualSocialAndDiscountDetailsAction,
} from '@/app/[locale]/property-tax/ptis/individual/action';

export interface IndividualFloorIntelligenceProps {
  propertyId?: number | string | null;
  wardNo?: string | null;
  wardId?: number | string | null;
  propertyNo?: string | null;
  partitionNo?: string | null;
  societyDetailId?: number | string | null;
  wingDetailsId?: number | string | null;
  wingName?: string | null;
  selectedFloor?: string | null;
  isApartmentScreen?: boolean;
  rateableData?: RateableValueResponse | null;
  capitalData?: CapitalValueResponse | null;
  dualMethodData?: DualMethodResponse | null;
  comparisonData?: PropertyComparisonResponse | null;
  rateableTaxDetails?: TaxDetailsData | null;
  capitalTaxDetails?: TaxDetailsData | null;
  buildingPermissionData?: BuildingPermissionData | null;
  discountData?: DiscountData | null;
  socialData?: DiscountData | null;
  oldDetailsData?: OldDetailsData | null;
  oldFloorTableData?: OldFloorDetailsData[] | null;
  oldTaxesData?: OldTaxesData | null;
  mappedPropertiesData?: MappedPropertyItem[] | null;
  taxMode?: PtisTaxMode;
  onTaxModeChange?: (mode: PtisTaxMode) => void;
  onRateableDataLoaded?: (data: RateableValueResponse) => void;
  onCapitalDataLoaded?: (data: CapitalValueResponse) => void;
  onDualMethodDataLoaded?: (data: DualMethodResponse) => void;
  isLoading?: boolean;
  locale?: string;
  onOpenAppliedRules?: () => void;
  hasAppliedRules?: boolean;
}

const SECTION_TITLES: Record<string, string> = {
  building: 'BUILDING PERMISSION (Certificates & Clearances)',
  discount: 'DISCOUNT & SOCIAL DATA (Discounts & Concessions)',
  oldDetails: 'OLD DETAILS (Mapped Properties / Historical Data)',
};

export const IndividualFloorIntelligence: React.FC<IndividualFloorIntelligenceProps> = ({
  propertyId,
  wardNo,
  wardId,
  propertyNo,
  partitionNo,
  societyDetailId,
  wingDetailsId,
  wingName,
  selectedFloor,
  isApartmentScreen: propIsApartmentScreen,
  rateableData,
  capitalData,
  dualMethodData,
  comparisonData: _comparisonData,
  rateableTaxDetails,
  capitalTaxDetails,
  buildingPermissionData,
  discountData,
  socialData,
  oldDetailsData,
  oldFloorTableData,
  oldTaxesData,
  mappedPropertiesData,
  taxMode = 'rateable',
  onTaxModeChange,
  onRateableDataLoaded,
  onCapitalDataLoaded,
  onDualMethodDataLoaded,
  isLoading = false,
  locale: propLocale,
  onOpenAppliedRules,
  hasAppliedRules,
}) => {
  const t = useTranslations('ptis');
  const contextLocale = useLocale();
  const locale = propLocale || contextLocale || 'en';
  const router = useRouter();
  const pathname = usePathname();
  const currentSearchParams = useSearchParams();

  const initialSectionFromUrl = useMemo<IndividualFloorTopNavSection | null>(() => {
    const rawTab = currentSearchParams?.get('tab')?.toLowerCase();
    if (rawTab === 'discount' || rawTab === 'discountdetails') return 'discount';
    if (rawTab === 'building' || rawTab === 'buildingpermission') return 'building';
    if (rawTab === 'olddetails' || rawTab === 'old') return 'oldDetails';
    return 'floor';
  }, [currentSearchParams]);

  const [activeSection, setActiveSection] = useState<IndividualFloorTopNavSection | null>(initialSectionFromUrl);
  const [isExpanded, setIsExpanded] = useState(true);
  const [internalTaxMode, setInternalTaxMode] = useState<PtisTaxMode>(taxMode);
  const [prevTaxModeProp, setPrevTaxModeProp] = useState(taxMode);

  if (taxMode !== prevTaxModeProp) {
    setPrevTaxModeProp(taxMode);
    setInternalTaxMode(taxMode);
  }
  const currentTaxMode = internalTaxMode;

  // Track property ID changes to reset fetched overrides
  const [prevPropId, setPrevPropId] = useState(propertyId);
  const [fetchedRateable, setFetchedRateable] = useState<RateableValueResponse | null>(null);
  const [fetchedCapital, setFetchedCapital] = useState<CapitalValueResponse | null>(null);
  const [fetchedDual, setFetchedDual] = useState<DualMethodResponse | null>(null);
  const [_fetchedComparison, setFetchedComparison] = useState<PropertyComparisonResponse | null>(null);
  const [isValuationLoading, setIsValuationLoading] = useState(false);
  const [_valuationError, setValuationError] = useState<string | null>(null);

  // States for Old Details collapsible sections (mutually exclusive)
  const [showOldFloorInfo, setShowOldFloorInfo] = useState(false);
  const [showOldTaxInfo, setShowOldTaxInfo] = useState(false);
  const [showOldMapInfo, setShowOldMapInfo] = useState(false);

  const handleSetShowOldFloorInfo = useCallback((value: boolean) => {
    setShowOldFloorInfo(value);
    if (value) {
      setShowOldTaxInfo(false);
      setShowOldMapInfo(false);
    }
  }, []);

  const handleSetShowOldTaxInfo = useCallback((value: boolean) => {
    setShowOldTaxInfo(value);
    if (value) {
      setShowOldFloorInfo(false);
      setShowOldMapInfo(false);
    }
  }, []);

  const handleSetShowOldMapInfo = useCallback((value: boolean) => {
    setShowOldMapInfo(value);
    if (value) {
      setShowOldFloorInfo(false);
      setShowOldTaxInfo(false);
    }
  }, []);

  // State for Floor Details expandable section below valuation table
  const [showFloorDetails, setShowFloorDetails] = useState(false);
  const [isFloorDetailsLoading, setIsFloorDetailsLoading] = useState(false);

  const [fetchedBuilding, setFetchedBuilding] = useState<BuildingPermissionData | null>(null);
  const [fetchedDiscount, setFetchedDiscount] = useState<DiscountData | null>(null);
  const [fetchedSocial, setFetchedSocial] = useState<DiscountData | null>(null);
  const [isLoadingBuilding, setIsLoadingBuilding] = useState(false);
  const [buildingError, setBuildingError] = useState<string | null>(null);
  const [isLoadingDiscount, setIsLoadingDiscount] = useState(false);
  const [discountError, setDiscountError] = useState<string | null>(null);

  if (propertyId !== prevPropId) {
    setPrevPropId(propertyId);
    setFetchedRateable(null);
    setFetchedCapital(null);
    setFetchedDual(null);
    setFetchedComparison(null);
    setValuationError(null);
    setFetchedBuilding(null);
    setBuildingError(null);
    setFetchedDiscount(null);
    setFetchedSocial(null);
    setDiscountError(null);
  }

  const rateableState = fetchedRateable ?? rateableData ?? null;
  const capitalState = fetchedCapital ?? capitalData ?? null;
  const dualState = fetchedDual ?? dualMethodData ?? null;
  const rateableTaxDetailsState = rateableTaxDetails ?? undefined;
  const capitalTaxDetailsState = capitalTaxDetails ?? undefined;

  const hasLoadedBuilding = Boolean(
    fetchedBuilding !== null ||
    (buildingPermissionData?.items && buildingPermissionData.items.length > 0)
  );

  const hasLoadedDiscount = Boolean(
    fetchedDiscount !== null ||
    fetchedSocial !== null ||
    (discountData?.items && discountData.items.length > 0) ||
    (socialData?.items && socialData.items.length > 0)
  );

  const buildingDataState = fetchedBuilding ?? (hasLoadedBuilding ? buildingPermissionData : null);
  const discountDataState = fetchedDiscount ?? (hasLoadedDiscount ? discountData : null);
  const socialDataState = fetchedSocial ?? (hasLoadedDiscount ? socialData : null);

  const isFetchingRef = useRef(false);

  // Fetch valuation data dynamically based on mode
  const fetchValuationForMode = useCallback(
    async (mode: PtisTaxMode, targetPropertyId: number | string) => {
      const numericId = Number(targetPropertyId);
      if (!numericId || isNaN(numericId) || numericId <= 0) return;
      if (isFetchingRef.current) return;

      isFetchingRef.current = true;
      setIsValuationLoading(true);
      setValuationError(null);
      try {
        if (mode === 'capital') {
          const res = await fetchIndividualCapitalValueAction(numericId);
          if (res.success && res.data) {
            setFetchedCapital(res.data);
            setValuationError(null);
            if (res.warning) {
              toast.warning(res.warning);
            }
            if (res.message) {
              toast.success(res.message);
            }
            onCapitalDataLoaded?.(res.data);
          } else {
            setFetchedCapital(null);
            const errMsg = res.error || res.message || 'Failed to fetch capital value data';
            setValuationError(errMsg);
            toast.error(errMsg);
          }
        } else if (mode === 'dual') {
          const dualRes = await fetchIndividualDualMethodAction(numericId);
          if (dualRes.success && dualRes.data) {
            setFetchedDual(dualRes.data);
            setValuationError(null);
            onDualMethodDataLoaded?.(dualRes.data);
          } else {
            setFetchedDual(null);
            const errMsg = dualRes.error || dualRes.message || 'Failed to fetch dual method data';
            setValuationError(errMsg);
            toast.error(errMsg);
          }
        } else {
          const res = await fetchIndividualRateableValueAction(numericId);
          if (res.success && res.data) {
            setFetchedRateable(res.data);
            setValuationError(null);
            onRateableDataLoaded?.(res.data);
          } else {
            setFetchedRateable(null);
            const errMsg = res.error || res.message || 'Failed to fetch rateable value data';
            setValuationError(errMsg);
            toast.error(errMsg);
          }
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : `Failed to fetch ${mode} valuation data`;
        setValuationError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setIsValuationLoading(false);
        isFetchingRef.current = false;
      }
    },
    [onCapitalDataLoaded, onDualMethodDataLoaded, onRateableDataLoaded]
  );

  const attemptedFetchRef = useRef<string | null>(null);

  // Automatically fetch valuation data if property changes or mode is active without data loaded
  useEffect(() => {
    if (!propertyId) return;
    const numericId = Number(propertyId);
    if (!numericId || isNaN(numericId) || numericId <= 0) return;

    const currentKey = `${numericId}_${currentTaxMode}`;
    if (attemptedFetchRef.current === currentKey) return;

    if (currentTaxMode === 'capital' && !capitalState && !isValuationLoading) {
      attemptedFetchRef.current = currentKey;
      const timer = setTimeout(() => {
        fetchValuationForMode('capital', numericId);
      }, 0);
      return () => clearTimeout(timer);
    } else if (currentTaxMode === 'dual' && !dualState && !isValuationLoading) {
      attemptedFetchRef.current = currentKey;
      const timer = setTimeout(() => {
        fetchValuationForMode('dual', numericId);
      }, 0);
      return () => clearTimeout(timer);
    } else if (currentTaxMode === 'rateable' && !rateableState && !isValuationLoading) {
      attemptedFetchRef.current = currentKey;
      const timer = setTimeout(() => {
        fetchValuationForMode('rateable', numericId);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [propertyId, currentTaxMode, capitalState, dualState, rateableState, isValuationLoading, fetchValuationForMode]);

  // On-demand fetch for Rateable and Capital section APIs when "Show Floor Details" is expanded
  const handleToggleShowFloorDetails = useCallback(async () => {
    const nextState = !showFloorDetails;
    setShowFloorDetails(nextState);

    if (nextState && propertyId) {
      const numericId = Number(propertyId);
      if (numericId > 0) {
        const needRateable = !rateableState;
        const needCapital = !capitalState;

        if (needRateable || needCapital) {
          setIsFloorDetailsLoading(true);
          try {
            const promises: Promise<void>[] = [];
            if (needRateable) {
              promises.push(
                fetchIndividualRateableValueAction(numericId).then((res) => {
                  if (res.success && res.data) {
                    setFetchedRateable(res.data);
                    onRateableDataLoaded?.(res.data);
                  } else if (res.error) {
                    toast.error(res.error);
                  }
                })
              );
            }
            if (needCapital) {
              promises.push(
                fetchIndividualCapitalValueAction(numericId).then((res) => {
                  if (res.success && res.data) {
                    setFetchedCapital(res.data);
                    onCapitalDataLoaded?.(res.data);
                  } else if (res.error) {
                    toast.error(res.error);
                  }
                })
              );
            }
            await Promise.all(promises);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to fetch floor details breakdown');
          } finally {
            setIsFloorDetailsLoading(false);
          }
        }
      }
    }
  }, [showFloorDetails, propertyId, rateableState, capitalState, onRateableDataLoaded, onCapitalDataLoaded]);

  // Tab mode switch handler — ensures Floor Details tab is active and loads data dynamically
  const handleTaxModeChange = (mode: PtisTaxMode) => {
    setActiveSection('floor');
    setIsExpanded(true);
    setInternalTaxMode(mode);
    onTaxModeChange?.(mode);

    if (propertyId) {
      attemptedFetchRef.current = `${Number(propertyId)}_${mode}`;
      fetchValuationForMode(mode, propertyId);
    }
  };

  const searchParamsObj = useMemo(() => {
    const obj: Record<string, string | string[] | undefined> = {};
    if (currentSearchParams) {
      currentSearchParams.forEach((value, key) => {
        obj[key] = value;
      });
    }
    if (wardNo) obj.wardNo = wardNo;
    if (wardId) obj.wardId = String(wardId);
    if (propertyNo) obj.propertyNo = propertyNo;
    if (partitionNo) obj.partitionNo = partitionNo;
    if (propertyId) obj.propertyId = String(propertyId);
    return obj;
  }, [currentSearchParams, wardNo, wardId, propertyNo, partitionNo, propertyId]);

  const effectiveSocietyDetailId = societyDetailId ?? (searchParamsObj.societyDetailId ? Number(searchParamsObj.societyDetailId) : null);
  const effectiveWingDetailId = wingDetailsId ?? (searchParamsObj.wingDetailId ? Number(searchParamsObj.wingDetailId) : null);
  const effectiveWingName = wingName ?? (searchParamsObj.wingName as string | null);
  const isApartmentScreen = propIsApartmentScreen ?? false;

  // On-demand fetch for Building Permission certificates
  const handleFetchBuildingData = useCallback(async () => {
    if (!propertyId) return;
    const numericId = Number(propertyId);
    if (!numericId || isNaN(numericId) || numericId <= 0) return;

    setIsLoadingBuilding(true);
    setBuildingError(null);
    try {
      const res = await getIndividualBuildingCertificatesAction(numericId);
      if (res.success && res.data) {
        setFetchedBuilding(res.data);
        setBuildingError(null);
      } else {
        const errorMsg = res.error || 'Failed to fetch building permission records';
        setBuildingError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch building permission records';
      setBuildingError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoadingBuilding(false);
    }
  }, [propertyId]);

  // On-demand fetch for Discount & Social data
  const handleFetchDiscountData = useCallback(async () => {
    if (!propertyId) return;
    const numericId = Number(propertyId);
    if (!numericId || isNaN(numericId) || numericId <= 0) return;

    setIsLoadingDiscount(true);
    setDiscountError(null);
    try {
      const res = await fetchIndividualSocialAndDiscountDetailsAction(
        numericId,
        effectiveSocietyDetailId ? Number(effectiveSocietyDetailId) : null,
        effectiveWingDetailId ? Number(effectiveWingDetailId) : null
      );
      if (res.success) {
        if (res.discountData) setFetchedDiscount(res.discountData);
        if (res.socialData) setFetchedSocial(res.socialData);
        setDiscountError(null);
      } else {
        const errorMsg = res.error || 'Failed to fetch discount and social data';
        if (!errorMsg.includes('Apartment/Society') && !errorMsg.includes('main property')) {
          setDiscountError(errorMsg);
          toast.error(errorMsg);
        } else {
          setDiscountError(null);
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch discount and social data';
      if (!errorMsg.includes('Apartment/Society') && !errorMsg.includes('main property')) {
        setDiscountError(errorMsg);
        toast.error(errorMsg);
      } else {
        setDiscountError(null);
      }
    } finally {
      setIsLoadingDiscount(false);
    }
  }, [propertyId, effectiveSocietyDetailId, effectiveWingDetailId]);

  // Auto-fetch on-demand if the tab is selected on initial mount or URL change and data is not yet loaded
  React.useEffect(() => {
    if (activeSection === 'building' && propertyId && !hasLoadedBuilding && !isLoadingBuilding && !buildingError) {
      void Promise.resolve().then(() => {
        handleFetchBuildingData();
      });
    }
  }, [activeSection, propertyId, hasLoadedBuilding, isLoadingBuilding, buildingError, handleFetchBuildingData]);

  React.useEffect(() => {
    if (
      activeSection === 'discount' &&
      propertyId &&
      !hasLoadedDiscount &&
      !isLoadingDiscount &&
      !discountError
    ) {
      void Promise.resolve().then(() => {
        handleFetchDiscountData();
      });
    }
  }, [activeSection, propertyId, hasLoadedDiscount, isLoadingDiscount, discountError, handleFetchDiscountData]);

  if (isLoading) {
    return (
      <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs animate-pulse space-y-4">
        <div className="h-8 bg-slate-200 rounded w-1/3" />
        <div className="h-48 bg-slate-100 rounded" />
      </div>
    );
  }

  const activeTitle = activeSection ? SECTION_TITLES[activeSection] : null;

  return (
    <div className="bg-white p-3 rounded-xl border border-zinc-200 shadow-xs relative font-sans">
      {/* 1. Top Navigation Bar */}
      <IndividualFloorTopNav
        activeSection={activeSection}
        onToggleSection={(section) => {
          if (section === 'floor') {
            setActiveSection('floor');
            setIsExpanded(true);
            const params = new URLSearchParams(currentSearchParams ? currentSearchParams.toString() : '');
            if (params.has('tab')) {
              params.delete('tab');
              router.replace(`${pathname}?${params.toString()}`, { scroll: false });
            }
            return;
          }
          if (activeSection === section) {
            setIsExpanded((prev) => !prev);
          } else {
            setActiveSection(section);
            setIsExpanded(true);
            const params = new URLSearchParams(currentSearchParams ? currentSearchParams.toString() : '');
            params.set('tab', section === 'oldDetails' ? 'olddetails' : section);
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });

            // On-demand lazy load when user opens inactive tabs
            if (section === 'building' && propertyId && !hasLoadedBuilding) {
              handleFetchBuildingData();
            } else if (section === 'discount' && propertyId && !hasLoadedDiscount) {
              handleFetchDiscountData();
            }
          }
        }}
        taxMode={currentTaxMode}
        onTaxModeChange={handleTaxModeChange}
        isLoadingValuation={isValuationLoading}
        isLoadingBuilding={isLoadingBuilding}
        isLoadingDiscount={isLoadingDiscount}
        onOpenAppliedRules={onOpenAppliedRules}
        hasAppliedRules={hasAppliedRules}
      />

      {/* 2. Floor Details Section by Valuation Mode (Rateable, Capital, Dual Method) */}
      {activeSection === 'floor' && (
        <div className="pt-2">
          {isValuationLoading ? (
            <div className="p-8 flex flex-col items-center justify-center space-y-3 bg-white rounded-lg border border-slate-200 min-h-[220px]">
              <Loader2 className="w-8 h-8 text-[#0047cc] animate-spin" />
              <p className="text-xs font-bold text-slate-600 tracking-wide uppercase">
                {currentTaxMode === 'capital'
                  ? (t('valuation.loadingCapital') || 'Loading Capital Value Data...')
                  : currentTaxMode === 'dual'
                  ? (t('valuation.loadingDual') || 'Loading Dual Method Valuation Data...')
                  : (t('valuation.loadingRateable') || 'Loading Rateable Value Data...')}
              </p>
            </div>
          ) : (
            <>
              {currentTaxMode === 'rateable' && (
                <RateableTaxTable
                  rateableData={rateableState}
                  searchParams={searchParamsObj}
                  locale={locale}
                  propertyId={propertyId ? Number(propertyId) : undefined}
                />
              )}

          {currentTaxMode === 'capital' && (
            <CapitalTaxTable
              capitalData={capitalState}
              searchParams={searchParamsObj}
              locale={locale}
              propertyId={propertyId ? Number(propertyId) : undefined}
            />
          )}

          {currentTaxMode === 'dual' && (
            <>
              <div className="w-full flex flex-col gap-3 py-1">
                <DualMethodComparisonTable dualMethodData={dualState} locale={locale} />
              </div>

              {/* Centered Show/Hide Floor Details Button (Dual Method Only) */}
              <div className="my-2 flex justify-center">
                <button
                  type="button"
                  onClick={handleToggleShowFloorDetails}
                  className={PTIS_UI_CLASSES.expandButton}
                >
                  {showFloorDetails ? (
                    <>
                      {t('actions.hideFloorDetails')}{' '}
                      <ChevronUp className="h-4 w-4 text-indigo-600" />
                    </>
                  ) : (
                    <>
                      {t('actions.showFloorDetails')}{' '}
                      <ChevronDown className="h-4 w-4 text-indigo-600" />
                    </>
                  )}
                </button>
              </div>

              {/* Expandable Dual Method Floor Section */}
              {showFloorDetails && (
                <div className="py-2 space-y-3">
                  {isFloorDetailsLoading ? (
                    <div className="p-6 flex flex-col items-center justify-center space-y-2 bg-slate-50 rounded-lg border border-slate-200 min-h-[140px]">
                      <Loader2 className="w-6 h-6 text-[#0047cc] animate-spin" />
                      <p className="text-xs font-semibold text-slate-600">
                        {t('valuation.loadingFloorBreakdown') || 'Loading Rateable & Capital Floor Details Breakdown...'}
                      </p>
                    </div>
                  ) : (
                    <DualMethodFloorDetails
                      rateableSection={
                        <div className="space-y-3">
                          <RateableTaxTable
                            rateableData={rateableState}
                            searchParams={searchParamsObj}
                            locale={locale}
                            propertyId={propertyId ? Number(propertyId) : undefined}
                          />
                          {rateableTaxDetailsState && (
                            <div className="p-3 bg-white rounded-b-md border-t border-slate-200">
                              <TaxDetails
                                initialTaxDetails={rateableTaxDetailsState}
                                activeTab="current"
                              />
                            </div>
                          )}
                        </div>
                      }
                      capitalSection={
                        <div className="space-y-3">
                          <CapitalTaxTable
                            capitalData={capitalState}
                            searchParams={searchParamsObj}
                            locale={locale}
                            propertyId={propertyId ? Number(propertyId) : undefined}
                          />
                          {capitalTaxDetailsState && (
                            <div className="p-3 bg-white rounded-b-md border-t border-slate-200">
                              <TaxDetails
                                initialTaxDetails={capitalTaxDetailsState}
                                activeTab="current"
                              />
                            </div>
                          )}
                        </div>
                      }
                    />
                  )}
                </div>
              )}
            </>
          )}
            </>
          )}
        </div>
      )}

      {/* 3. Building Permission, Discount, or Old Details Tabs */}
      {activeSection && activeSection !== 'floor' && (
        activeSection === 'discount' ? (
          isLoadingDiscount ? (
            <div className="p-8 flex flex-col items-center justify-center space-y-3 bg-white rounded-lg border border-slate-200 min-h-[180px]">
              <Loader2 className="w-7 h-7 text-[#0047cc] animate-spin" />
              <p className="text-xs font-bold text-slate-600 tracking-wide uppercase">
                {t('valuation.loadingDiscount') || 'Loading Discount & Social Data...'}
              </p>
            </div>
          ) : (
            <div className="pt-2">
              <DiscountDataTab
                isExpanded={isExpanded}
                onToggleExpand={() => setIsExpanded((prev) => !prev)}
                propertyId={propertyId ? Number(propertyId) : undefined}
                initialData={discountDataState ?? undefined}
                initialSocialData={socialDataState ?? undefined}
                wardId={wardId}
                wardNo={wardNo}
                propertyNo={propertyNo}
                societyDetailId={effectiveSocietyDetailId ? Number(effectiveSocietyDetailId) : undefined}
                wingDetailsId={effectiveWingDetailId ? Number(effectiveWingDetailId) : undefined}
                wingName={effectiveWingName}
                selectedFloor={selectedFloor}
                isApartmentScreen={isApartmentScreen}
              />
            </div>
          )
        ) : activeTitle ? (
          <div className="pt-2">
            <div
              className="flex items-center gap-1.5 cursor-pointer select-none group pb-2"
              onClick={() => setIsExpanded((prev) => !prev)}
            >
              <h2 className="text-[13px] font-black text-slate-900 uppercase tracking-wide">
                {activeTitle}
              </h2>
              {isExpanded ? (
                <ChevronDown size={16} strokeWidth={3} className="text-slate-400 group-hover:text-slate-600" />
              ) : (
                <ChevronRight size={16} strokeWidth={3} className="text-slate-400 group-hover:text-slate-600" />
              )}
            </div>

            {isExpanded && (
              <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200">
                {activeSection === 'building' && (
                  <BuildingPermissionTab
                    data={buildingDataState ?? undefined}
                    propertyId={propertyId ? Number(propertyId) : undefined}
                    wardNo={wardNo ?? undefined}
                    wardId={wardId ? Number(wardId) : undefined}
                    propertyNo={propertyNo ?? undefined}
                    partitionNo={partitionNo ?? undefined}
                    societyDetailId={societyDetailId ?? undefined}
                    isLoading={isLoadingBuilding}
                    error={buildingError}
                    onRetry={handleFetchBuildingData}
                  />
                )}

                {activeSection === 'oldDetails' && (
                  <IndividualOldDetailsTab
                    propertyId={propertyId}
                    showOldFloorInfo={showOldFloorInfo}
                    setShowOldFloorInfo={handleSetShowOldFloorInfo}
                    showOldTaxInfo={showOldTaxInfo}
                    setShowOldTaxInfo={handleSetShowOldTaxInfo}
                    showOldMapInfo={showOldMapInfo}
                    setShowOldMapInfo={handleSetShowOldMapInfo}
                    oldFloorTableData={oldFloorTableData ?? []}
                    oldDetailsData={oldDetailsData ?? undefined}
                    oldTaxesData={oldTaxesData ?? null}
                    mappedPropertiesData={mappedPropertiesData ?? []}
                  />
                )}
              </div>
            )}
          </div>
        ) : null
      )}
    </div>
  );
};

export default IndividualFloorIntelligence;
