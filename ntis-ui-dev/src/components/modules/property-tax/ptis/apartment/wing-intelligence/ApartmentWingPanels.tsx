'use client';

import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import DiscountDataTab from '@/components/modules/property-tax/ptis/tabs/DiscountDataTab';
import { OldDetailsPanel } from '../old-details/OldDetailsPanel';
import { BuildingPermissionRecords } from '../building-permission/BuildingPermissionRecords';
import type { BuildingPermissionData, DiscountData } from '@/types/ptis.types';
import { WingIntelligenceTopNavSection } from './ApartmentWingTopNav';
import { useTranslations } from 'next-intl';

export interface WingIntelligencePanelsProps {
  activeSection: WingIntelligenceTopNavSection;
  isExpanded: boolean;
  onToggleExpand: () => void;
  buildingPermissionData?: BuildingPermissionData | null;
  rawGridData?: unknown;
  masterTypes?: unknown[] | null;
  initialCertificateType?: string | null;
  discountData?: DiscountData | null;
  socialData?: DiscountData | null;
  propertyId?: number | string | null;
  wardId?: string | number | null;
  wardNo?: string | null;
  propertyNo?: string | null;
  wingDetailsId?: number | null;
  societyDetailId?: number | null;
  wingName?: string | null;
  selectedFloor?: string | null;
}

export const ApartmentWingPanels: React.FC<WingIntelligencePanelsProps> = ({
  activeSection,
  isExpanded,
  onToggleExpand,
  buildingPermissionData,
  rawGridData,
  masterTypes,
  initialCertificateType,
  discountData,
  socialData,
  propertyId,
  wardId,
  wardNo,
  propertyNo,
  wingDetailsId,
  societyDetailId,
  wingName,
  selectedFloor,
}) => {
  const tPanels = useTranslations('ptisRedesign.panels');
  const titles = {
    building: tPanels('building') || 'BUILDING PERMISSION RECORDS',
    discount: tPanels('discount') || 'DISCOUNT & SOCIAL DATA (Discounts & Concessions)',
    oldDetails: tPanels('oldDetails') || 'OLD DETAILS (Mapped Properties Society / Wing Wise)',
  };

  const title = titles[activeSection as 'building' | 'discount' | 'oldDetails'];
  if (!title) return null;

  if (activeSection === 'building') {
    return (
      <div className="w-full">
        <BuildingPermissionRecords
          buildingPermissionData={buildingPermissionData}
          rawGridData={rawGridData}
          masterTypes={masterTypes}
          initialCertificateType={initialCertificateType}
          isExpanded={isExpanded}
          onToggleExpand={onToggleExpand}
          propertyId={propertyId}
          wardId={wardId}
          wardNo={wardNo}
          propertyNo={propertyNo}
          societyDetailId={societyDetailId}
          wingDetailsId={wingDetailsId}
          wingName={wingName}
        />
      </div>
    );
  }

  if (activeSection === 'discount') {
    return (
      <div className="pt-1">
        <DiscountDataTab
          isExpanded={isExpanded}
          onToggleExpand={onToggleExpand}
          propertyId={typeof propertyId === 'number' ? propertyId : propertyId ? Number(propertyId) : undefined}
          initialData={discountData ?? undefined}
          initialSocialData={socialData ?? undefined}
          wardId={wardId}
          wardNo={wardNo}
          propertyNo={propertyNo}
          societyDetailId={societyDetailId}
          wingDetailsId={wingDetailsId}
          wingName={wingName}
          selectedFloor={selectedFloor}
          isApartmentScreen={true}
        />
      </div>
    );
  }

  return (
    <div className="pt-1">
      <div
        className="flex items-center gap-1.5 cursor-pointer select-none group pb-2"
        onClick={onToggleExpand}
      >
        <h2 className="text-[13px] font-black text-slate-900 uppercase tracking-wide">{title}</h2>
        {isExpanded ? (
          <ChevronDown size={16} strokeWidth={3} className="text-slate-400 group-hover:text-slate-600" />
        ) : (
          <ChevronRight size={16} strokeWidth={3} className="text-slate-400 group-hover:text-slate-600" />
        )}
      </div>

      {isExpanded && (
        <>
          {activeSection === 'oldDetails' && (
            <OldDetailsPanel
              wingDetailsId={wingDetailsId}
              societyDetailId={societyDetailId}
              wingName={wingName}
              selectedFloor={selectedFloor}
              onClose={onToggleExpand}
            />
          )}
        </>
      )}
    </div>
  );
};

export default ApartmentWingPanels;
