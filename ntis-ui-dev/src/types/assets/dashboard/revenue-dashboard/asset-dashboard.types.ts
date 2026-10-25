/* eslint-disable @typescript-eslint/no-explicit-any */
import { LucideIcon } from 'lucide-react';
type AssetDashboardTypeByCategory = any;
type AssetDashboardAssetByType = any;
type AssetDashboardLocation = any;

export interface DashboardBackInfoItem { label: string; value: string; category?: string; }
export interface DashboardCategoryItem { id: string; name: string; count: number; value: number; color: string; description: string; categoryId?: number; }
export interface DashboardZoneDistributionItem { name: string; value: number; }

export interface DashboardAuctionBidItem {
  auctionId: string; property: string; amount: string; bids: number; timestamp: number; time: string;
  location?: string; reservePrice?: string; area?: string; publishedBy?: string; approvedBy?: string; submittedBy?: string;
}

export interface DashboardStats {
  totalAssets: { value: string; change: string; backInfo: DashboardBackInfoItem[] };
  totalValue: { value: string; change: string; backInfo: DashboardBackInfoItem[] };
  monetized: { value: string; change: string; backInfo: DashboardBackInfoItem[] };
  encroachments: { value: string; change: string; backInfo: DashboardBackInfoItem[] };
  maintenance: { value: string; change: string; backInfo: DashboardBackInfoItem[] };
  auctions: { value: string; change: string; backInfo: DashboardBackInfoItem[] };
  acquisitions: { value: string; change: string; backInfo: DashboardBackInfoItem[] };
}

export interface DashboardDataPayload {
  stats: DashboardStats; filteredAssets: MunicipalAsset[]; categories: DashboardCategoryItem[];
  zoneDistribution: DashboardZoneDistributionItem[]; acquisitionsList: LandAcquisition[]; auctionsList: DashboardAuctionBidItem[];
  allZones: string[]; allWards: { wardNo: string; zoneNo: string; }[];
  fetchedTypes?: AssetDashboardTypeByCategory[];
  fetchedAssets?: AssetDashboardAssetByType[];
  fetchedLocations?: AssetDashboardLocation[];
}

export interface MunicipalAsset {
  id: string; name: string; category: 'land' | 'building' | 'infrastructure' | 'movable';
  subCategory: string; location: string; zone: string; ward: string; latitude: number; longitude: number;
  status: string; health: number; lastInspection: string; valueLakhs: number; area?: number; constructionYear?: number;
  usage: string; department?: string; thumbnail?: string; images?: string[]; floors?: number; totalRooms?: number;
  builtUpArea?: number; landArea?: number; plinthArea?: number; marketValue?: number; governmentValuation?: number;
  propertyTax?: number; lastValuationDate?: string; quantity?: number; currentValue?: number; condition?: string;
  amcStatus?: string; nextMaintenanceDue?: string; legacyId?: string; propertyNumber?: string; buildingCode?: string;
  ownerID?: string; surveyNumber?: string; ctsNumber?: string; plotNumber?: string; partitionNumber?: string;
  encroachment?: unknown; rental?: unknown; assetManager?: unknown;
  [key: string]: unknown;
}

export interface LandAcquisition {
  id: string; proposalId: string; status: 'dispute' | 'pending' | 'complete';
  location: string; zone: string; ward?: string; area: number; amount: number;
  coordinates: { lat: number; lng: number };
}

export interface FlipStatsCardProps {
  title: string; value: string; change: string; icon: LucideIcon; gradient: string;
  backInfo: Array<{ label: string; value: string; category?: string }>; onCategoryClick?: (category: string) => void;
}

export interface DashboardStatsProps { stats: DashboardStats; icons: Record<string, LucideIcon>; onCategoryClick: (category: string | null) => void; }
export interface ZoneDistributionItem { name: string; value: number; }
export interface DashboardZoneProps { zoneDistribution: ZoneDistributionItem[]; filteredAssets: MunicipalAsset[]; selectedDistrict: string; }

export interface AuctionBid {
  auctionId: string; property: string; amount: string; bids: number; timestamp: number; time: string;
  location?: string; reservePrice?: string; area?: string; publishedBy?: string; approvedBy?: string; submittedBy?: string;
}

