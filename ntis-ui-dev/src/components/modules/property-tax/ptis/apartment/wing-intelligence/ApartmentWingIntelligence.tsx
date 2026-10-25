'use client';

import React, { useMemo, useState } from 'react';
import { ApartmentWingHeader } from './ApartmentWingHeader';
import { ApartmentWingTopNav, WingIntelligenceTopNavSection } from './ApartmentWingTopNav';
import { ApartmentWingCardList } from './ApartmentWingCardList';
import { useApartmentWingScrollControl, useApartmentWingUrlParams, mapWingData } from '@/hooks/property-tax/apartment';
import { WingData, WingWiseDetailsItems } from '@/types/property-tax/apartment';
import { ApartmentAmcDrawer } from '../modals/ApartmentAmcDrawer';
import { useRouter, useParams } from 'next/navigation';
import { defaultLocale } from '@/i18n/config';
import { ApartmentWingPanels } from './ApartmentWingPanels';
import { ApartmentEditWingModal } from './ApartmentEditWingModal';
import { ApartmentWingSkeleton } from './ApartmentWingSkeleton';
import type { BuildingPermissionData, DiscountData } from '@/types/ptis.types';
import type { PtisTaxMode } from '@/types/property-tax/apartment';

export interface ApartmentWingIntelligenceProps {
  data?: WingWiseDetailsItems | null;
  propertyId?: number | string | null;
  selectedWingId?: number | null;
  selectedWingDetailId?: number | null;
  selectedSocietyDetailId?: number | null;
  selectedWingName?: string | null;
  selectedFloor?: string | null;
  buildingPermissionData?: BuildingPermissionData | null;
  discountData?: DiscountData | null;
  socialData?: DiscountData | null;
  taxMode?: PtisTaxMode;
  onTaxModeChange?: (mode: PtisTaxMode) => void;
  onWingSelect?: (wingMasterId: number | null, wingDetailId: number | null, societyId?: number | null, wingName?: string | null, wingNo?: string | null) => void;
  isLoading?: boolean;
  rawGridData?: unknown;
  masterTypes?: unknown[] | null;
}

