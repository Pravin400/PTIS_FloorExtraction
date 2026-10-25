import type React from 'react';

export interface AssetDashboardCategoryCount {
  categoryId: number;
  categoryName: string;
  count: number;
}

export interface MapDashboardStats {
  totalAssets: number;
  criticalAssets?: number;
  pendingDocuments?: number;
  assetValue?: number;
  categoryCounts?: AssetDashboardCategoryCount[];
  buildingCount?: number;
  landCount?: number;
  infrastructureCount?: number;
  movableCount?: number;
  totalValue?: number;
}

export interface MapDashboardFilterParams {
  zoneId?: string | number;
  wardId?: string | number;
  districtId?: string | number;
}

export type ULBType = 'Municipal Corporations' | 'Municipal Councils' | 'Nagar Panchayats';

export interface CityData {
  name: string;
  lat: number;
  lng: number;
  totalAssets: number;
  criticalAssets: number;
  pendingDocuments: number;
  assetValue: number;
  x: number;
  y: number;
  buildingCount?: number;
  landCount?: number;
  infrastructureCount?: number;
  movableCount?: number;
  /** true = this city has live API data and can navigate to its dashboard */
  isLive?: boolean;
}

export interface District {
  id: string;
  name: string;
  headquarters: string;
  population: string;
  area: string;
  literacy: string;
  description: string;
  keyFacts: string[];
  division: 'konkan' | 'nashik' | 'pune' | 'aurangabad' | 'amravati' | 'nagpur';
  marathiName?: string;
  hq?: string;
  pop?: string;
  ulbCount?: number;
  corpName?: string;
  status?: 'active' | 'inactive';
}

export interface DistrictULBs {
  'Municipal Corporations': string[];
  'Municipal Councils': string[];
  'Nagar Panchayats': string[];
}

export interface AkolaZone {
  id: string;
  name: string;
  color: string;
  population?: string;
  area?: string;
  wards?: string[];
  description?: string;
  keyFacts?: string[];
  wardCount?: number;
  totalAssets?: number;
  assetValue?: number;
}

export interface PuneWard {
  id: string;
  name: string;
  zone: string;
  wardNumber?: number;
  boundary?: string;
  assets?: number;
  area?: string;
  totalAssets?: number;
  criticalAssets?: number;
  pendingDocuments?: number;
  assetValue?: number;
  path?: string;
}

import type { LucideIcon } from 'lucide-react';

export interface DashboardCategoryStat {
  id?: number;
  category?: string;
  count?: number;
  totalValue?: number | null;
}

export interface DashboardSummary {
  totalAssets?: number;
  totalValue?: number;
  encroachments?: number;
  maintenanceDue?: number;
  activeAuctions?: number;
  assetAcquisition?: number;
  monetizedAssetsCount?: number;
  activeLeasedAssetsCount?: number;
  activeRentedAssetsCount?: number;
  assetCountCardDetails?: DashboardCategoryStat[];
}

export interface DashboardStatsData {
  summary?: DashboardSummary;
  totalAssets?: number;
  criticalAssets?: number;
  pendingDocuments?: number;
  totalValue?: number;
  buildingCount?: number;
  landCount?: number;
  infrastructureCount?: number;
  movableCount?: number;
  monetizationCount?: number;
  encroachmentCount?: number;
  categoryStats?: DashboardCategoryStat[];
}

export interface KPICardItemData {
  label: string;
  value: string | number;
  icon: LucideIcon;
  gradient: string;
  bgGradient: string;
  borderColor: string;
  textColor: string;
  valueGradient: string;
  glowColor: string;
  shadowColor: string;
}

export type KPICardData = KPICardItemData;

export interface KPICardsLabels {
  title: string;
  ulbLabel: string;
  assetLabel: string;
  buildingLabel: string;
  landLabel: string;
  infraLabel: string;
  locationLabel: string;
}

export interface KPICardsProps {
  labels: KPICardsLabels;
  filteredCitiesLength: number;
  totalStats: {
    totalAssets: number;
    assetValue: number;
    totalValue?: number;
    buildingCount?: number;
    landCount?: number;
    infrastructureCount?: number;
    movableCount?: number;
    monetizationCount?: number;
    encroachmentCount?: number;
  };
  selectedKPICard?: KPICardData;
  onKPICardClick?: (cardData: KPICardData) => void;
  onKPICardClose?: () => void;
  onKPIPanelOpen?: () => void;
  onKPIPanelClose?: () => void;
}

export interface EnhancedKPICardsProps {
  stats: KPICardData;
}

export interface MapDashboardPageProps {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export interface MapDashboardClientProps {
  initialData?: DashboardStatsData | null;
  initialDistrict?: string;
  initialTab?: string;
  initialCouncilFilter?: string;
  initialPanchayatFilter?: string;
  locale?: string;
}

export interface HighCommitteeDashboardProps {
  dashboardStats?: DashboardStatsData | null;
  initialDistrict?: string;
  initialTab?: string;
  initialCouncilFilter?: string;
  initialPanchayatFilter?: string;
  locale?: string;
}

export interface UrbanLocalBodiesTabsProps {
  cities: CityData[];
  selectedCity: CityData | null;
  initialTab?: string;
  initialCouncilFilter?: string;
  initialPanchayatFilter?: string;
  locale?: string;
  onCityClick?: (city: CityData) => void;
  onRedirect?: (city: CityData, e: React.MouseEvent) => void;
}

export interface MaharashtraMapProps {
  cities?: CityData[];
  selectedCity?: CityData | null;
  locale?: string;
}

export interface AkolaZonesMapProps {
  zones?: Record<string, AkolaZone>;
  selectedZone?: AkolaZone | null;
  onZoneClick?: (zone: AkolaZone | null) => void;
  onBack?: () => void;
}

export interface PuneZoneMapProps {
  hoveredWard?: string | null;
  onWardHover?: (wardId: string | null) => void;
  onWardClick?: (wardId: string) => void;
  selectedWard?: string | null;
  onBack?: () => void;
}
