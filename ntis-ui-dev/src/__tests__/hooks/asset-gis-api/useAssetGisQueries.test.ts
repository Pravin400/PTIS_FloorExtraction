import { describe, it, expect } from 'vitest';
import { gisQueryKeys } from '@/hooks/asset-gis-api/query-keys';

describe('Asset GIS React Query Keys Suite', () => {
  it('generates consistent and isolated root query keys', () => {
    expect(gisQueryKeys.all).toEqual(['gis']);
    expect(gisQueryKeys.config()).toEqual(['gis', 'config']);
    expect(gisQueryKeys.header()).toEqual(['gis', 'header']);
    expect(gisQueryKeys.basemaps()).toEqual(['gis', 'basemaps']);
  });

  it('generates dashboard init query key with parameters', () => {
    const key = gisQueryKeys.dashboardInit({ zoneId: '1', wardNo: '5' });
    expect(key).toEqual(['gis', 'dashboard', 'init', { zoneId: '1', wardNo: '5' }]);
  });

  it('generates boundary layer key with type', () => {
    const key = gisQueryKeys.boundaries('zone');
    expect(key).toEqual(['gis', 'boundaries', 'zone']);
  });

  it('generates property detail query key with ownerId', () => {
    const key = gisQueryKeys.propertyDetail('MPMS11-1');
    expect(key).toEqual(['gis', 'property', 'detail', 'MPMS11-1']);
  });
});
