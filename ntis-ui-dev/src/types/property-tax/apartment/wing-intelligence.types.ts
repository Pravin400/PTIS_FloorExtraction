import React from 'react';

export interface PropertyTypeIconProps {
  type: 'Residential' | 'Commercial' | 'Amenity';
  className?: string;
}

export interface StatBadgeProps {
  label: string;
  value: string | number;
  highlight?: boolean;
}

export interface ExemptionSummaryProps {
  wingName: string;
  amount: string | number;
  count: number;
}

export interface OverallTaxSummaryProps {
  from?: string | number;
  to?: string | number;
  amount?: string | number;
}

export interface RevenueImpactSummaryProps {
  wingName: string;
  amount: string | number;
  pct: number;
  isPositive: boolean;
  previousRv?: string | number;
  revisedRv?: string | number;
  differenceRv?: string | number;
  affectedUnits?: number;
  oldDemand?: string | number;
  currentDemand?: string | number;
  retroDemand?: string | number;
  totalDemand?: string | number;
}

export interface WingCardHeaderProps {
  letter: string;
  name: string;
  rating: number;
  blockName: string;
  stats: {
    floors: string;
    props: number;
    area: number;
    collectedPct: number;
  };
  areaUnit?: string;
  colorClass: string;
  onAmcClick?: (e: React.MouseEvent) => void;
  onEdit?: (e: React.MouseEvent) => void;
  isSelected?: boolean;
  isCommonAmenity?: boolean;
}

export interface WingType {
  type: 'Residential' | 'Commercial' | 'Amenity';
  units: number;
  area: number;
  old: string | number;
  cur: string | number;
  retro: string | number;
  total: string | number;
  rev: string | number;
  [key: string]: unknown;
}

export interface WingTypeTableProps {
  types: WingType[];
  areaUnit?: string;
}

export interface WingCardFooterProps {
  wingName: string;
  exemption: { amount: string | number; count: number };
  overallTax: { from?: string | number; to?: string | number; amount?: string | number };
  revenueImpact: {
    amount: string | number;
    pct: number;
    isPositive: boolean;
    previousRv?: string | number;
    revisedRv?: string | number;
    differenceRv?: string | number;
    affectedUnits?: number;
    oldDemand?: string | number;
    currentDemand?: string | number;
    retroDemand?: string | number;
    totalDemand?: string | number;
  };
}

export interface WingData {
  id: string;
  wingId?: string | number | null;
  wingNo?: string | null;
  wingMasterId?: number | null;
  wingDetailId?: number | null;
  societyId?: number | null;
  letter: string;
  name: string;
  rating: number;
  blockName: string;
  stats: {
    floors: string;
    props: number;
    area: number;
    collectedPct: number;
  };
  areaUnit?: string;
  types: WingType[];
  exemption: { amount: string | number; count: number };
  overallTax: { from?: string | number; to?: string | number; amount?: string | number };
  revenueImpact: {
    amount: string | number;
    pct: number;
    isPositive: boolean;
    previousRv?: string | number;
    revisedRv?: string | number;
    differenceRv?: string | number;
    affectedUnits?: number;
    oldDemand?: string | number;
    currentDemand?: string | number;
    retroDemand?: string | number;
    totalDemand?: string | number;
  };
  colorClass: string;
  isCommonAmenity?: boolean;
}

export interface WingCardProps {
  data: WingData;
  isSelected?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
  onAmcClick?: (e: React.MouseEvent) => void;
  onEdit?: (e: React.MouseEvent) => void;
}

export interface WingWisePropertyType {
  propertyTypeName: string;
  propertyCount: number;
  totalArea: number;
  oldDemand: string;
  currentDemand: string;
  retroDemand: string;
  totalDemand: string;
  totalRevenue: string;
}

export interface RevenueImpactDetail {
  previousRV?: string;
  revisedRV?: string;
  differenceRV?: string;
  affectedUnits?: number;
}

export interface WingWiseWingDetails {
  wingId?: number | string | null;
  wingMasterId?: number | null;
  wingDetailId?: number | null;
  societyId?: number | null;
  societyDetailId?: number;
  wingNo: string;
  wingName: string;
  propertyCount: number;
  floorRange: string;
  totalArea: number;
  collectionPercentage: number;
  oldDemand: string;
  currentDemand: string;
  retroDemand: string;
  totalDemand: string;
  totalPropertyTypeDemand?: string;
  revenueImpact: string;
  revenueImpactPercentage: number;
  revenueImpactDetails?: RevenueImpactDetail[];
  exemptionAppliedAmount: string;
  exemptedPropertyCount: number;
  propertyTypes: WingWisePropertyType[];
  latitude?: string | number | null;
  longitude?: string | number | null;
  isCommonAmenity?: boolean;
}

export interface WingWiseDetailsItems {
  propertyId: number;
  propertyNo: string;
  wardId?: number;
  wardNo: string;
  societyId?: number;
  rateMasterAreaUnit?: string | null;
  wings: WingWiseWingDetails[];
  commonAmenities?: WingWiseWingDetails[];
  latitude?: string | number | null;
  longitude?: string | number | null;
}

export interface WingWiseDetailsResponse {
  success: boolean;
  message: string;
  items: WingWiseDetailsItems | null;
  errors: string[] | null;
  correlationId: string | null;
}
