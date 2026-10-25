import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePropertySearch } from '@/hooks/ptis/tab/usePropertySearch';

const mockReplace = vi.fn();
let mockPathname = '/en/property-tax/ptis';
let mockSearchParamsString = '';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
  usePathname: () => mockPathname,
  useSearchParams: () => new URLSearchParams(mockSearchParamsString),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('usePropertySearch category routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = '/en/property-tax/ptis';
    mockSearchParamsString = '';
  });

  it('routes to /property-tax/ptis/apartment when category is 0 (apartment society property)', async () => {
    const { result } = renderHook(() => usePropertySearch());

    await act(async () => {
      await result.current.handleSearchProperty({
        wardNo: 'MM11',
        propertyNo: '10',
        partitionNo: '',
        wardId: 89,
        propertyId: '1487134',
        category: 0,
        categoryLabel: 'apartment society property',
      });
    });

    expect(mockReplace).toHaveBeenCalled();
    const navigatedUrl = mockReplace.mock.calls[0][0];
    expect(navigatedUrl).toContain('/en/property-tax/ptis/apartment');
    expect(navigatedUrl).toContain('propertyNo=10');
    expect(navigatedUrl).toContain('wardId=89');
    expect(navigatedUrl).toContain('propertyId=1487134');
  });

  it('routes to /property-tax/ptis/individual when category is 2 (individual property)', async () => {
    mockPathname = '/en/property-tax/ptis/apartment';
    const { result } = renderHook(() => usePropertySearch());

    await act(async () => {
      await result.current.handleSearchProperty({
        wardNo: 'MM11',
        propertyNo: '101',
        partitionNo: '',
        wardId: 89,
        propertyId: '1487608',
        category: 2,
        categoryLabel: 'individual property',
      });
    });

    expect(mockReplace).toHaveBeenCalled();
    const navigatedUrl = mockReplace.mock.calls[0][0];
    expect(navigatedUrl).toContain('/en/property-tax/ptis/individual');
    expect(navigatedUrl).not.toContain('ptis/apartment');
    expect(navigatedUrl).toContain('propertyNo=101');
    expect(navigatedUrl).toContain('propertyId=1487608');
  });

  it('routes to /property-tax/ptis/individual when category is 1 (apartment society unit property)', async () => {
    mockPathname = '/en/property-tax/ptis/apartment';
    const { result } = renderHook(() => usePropertySearch());

    await act(async () => {
      await result.current.handleSearchProperty({
        wardNo: 'MM11',
        propertyNo: '410',
        partitionNo: 'A2',
        wardId: 89,
        propertyId: '1872676',
        category: 1,
        categoryLabel: 'apartment society unit property',
      });
    });

    expect(mockReplace).toHaveBeenCalled();
    const navigatedUrl = mockReplace.mock.calls[0][0];
    expect(navigatedUrl).toContain('/en/property-tax/ptis/individual');
    expect(navigatedUrl).not.toContain('ptis/apartment');
    expect(navigatedUrl).toContain('propertyNo=410');
    expect(navigatedUrl).toContain('partitionNo=A2');
  });

  it('routes to /property-tax/ptis/apartment when category is 1 (Apartment) and partition is empty (main society property)', async () => {
    const { result } = renderHook(() => usePropertySearch());

    await act(async () => {
      await result.current.handleSearchProperty({
        wardNo: 'LS14',
        propertyNo: '116',
        partitionNo: '',
        wardId: 6887,
        propertyId: '2078892',
        category: 1,
        categoryLabel: 'Apartment',
      });
    });

    expect(mockReplace).toHaveBeenCalled();
    const navigatedUrl = mockReplace.mock.calls[0][0];
    expect(navigatedUrl).toContain('/en/property-tax/ptis/apartment');
    expect(navigatedUrl).toContain('propertyNo=116');
    expect(navigatedUrl).toContain('wardId=6887');
  });

  it('stays on /property-tax/ptis/individual when searching on the individual screen', async () => {
    mockPathname = '/en/property-tax/ptis/individual';
    const { result } = renderHook(() => usePropertySearch());

    await act(async () => {
      await result.current.handleSearchProperty({
        wardNo: 'MM1',
        propertyNo: '85',
        partitionNo: '',
        wardId: 6896,
        propertyId: '1488616',
        category: 2,
        categoryLabel: 'Individual',
      });
    });

    expect(mockReplace).toHaveBeenCalled();
    const navigatedUrl = mockReplace.mock.calls[0][0];
    expect(navigatedUrl).toContain('/en/property-tax/ptis/individual');
    expect(navigatedUrl).toContain('wardNo=MM1');
    expect(navigatedUrl).toContain('propertyNo=85');
    expect(navigatedUrl).toContain('propertyId=1488616');
  });

  it('routes to /property-tax/ptis/apartment when searching apartment society on individual screen', async () => {
    mockPathname = '/en/property-tax/ptis/individual';
    const { result } = renderHook(() => usePropertySearch());

    await act(async () => {
      await result.current.handleSearchProperty({
        wardNo: 'LS14',
        propertyNo: '116',
        partitionNo: '',
        wardId: 6887,
        propertyId: '2078892',
        category: 0,
        categoryLabel: 'apartment society property',
      });
    });

    expect(mockReplace).toHaveBeenCalled();
    const navigatedUrl = mockReplace.mock.calls[0][0];
    expect(navigatedUrl).toContain('/en/property-tax/ptis/apartment');
    expect(navigatedUrl).toContain('propertyNo=116');
    expect(navigatedUrl).toContain('wardId=6887');
  });
});

