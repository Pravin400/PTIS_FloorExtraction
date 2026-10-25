/* eslint-disable @typescript-eslint/no-explicit-any */
import { FloorItem } from "@/types/asset/add-new-asset.types";

export interface BuildingValuation {
  floors: number;
  totalBuiltUpArea: number;
  capitalValue: number;
}

export interface InventoryValuation {
  items: number;
  totalQuantity: number;
  totalValue: number;
}

export interface ValuationResponse {
  building: BuildingValuation;
  furniture: InventoryValuation;
  itEquipment: InventoryValuation;
  electronics: InventoryValuation;
  vehicles: InventoryValuation;
  grandTotal: number;
}

export type ValuationDetailSection =
  | 'building'
  | 'furniture'
  | 'itEquipment'
  | 'electronics'
  | 'vehicles'
  | 'grandTotal';

export type ValuationDetailIconKey =
  | 'building'
  | 'furniture'
  | 'itEquipment'
  | 'electronics'
  | 'vehicles'
  | 'grandTotal';

export interface ValuationDetailColumn {
  key: string;
  label: string;
}

export type ValuationDetailRow = Record<string, string | number>;

export interface ValuationDetailSectionData {
  title: string;
  subtitle: string;
  bannerClassName: string;
  iconKey: ValuationDetailIconKey;
  columns: ValuationDetailColumn[];
  rows: ValuationDetailRow[];
  totalLabel: string;
  totalValue: number;
}

export type ValuationDetailsData = Record<ValuationDetailSection, ValuationDetailSectionData>;

export interface ValuationPageData {
  category: AssetCategory;
  valuation: ValuationResponse;
  details: ValuationDetailsData;
}

export type AssetCategory = 'building' | 'land' | 'infrastructure' | 'movable';

export interface LandSummaryProps {
  totalLandValue: number;
  developmentCost: number;
  marketValue: number;
}

export interface LandDetailsSectionProps {
  area: number;
  rate: number;
  setRate: (value: number) => void;
  totalLandValue: number;
}

export interface DevelopmentSectionProps {
  developmentCost: number;
  appreciation: number;
  setDevelopmentCost: (value: number) => void;
  setAppreciation: (value: number) => void;
  totalLandValue: number;
  totalAssetValue: number;
  marketValue: number;
}

export interface LandBreakdownProps {
  area: number;
  rate: number;
  developmentCost: number;
  appreciation: number;
  setRate: (value: number) => void;
  setDevelopmentCost: (value: number) => void;
  setAppreciation: (value: number) => void;
}

export interface ValuationRendererProps {
  category: AssetCategory;
  valuation: ValuationResponse;
  details: ValuationDetailsData;
}

export interface TaxationDetailsProps {
  formData: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

export interface InventoryItem {
  id?: string;
  itemName?: string;
  equipmentName?: string;
  typeModel?: string;
  brandModel?: string;
  purchaseDate?: string;
  condition?: string;
  status?: string;
  quantity?: number;
  unitValue?: number;
  totalValue?: number;
  specifications?: string;
}

export interface LandValuationProps {
  formData: any;
  plotCV?: any;
  rawInventories?: any[];
  categories?: any[];
  conditions?: any[];
}

export interface InfrastructureValuationProps {
  formData: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

export interface BuildingValuationSummaryCardsProps {
  summaryCardsData: any[];
  summaryScrollRef: React.RefObject<HTMLDivElement | null>;
  showSummaryLeft: boolean;
  showSummaryRight: boolean;
  scroll: (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right', type: 'summary' | 'detail') => void;
}

export interface BuildingValuationSummaryProps {
  floors: FloorItem[];
  rawInventories?: any[];
  categories?: any[];
  conditions?: any[];
  buildingCV?: any;
  cvRollup?: any;
  plotCV?: any;
}

export interface BuildingValuationDetailCardsProps {
  detailCards: any[];
  detailScrollRef: React.RefObject<HTMLDivElement | null>;
  showDetailLeft: boolean;
  showDetailRight: boolean;
  scroll: (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right', type: 'summary' | 'detail') => void;
}

export interface AssetValuationProps {
  formData: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  conditions?: any[];
}
