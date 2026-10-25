'use client';
import React from 'react';
import { Drawer } from '@/components/common/Drawer';
import { useTranslations } from 'next-intl';
import {
  AmcHeader,
  AmcAssessmentYear,
  AmcSummaryGrid,
  AmcCollectionPosition,
  AmcAppliedDiscounts,
  DiscountRule,
} from './ApartmentAmcSummaryPanels';
import {
  AmcUnitWiseDiscounts,
  AmcExemptionPosition,
  AmcFooter,
  UnitDiscount,
} from './ApartmentAmcUnitDiscountsTable';

export type { DiscountRule, UnitDiscount };

export interface AmcDrawerProps {
  open: boolean;
  onClose: () => void;
  wingId: string | null;
}

const MOCK_RULES: DiscountRule[] = [
  { id: 1, name: 'Early Payment Rebate', description: '12 properties - 5% rate', amount: 3150 },
  { id: 2, name: 'Women Ownership Benefit', description: '4 properties - eligible share', amount: 1241 },
  { id: 3, name: 'Green Building Incentive', description: '3 properties - fixed benefit', amount: 1000 },
];

const MOCK_UNITS: UnitDiscount[] = [
  { id: '1', propUnit: 'D/101', wingInfo: 'D Wing', owner: 'Matoshree Builders', use: 'Residential', type: 'Early Payment', discountRule: '5% payment rebate', amount: 750 },
  { id: '2', propUnit: 'D/104', wingInfo: 'D Wing', owner: 'Patil Family', use: 'Residential', type: 'Women Ownership', discountRule: 'Female ownership benefit', amount: 641 },
  { id: '3', propUnit: 'D/105', wingInfo: 'D Wing', owner: 'Shine Traders', use: 'Commercial', type: 'Early Payment', discountRule: '5% payment rebate', amount: 1000 },
  { id: '4', propUnit: 'D/701', wingInfo: 'D Wing', owner: 'Society Office', use: 'Amenity', type: 'Green Building', discountRule: 'Green certified block', amount: 1000 },
  { id: '5', propUnit: 'D/802', wingInfo: 'D Wing', owner: 'Kulkarni Family', use: 'Residential', type: 'Early Payment', discountRule: '5% payment rebate', amount: 920 },
];

export const ApartmentAmcDrawer: React.FC<AmcDrawerProps> = ({ open, onClose, wingId }) => {
  const t = useTranslations('ptisRedesign.wingIntelligence.details');

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={<AmcHeader wingName={wingId ? `${wingId} Wing` : 'D Wing'} blockName="Lotus Block" propertiesCount={14} floors="G + 6" t={t} />}
      width="md"
    >
      <div className="flex flex-col h-full bg-[#fcfcfd]">
        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
          <AmcAssessmentYear year="2026-27" t={t} />
          <AmcSummaryGrid totalDemand={88500} collection={28900} collectionPct={32.6} balance={59600} discountsApplied={3100} discountRulesCount={3} t={t} />
          <AmcCollectionPosition recoveryPct={32.6} collection={28900} totalDemand={88500} currentDemand={40220} retroDemand={42390} t={t} />
          <AmcAppliedDiscounts totalAmount={3100} rules={MOCK_RULES} t={t} />
          <AmcUnitWiseDiscounts propertiesCount={5} units={MOCK_UNITS} t={t} />
          <AmcExemptionPosition exemptCount={2} totalAmount={2540} t={t} />
        </div>
        <div className="px-4 md:px-6 pb-4 bg-white sticky bottom-0 border-t border-slate-100">
          <AmcFooter onClose={onClose} onViewLedger={() => {}} t={t} />
        </div>
      </div>
    </Drawer>
  );
};

export default ApartmentAmcDrawer;
