'use client';

import type { DiscountData, PropertySocialDetailItem } from '@/types/ptis.types';

export type DiscountSubTab = 'discount' | 'social';
export type DiscountScopeLevel = 'All' | 'Apartment' | 'Wing' | 'Unit';

export interface LevelCounts {
  all: number;
  apartment: number;
  wing: number;
  unit: number;
}

export interface DiscountDataTabProps {
  propertyId?: number;
  initialData?: DiscountData;
  initialSocialData?: DiscountData;
  onDataChange?: (data: DiscountData) => void;
  readOnly?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  wardId?: string | number | null;
  wardNo?: string | null;
  propertyNo?: string | null;
  societyDetailId?: number | null;
  wingDetailsId?: number | null;
  wingName?: string | null;
  selectedFloor?: string | null;
  showHeader?: boolean;
  className?: string;
  isApartmentScreen?: boolean;
}

export interface DiscountCardProps {
  item: PropertySocialDetailItem;
  rowKey: string;
  index: number;
  isViewingThis: boolean;
  isEditingThis?: boolean;
  propertyNo?: string | null;
  wingName?: string | null;
  isApartmentScreen?: boolean;
  onViewDocument: (item: PropertySocialDetailItem, rowKey: string) => void;
  onEdit: (item: PropertySocialDetailItem, rowKey?: string) => void;
}
