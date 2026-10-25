import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '@/services/api.service';
import { resolvePropertyIdAction, resolvePropertiesAction } from '@/app/[locale]/property-tax/reports/actions';

vi.mock('@/services/api.service', () => ({ apiClient: { get: vi.fn() } }));
vi.mock('@/lib/api/property-tax/reports/report.service', () => ({}));
vi.mock('@/lib/api/financial-year.service', () => ({}));
vi.mock('@/lib/api/property-type-crud.service', () => ({}));
vi.mock('@/lib/api/property-tax/reports/report-jobs.service', () => ({}));

const get = vi.mocked(apiClient.get);

describe('report property lookup through server actions', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns empty results without HTTP requests for blank input', async () => {
    expect(await resolvePropertyIdAction('  ')).toBeNull();
    expect(await resolvePropertiesAction('  ')).toEqual([]);
    expect(get).not.toHaveBeenCalled();
  });

  it.each(['items', 'Items', 'data', 'Data'])('preserves the %s response envelope and legacy field names', async (key) => {
    get.mockResolvedValue({ success: true, data: { [key]: [
      { PropertyId: '42', PropertyNo: ' 100 ', PartitionNo: ' A ', PropertyHolderName: ' Owner ' },
    ] } });
    expect(await resolvePropertyIdAction(' 100 ', 7)).toBe(42);
    expect(await resolvePropertiesAction(' 100 ', 7)).toEqual([
      { propertyId: 42, propertyNo: '100', partitionNo: 'A', ownerName: 'Owner' },
    ]);
  });

  it('prefers an exact property number over the first search result', async () => {
    get.mockResolvedValue({ success: true, data: { items: [
      { id: 11, propertyNo: '999' }, { id: 42, propertyNo: '100' },
    ] } });
    expect(await resolvePropertyIdAction('100', 7)).toBe(42);
    expect(get).toHaveBeenCalledExactlyOnceWith(
      '/Property/search?PropertyNoFrom=100&PropertyNoTo=100&PropertyNo=100&WardId=7&PageSize=5',
    );
  });

  it('preserves the single-property fallback to the first result when no exact match exists', async () => {
    get.mockResolvedValue({ success: true, data: { items: [{ Id: 11, PropertyNo: '999' }] } });
    expect(await resolvePropertyIdAction('100')).toBe(11);
  });

  it('probes search, property list, and ward list in the original order', async () => {
    get.mockRejectedValueOnce(new Error('Unavailable'))
      .mockResolvedValueOnce({ success: false })
      .mockResolvedValueOnce({ success: true, data: { Items: [{ propertyId: 42, propertyNo: '100' }] } });
    expect(await resolvePropertyIdAction('100', 7)).toBe(42);
    expect(get.mock.calls.map(([url]) => url)).toEqual([
      '/Property/search?PropertyNoFrom=100&PropertyNoTo=100&PropertyNo=100&WardId=7&PageSize=5',
      '/Property?PropertyNo=100&WardId=7&PageSize=-1&PageNumber=1',
      '/Property?WardId=7&PageSize=-1&PageNumber=1',
    ]);
  });

  it.each([undefined, 0, -1])('omits invalid or absent ward %s and uses the existing unscoped page size', async (wardId) => {
    get.mockResolvedValue({ success: true, data: { items: [] } });
    expect(await resolvePropertyIdAction('100', wardId)).toBeNull();
    expect(get.mock.calls.map(([url]) => url)).toEqual([
      '/Property/search?PropertyNoFrom=100&PropertyNoTo=100&PropertyNo=100&PageSize=5',
      '/Property?PropertyNo=100&PageSize=5&PageNumber=1',
    ]);
  });

  it('returns all exact partitions, excludes invalid IDs, and preserves owner and partition defaults', async () => {
    get.mockResolvedValue({ success: true, data: { items: [
      { propertyId: 1, propertyNo: '100', partitionNo: 'A', propertyHolderName: 'Owner A' },
      { propertyId: 2, propertyNo: '100', ownerName: 'Owner B' },
      { propertyId: 3, propertyNo: '100' },
      { propertyId: 0, propertyNo: '100' },
      { propertyId: 4, propertyNo: '999' },
    ] } });
    expect(await resolvePropertiesAction('100', 7)).toEqual([
      { propertyId: 1, propertyNo: '100', partitionNo: 'A', ownerName: 'Owner A' },
      { propertyId: 2, propertyNo: '100', partitionNo: null, ownerName: 'Owner B' },
      { propertyId: 3, propertyNo: '100', partitionNo: null, ownerName: 'N/A' },
    ]);
    expect(get).toHaveBeenCalledExactlyOnceWith(
      '/Property/search?PropertyNoFrom=100&PropertyNoTo=100&PropertyNo=100&WardId=7&PageSize=20',
    );
  });

  it('falls back to the unbounded property list for partitions without adding the ward-only probe', async () => {
    get.mockResolvedValueOnce({ success: true, data: { items: [{ id: 9, propertyNo: '999' }] } })
      .mockResolvedValueOnce({ success: true, data: { items: [{ id: 42, propertyNo: '100' }] } });
    expect(await resolvePropertiesAction('100', 7)).toEqual([
      { propertyId: 42, propertyNo: '100', partitionNo: null, ownerName: 'N/A' },
    ]);
    expect(get.mock.calls.map(([url]) => url)).toEqual([
      '/Property/search?PropertyNoFrom=100&PropertyNoTo=100&PropertyNo=100&WardId=7&PageSize=20',
      '/Property?PropertyNo=100&WardId=7&PageSize=-1&PageNumber=1',
    ]);
  });

  it('preserves empty results when every endpoint fails', async () => {
    get.mockRejectedValue(new Error('Unavailable'));
    expect(await resolvePropertyIdAction('100', 7)).toBeNull();
    expect(await resolvePropertiesAction('100', 7)).toEqual([]);
    expect(get).toHaveBeenCalledTimes(5);
  });

  it('encodes the original property number in URL query parameters', async () => {
    get.mockResolvedValue({ success: true, data: { items: [] } });
    await resolvePropertyIdAction(' A&B/1 ');
    const url = new URL(get.mock.calls[0][0], 'https://example.test');
    expect(url.searchParams.get('PropertyNo')).toBe('A&B/1');
    expect(url.searchParams.get('PropertyNoFrom')).toBe('A&B/1');
    expect(url.searchParams.get('PropertyNoTo')).toBe('A&B/1');
  });
});