export const ApartmentWingIntelligence: React.FC<ApartmentWingIntelligenceProps> = ({
  data, propertyId, selectedWingId, selectedWingDetailId, selectedSocietyDetailId, selectedWingName, selectedFloor,
  buildingPermissionData, discountData, socialData, taxMode, onTaxModeChange, onWingSelect, isLoading = false,
  rawGridData, masterTypes,
}) => {
  const [activeSection, setActiveSection] = useState<WingIntelligenceTopNavSection | null>('wing');
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAmcDrawerOpen, setIsAmcDrawerOpen] = useState(false);
  const [amcWingId, setAmcWingId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingWing, setEditingWing] = useState<WingData | null>(null);
  const {
    leftArrowRef,
    rightArrowRef,
    scrollNext,
    scrollPrev,
    checkScroll,
    initScrollRef,
    hiddenLeftCount,
    hiddenRightCount,
  } = useApartmentWingScrollControl();
  const { setWingParams } = useApartmentWingUrlParams();

  const router = useRouter();
  const routeParams = useParams();
  const currentLocale = (routeParams?.locale as string) || defaultLocale;
  
  const mappedWings: WingData[] = useMemo(() => {
    return mapWingData(data);
  }, [data]);

  const activeWing = useMemo(() => {
    const wings = data?.wings || [];
    const amenities = data?.commonAmenities || [];
    if (wings.length === 0 && amenities.length === 0) return null;
    if (selectedWingDetailId !== undefined && selectedWingDetailId !== null) {
      return wings.find((w) => w.wingDetailId === selectedWingDetailId) || null;
    }
    if (selectedWingId !== undefined && selectedWingId !== null) {
      return wings.find((w) => w.wingMasterId === selectedWingId) || null;
    }
    if (selectedWingName) {
      return (
        wings.find((w) => (w.wingName || w.wingNo) === selectedWingName) ||
        amenities.find((w) => (w.wingName || w.wingNo) === selectedWingName) ||
        null
      );
    }
    return null;
  }, [data, selectedWingDetailId, selectedWingId, selectedWingName]);

  const activeWingDetailId = selectedWingDetailId !== undefined ? selectedWingDetailId : (activeWing?.wingDetailId ?? null);
  const activeWingMasterId = selectedWingId !== undefined ? selectedWingId : (activeWing?.wingMasterId ?? null);
  const activeSocietyDetailId = selectedSocietyDetailId ?? activeWing?.societyId ?? data?.societyId ?? null;
  const activeWingName = selectedWingName !== undefined ? selectedWingName : (activeWing?.wingName ?? activeWing?.wingNo ?? null);

  const handleCardSelect = (wing: WingData) => {
    const isCurrentlySelected = !!(
      (activeWingDetailId && wing?.wingDetailId === activeWingDetailId) ||
      (activeWingMasterId && wing?.wingMasterId === activeWingMasterId) ||
      (wing.isCommonAmenity && Boolean(activeWingName) && (wing.name === activeWingName || wing.wingNo === activeWingName))
    );

    if (isCurrentlySelected) {
      // Toggle off: deselect the current wing
      onWingSelect?.(null, null, null, null, null);
      setWingParams({
        wardId: data?.wardId ? String(data.wardId) : null,
        wingId: null,
        wingDetailId: null,
        societyId: null,
        societyDetailId: null,
        wingName: null,
      });
    } else {
      // Select the wing
      const wMasterId = wing?.wingMasterId ?? null;
      const wDetailId = wing?.wingDetailId ?? null;
      const socId = wing?.societyId ?? data?.societyId ?? selectedSocietyDetailId ?? null;
      const wName = wing?.name || wing?.wingNo || null;
      onWingSelect?.(wMasterId, wDetailId, socId, wName, wName);
      setWingParams({
        wardId: data?.wardId ? String(data.wardId) : null,
        wingId: wMasterId ? String(wMasterId) : null,
        wingDetailId: wDetailId ? String(wDetailId) : null,
        societyId: socId ? String(socId) : null,
        societyDetailId: socId ? String(socId) : null,
        wingName: wName,
      });
    }
  };

  const handleCardEdit = (wing: WingData) => {
    const propId = propertyId || data?.propertyId;
    if (propId) {
      const q = new URLSearchParams();
      if (wing?.wingDetailId) q.set('wingDetailId', String(wing.wingDetailId));
      if (wing?.wingMasterId) q.set('wingId', String(wing.wingMasterId));
      const socId = wing?.societyId ?? data?.societyId ?? selectedSocietyDetailId;
      if (socId) { q.set('societyId', String(socId)); q.set('societyDetailId', String(socId)); }
      if (data?.wardNo) q.set('wardNo', String(data.wardNo));
      if (data?.wardId) q.set('wardId', String(data.wardId));
      if (data?.propertyNo) q.set('propertyNo', String(data.propertyNo));
      q.set('isWingWise', 'true');
      q.set('returnTab', 'apartment');
      q.set('from', 'apartment');
      q.set('fromWingEdit', 'true');
      q.set('hideSociety', 'true');
      router.push(`/${currentLocale}/property-tax/ptis/QuickDataEntry/${propId}/Wing?${q.toString()}`);
    } else {
      setEditingWing(wing);
      setIsEditModalOpen(true);
    }
  };

  if (isLoading && (!data || !data.wings || data.wings.length === 0)) {
    return <ApartmentWingSkeleton />;
  }

  
  
  return (
    <div className="bg-white p-3 rounded-xl border border-zinc-200 shadow-xs relative font-sans">
      <ApartmentWingTopNav
        activeSection={activeSection}
        onToggleSection={(section) => {
          if (activeSection === section) {
            setIsExpanded((prev) => !prev);
          } else {
            setActiveSection(section);
            setIsExpanded(true);
          }
        }}
        taxMode={taxMode}
        onTaxModeChange={onTaxModeChange}
      />

      {/* 1. Wing Intelligence Section */}
      {activeSection === 'wing' && (
        <div>
          <ApartmentWingHeader
            totalWings={mappedWings.length}
            isExpanded={isExpanded}
            onToggle={() => setIsExpanded((prev) => !prev)}
          />
          {isExpanded && (
            <ApartmentWingCardList
              mappedWings={mappedWings}
              activeWingDetailId={activeWingDetailId}
              activeWingMasterId={activeWingMasterId}
              activeWingName={activeWingName}
              initScrollRef={initScrollRef}
              leftArrowRef={leftArrowRef}
              rightArrowRef={rightArrowRef}
              scrollPrev={scrollPrev}
              scrollNext={scrollNext}
              checkScroll={checkScroll}
              hiddenLeftCount={hiddenLeftCount}
              hiddenRightCount={hiddenRightCount}
              onCardSelect={handleCardSelect}
              onAmcClick={(wing) => {
                setAmcWingId(wing?.wingId?.toString() ?? null);
                setIsAmcDrawerOpen(true);
                setWingParams({ IsAmc: 'true' });
              }}
              onCardEdit={handleCardEdit}
            />
          )}
        </div>
      )}

      {/* 2. Building, Discount, or Old Details Collapsible Panels */}
      {activeSection && activeSection !== 'wing' && (
        <ApartmentWingPanels
          activeSection={activeSection}
          isExpanded={isExpanded}
          onToggleExpand={() => setIsExpanded((prev) => !prev)}
          buildingPermissionData={buildingPermissionData}
          discountData={discountData}
          socialData={socialData}
          propertyId={propertyId}
          wardId={data?.wardId}
          wardNo={data?.wardNo}
          propertyNo={data?.propertyNo}
          wingDetailsId={activeWingDetailId}
          societyDetailId={activeSocietyDetailId}
          wingName={activeWingName}
          selectedFloor={selectedFloor}
          rawGridData={rawGridData}
          masterTypes={masterTypes}
        />
      )}

      <ApartmentAmcDrawer
        open={isAmcDrawerOpen}
        onClose={() => { setIsAmcDrawerOpen(false); setWingParams({ IsAmc: null }); }}
        wingId={amcWingId}
      />

      <ApartmentEditWingModal
        open={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setEditingWing(null); }}
        wing={editingWing}
        onSuccess={() => { router.refresh(); }}
      />
    </div>
  );
};

export default ApartmentWingIntelligence;
export { ApartmentWingIntelligence as PtisWingIntelligence };