export interface DashboardAuctionDetail { type: string; bid: AuctionBid; index: number; }
export interface DashboardAcquisitionProps { acquisitionsList: LandAcquisition[]; auctionsList: AuctionBid[]; onAuctionClick: (detail: DashboardAuctionDetail) => void; }
export interface RawCategory {
  /** Actual API field names returned by /AssetDashboard/category-counts */
  categoryName?: string; categoryId?: string | number;
  /** Legacy / alternate field names kept for backwards compat */
  category?: string; id?: string | number;
  count?: number; value?: number; color?: string; description?: string;
}

export interface RawAsset {
  id?: string | number; name?: string; zone?: string; ward?: string; location?: string;
  marketValue?: number | string; valueLakhs?: number | string; value?: number | string;
  status?: string; latitude?: number | string; longitude?: number | string;
  health?: number | string; lastInspection?: string; usage?: string;
  encroachment?: { hasEncroachment: boolean };
}

export interface DashboardContentProps { initialSummary?: AssetSummaryData; initialCategories?: AssetCategoryCount[]; selectedDistrict?: string; }
export interface AssetMasterDashboardProps { initialSummary?: AssetSummaryData; initialCategories?: AssetCategoryCount[]; selectedDistrict?: string; }
export interface DashboardSubcategorySelection { type: string; name: string; }

export type DashboardMapAssetType = {
  id: string; name: string; category: string; subCategory?: string; zone: string; ward?: string; location: string;
  valueLakhs: number; status: string; coordinates?: { lat: number; lng: number }; encroachment?: unknown;
};

export type DashboardMapComponentProps = {
  categories: Array<{ id: string; name: string; count: number; value: number }>; assets: DashboardMapAssetType[];
  selectedAsset?: DashboardMapAssetType | null; selectedDistrict: string;
  onCategoryClick: (ids: string[]) => void; onAssetClick: (asset: DashboardMapAssetType | null) => void;
  activeFilters: string[];
  fetchedTypes?: AssetDashboardTypeByCategory[];
  fetchedAssets?: AssetDashboardAssetByType[];
  isMapLoading?: boolean;
};

export interface AssetSummaryData {
  totalAssets?: number; totalValue?: number; encroachedAssets?: number; maintenanceAssets?: number; totalAuctions?: number; totalAcquisitions?: number;
  totalAssetsCount?: number; totalAssetsValue?: number; encroachedCount?: number; maintenanceCount?: number; auctionCount?: number; acquisitionCount?: number;
  [key: string]: unknown;
}

export interface AssetCategoryCount { categoryId: number; categoryName: string; count: number; value: number; color?: string; description?: string; [key: string]: unknown; }
export interface AssetTypeSubcategory { assetTypeId: number; typeName: string; count: number; value: number; [key: string]: unknown; }

export interface AssetDetailsListItem {
  id: string | number; name: string; categoryName?: string; subCategoryName?: string; location: string;
  zone?: string; ward?: string; valueLakhs?: number; value?: number; status?: string; latitude?: number; longitude?: number;
  [key: string]: unknown;
}

export interface DashboardLayoutProps {
  children: React.ReactNode;
  loading?: boolean;
  filters?: React.ReactNode;
}

export interface DashboardFiltersProps {
  zonesList: string[];
  wardsList: string[];
  activeZone: string;
  activeWard: string;
  onZoneChange: (value: string) => void;
  onWardChange: (value: string) => void;
  allZonesLabel: string;
  allWardsLabel: string;
  filtersLabel: string;
}

export interface AssetMarkerProps {
  asset: any;
  coords: { lat: number; lng: number };
  icon: any;
  isSelected: boolean;
  handleMarkerClick: (asset: any) => void;
  categoryColor: { bg: string; border: string; shadow: string };
  hideUI?: boolean;
}

export interface CollapsibleSectionProps {
  id: string;
  sectionIdx: number;
  pill: string;
  Icon: React.ElementType;
  icon: string;
  titleColor: string;
  displayTitle: string;
  catLoading: boolean;
  items: { name: string; count: number; typeId: number; totalValue: number }[];
  handleSubcategoryClick: (id: string, name: string, typeId: number) => void;
  t: (key: string, args?: any) => string;
  activeFilters: string[];
}

