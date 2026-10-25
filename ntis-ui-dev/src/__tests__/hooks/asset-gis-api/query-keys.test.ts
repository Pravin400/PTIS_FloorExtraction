import { describe, it, expect } from 'vitest';
import { gisQueryKeys } from '@/hooks/asset-gis-api/query-keys';

describe('gisQueryKeys Cache Keys', () => {
  it('generates consistent and valid query keys for all GIS features', () => {
    expect(gisQueryKeys.all).toEqual(['gis']);
    expect(gisQueryKeys.dashboardInit({ zoneId: '1' })).toBeDefined();
    expect(gisQueryKeys.kpiSummary({ zoneId: '1' })).toBeDefined();
    expect(gisQueryKeys.wardSummary({ zoneId: '1' })).toBeDefined();
    expect(gisQueryKeys.unifiedData({ zoneId: '1' })).toBeDefined();
    expect(gisQueryKeys.propertyGroups()).toBeDefined();
    expect(gisQueryKeys.propertyTypes('comm', { zoneId: '1' })).toBeDefined();
    expect(gisQueryKeys.propertyDictionary()).toBeDefined();
    expect(gisQueryKeys.config()).toBeDefined();
    expect(gisQueryKeys.header()).toBeDefined();
    expect(gisQueryKeys.basemaps()).toBeDefined();
    expect(gisQueryKeys.boundaryLayers()).toBeDefined();
    expect(gisQueryKeys.boundaries('zone')).toBeDefined();
    expect(gisQueryKeys.propertyDetail('101')).toBeDefined();
    expect(gisQueryKeys.propertiesGeoJson({ zoneId: '1' })).toBeDefined();
    expect(gisQueryKeys.enrichedGeoJson({ zoneId: '1' })).toBeDefined();
    expect(gisQueryKeys.statusMapping({ zoneId: '1' })).toBeDefined();
  });
});
