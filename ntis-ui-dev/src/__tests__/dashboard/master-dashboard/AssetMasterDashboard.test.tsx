
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { vi, describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { AssetMasterDashboard } from '@/components/modules/assets/dashboard/master-dashboard/AssetMasterDashboard';
import { NextIntlClientProvider } from 'next-intl';

// Mock the hook and children components
vi.mock('@/hooks/assets/dashboard/master-dashboard/useAssetMasterDashboard', () => ({
  useAssetMasterDashboard: vi.fn(() => ({
    data: { stats: {} },
    loading: false,
    isMapLoading: false,
    activeZone: 'all',
    activeWard: 'all',
    zonesList: ['all', 'zone1'],
    wardsList: ['all', 'ward1'],
    visibleAssets: [],
    encroached: [],
    selectedAsset: null,
    setSelectedAsset: vi.fn(),
    catFilters: [],
    setCatFilters: vi.fn(),
    showEncroachment: false,
    setShowEncroachment: vi.fn(),
    handleZoneChange: vi.fn(),
    handleWardChange: vi.fn(),
    handleStatsCategoryClick: vi.fn(),
  })),
}));

vi.mock('@/components/modules/assets/dashboard/master-dashboard/DashboardMap', () => ({
  DashboardMap: () => <div data-testid="dashboard-map">Dashboard Map</div>,
}));

vi.mock('@/components/modules/assets/dashboard/master-dashboard/DashboardStats', () => ({
  DashboardStats: () => <div data-testid="dashboard-stats">Dashboard Stats</div>,
}));

vi.mock('@/components/modules/assets/dashboard/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="dashboard-layout">{children}</div>,
}));

describe('AssetMasterDashboard', () => {
  const messages = {
    assetmasterdashboard: {
      allZones: 'All Zones',
      allWards: 'All Wards',
      filters: 'Filters',
    },
  };

  it('renders DashboardLayout, Stats, and Map', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AssetMasterDashboard initialData={{} as unknown as DashboardDataPayload} selectedDistrict="Test District" />
      </NextIntlClientProvider>
    );

    expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-stats')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-map')).toBeInTheDocument();
  });
});
