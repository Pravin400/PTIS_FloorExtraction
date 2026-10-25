import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { usePaymentSection, type PaymentRecordsPageData } from '@/hooks/asset/revenue/payment/usePaymentSection';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useParams: () => ({ locale: 'en' }),
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

const mockPageData: PaymentRecordsPageData = {
  query: {
    pageSize: 10,
    pageNumber: 1,
    zone: '1',
    ward: 'all',
    search: '',
    sortBy: 'assetNo',
    sortOrder: 'asc',
  },
  records: [],
  totalEntries: 0,
  totalPages: 0,
  startIndex: 1,
};

describe('usePaymentSection', () => {
  it('initializes with provided page data', () => {
    const { result } = renderHook(() => usePaymentSection(mockPageData));

    expect(result.current.query.pageSize).toBe(10);
    expect(result.current.query.pageNumber).toBe(1);
    expect(result.current.smartSearch).toBe('');
  });

  it('updates route when handleSort is called', () => {
    const { result } = renderHook(() => usePaymentSection(mockPageData));

    act(() => {
      result.current.handleSort('assetNo');
    });

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('SortBy=assetNo&SortOrder=desc')
    );
  });
});
