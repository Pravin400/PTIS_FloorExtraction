/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import { SubAssetDetailPage } from '@/components/modules/assets/municipal-Asset/sub-asset-detail-view/SubAssetDetailPage';
import { vi } from 'vitest';

// Mock translations
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock sub-components to isolate the page render logic
vi.mock('@/components/modules/assets/municipal-Asset/sub-asset-detail-view/SubAssetHeaderSection', () => ({
  SubAssetHeaderSection: () => <div data-testid="sub-asset-header-section" />
}));
vi.mock('@/components/modules/assets/municipal-Asset/sub-asset-detail-view/RevenueCollectionSection', () => ({
  RevenueCollectionSection: () => <div data-testid="revenue-collection-section" />
}));
vi.mock('@/components/modules/assets/municipal-Asset/sub-asset-detail-view/SubAssetBasicDetailsSection', () => ({
  SubAssetBasicDetailsSection: () => <div data-testid="sub-asset-basic-details-section" />
}));
vi.mock('@/components/modules/assets/municipal-Asset/sub-asset-detail-view/LeaseAndFinancialSections', () => ({
  LeaseRentDetailsSection: () => <div data-testid="lease-rent-details-section" />,
  FinancialDetailsSection: () => <div data-testid="financial-details-section" />
}));
vi.mock('@/components/modules/assets/municipal-Asset/sub-asset-detail-view/YearWiseRentChartSection', () => ({
  YearWiseRentChartSection: () => <div data-testid="year-wise-rent-chart-section" />
}));
vi.mock('@/components/modules/assets/municipal-Asset/sub-asset-detail-view/FloorWiseValuationSection', () => ({
  FloorWiseValuationSection: () => <div data-testid="floor-wise-valuation-section" />
}));
vi.mock('@/components/modules/assets/municipal-Asset/sub-asset-detail-view/SubAssetDocumentsSection', () => ({
  SubAssetDocumentsSection: () => <div data-testid="sub-asset-documents-section" />
}));
vi.mock('@/components/modules/assets/municipal-Asset/sub-asset-detail-view/SubAssetStatusSections', () => ({
  SubAssetMaintenanceSection: () => <div data-testid="sub-asset-maintenance-section" />,
  SubAssetEncroachmentSection: () => <div data-testid="sub-asset-encroachment-section" />
}));
vi.mock('@/components/modules/assets/municipal-Asset/sub-asset-detail-view/QuickActionsSection', () => ({
  QuickActionsSection: () => <div data-testid="quick-actions-section" />
}));
vi.mock('@/components/modules/assets/municipal-Asset/sub-asset-detail-view/SubAssetRightColumnSections', () => ({
  SubAssetPhotosSection: () => <div data-testid="sub-asset-photos-section" />,
  UnitFloorPlanSection: () => <div data-testid="unit-floor-plan-section" />,
  SubAssetGisSection: () => <div data-testid="sub-asset-gis-section" />
}));

describe('SubAssetDetailPage', () => {
  it('renders "Data Unavailable" message when apiData is null', () => {
    render(<SubAssetDetailPage apiData={undefined} subAssetIdNum={123} />);
    expect(screen.getByText('dataUnavailable')).toBeInTheDocument();
    expect(screen.getByText('dataLoadError')).toBeInTheDocument();
  });

  it('renders all sections when apiData is provided', () => {
    const mockData = {} as any;
    render(<SubAssetDetailPage apiData={mockData} subAssetIdNum={123} />);
    
    // Header
    expect(screen.getByTestId('sub-asset-header-section')).toBeInTheDocument();
    
    // Main 3/4 layout (Revenue, Basic, Lease, Financial, Chart, Floor, Docs, Maintenance, Encroachment, QuickActions)
    expect(screen.getByTestId('revenue-collection-section')).toBeInTheDocument();
    expect(screen.getByTestId('sub-asset-basic-details-section')).toBeInTheDocument();
    expect(screen.getByTestId('lease-rent-details-section')).toBeInTheDocument();
    expect(screen.getByTestId('financial-details-section')).toBeInTheDocument();
    expect(screen.getByTestId('year-wise-rent-chart-section')).toBeInTheDocument();
    expect(screen.getByTestId('floor-wise-valuation-section')).toBeInTheDocument();
    expect(screen.getByTestId('sub-asset-documents-section')).toBeInTheDocument();
    expect(screen.getByTestId('sub-asset-maintenance-section')).toBeInTheDocument();
    expect(screen.getByTestId('sub-asset-encroachment-section')).toBeInTheDocument();
    expect(screen.getByTestId('quick-actions-section')).toBeInTheDocument();

    // Right 1/4 layout (Photos, FloorPlan, Gis)
    expect(screen.getByTestId('sub-asset-photos-section')).toBeInTheDocument();
    expect(screen.getByTestId('unit-floor-plan-section')).toBeInTheDocument();
    expect(screen.getByTestId('sub-asset-gis-section')).toBeInTheDocument();
  });
});
