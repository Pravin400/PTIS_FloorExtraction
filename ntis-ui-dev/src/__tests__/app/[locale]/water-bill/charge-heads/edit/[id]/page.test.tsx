// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChargeHead, ChargeHeadsPagedResponse } from '@/types/water-bill/chargeHeads.types';

const { notFoundMock, getPagedMock, getByIdMock } = vi.hoisted(() => ({
  notFoundMock: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
  getPagedMock: vi.fn(),
  getByIdMock: vi.fn(),
}));

vi.mock('next-intl/server', () => ({
  setRequestLocale: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  notFound: notFoundMock,
}));

vi.mock('@/app/[locale]/water-bill/charge-heads/actions', () => ({
  getChargeHeadsPagedAction: getPagedMock,
  getChargeHeadByIdAction: getByIdMock,
  createChargeHeadAction: vi.fn(),
  updateChargeHeadAction: vi.fn(),
  deleteChargeHeadAction: vi.fn(),
}));

vi.mock('@/components/modules/water-bill/charge-heads', () => ({
  ChargeHeads: (props: unknown) => ({
    type: 'div',
    props,
  }),
}));

import EditChargeHeadPage, {
  dynamic,
} from '@/app/[locale]/water-bill/charge-heads/edit/[id]/page';

describe('EditChargeHeadPage Component and Routing Tests', () => {
  const sampleChargeHead: ChargeHead = {
    id: 9019,
    chargeHeadCode: 'CH-TEST-002',
    chargeHeadName: 'Deposit Amount',
    chargeHeadNameLocal: 'चाचणी शुल्क',
    chargeType: 'Charge',
    isRefundable: false,
    sequenceNo: 1,
    description: 'Test description',
    isRegularPay: false,
    isActive: true,
  };

  const samplePagedData: ChargeHeadsPagedResponse = {
    items: [sampleChargeHead],
    totalCount: 1,
    pageNumber: 1,
    pageSize: 10,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('declares dynamic = "force-dynamic" to ensure fresh server-side request evaluation', () => {
    expect(dynamic).toBe('force-dynamic');
  });

  it('renders edit drawer with populated data when getChargeHeadByIdAction returns the record', async () => {
    getPagedMock.mockResolvedValue(samplePagedData);
    getByIdMock.mockResolvedValue(sampleChargeHead);

    const result = await EditChargeHeadPage({
      params: Promise.resolve({ id: '9019', locale: 'en' }),
      searchParams: Promise.resolve({ pageNumber: '1', pageSize: '10' }),
    });

    expect(notFoundMock).not.toHaveBeenCalled();
    expect(getByIdMock).toHaveBeenCalledWith(9019);
    expect(getPagedMock).toHaveBeenCalledWith(1, 10, undefined, undefined, undefined);

    const props = result.props as {
      drawer: string;
      initialEditingData: ChargeHead;
      locale: string;
      pagedData: ChargeHeadsPagedResponse;
    };

    expect(props.drawer).toBe('edit');
    expect(props.locale).toBe('en');
    expect(props.initialEditingData).toEqual(sampleChargeHead);
    expect(props.pagedData).toEqual(samplePagedData);
  });

  it('falls back to pagedData.items when getChargeHeadByIdAction returns null', async () => {
    getPagedMock.mockResolvedValue(samplePagedData);
    getByIdMock.mockResolvedValue(null);

    const result = await EditChargeHeadPage({
      params: Promise.resolve({ id: '9019', locale: 'en' }),
      searchParams: Promise.resolve({}),
    });

    expect(notFoundMock).not.toHaveBeenCalled();
    const props = result.props as {
      drawer: string;
      initialEditingData: ChargeHead;
    };
    expect(props.drawer).toBe('edit');
    expect(props.initialEditingData).toEqual(sampleChargeHead);
  });

  it('calls notFound() when ID is not a positive integer (NaN or <= 0)', async () => {
    await expect(
      EditChargeHeadPage({
        params: Promise.resolve({ id: 'invalid-id', locale: 'en' }),
        searchParams: Promise.resolve({}),
      })
    ).rejects.toThrow('NEXT_NOT_FOUND');

    expect(notFoundMock).toHaveBeenCalledTimes(1);

    vi.clearAllMocks();
    await expect(
      EditChargeHeadPage({
        params: Promise.resolve({ id: '0', locale: 'en' }),
        searchParams: Promise.resolve({}),
      })
    ).rejects.toThrow('NEXT_NOT_FOUND');

    expect(notFoundMock).toHaveBeenCalledTimes(1);

    vi.clearAllMocks();
    await expect(
      EditChargeHeadPage({
        params: Promise.resolve({ id: '-10', locale: 'en' }),
        searchParams: Promise.resolve({}),
      })
    ).rejects.toThrow('NEXT_NOT_FOUND');

    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });

  it('calls notFound() when charge head does not exist in backend or paged data', async () => {
    getPagedMock.mockResolvedValue({
      ...samplePagedData,
      items: [],
      totalCount: 0,
    });
    getByIdMock.mockResolvedValue(null);

    await expect(
      EditChargeHeadPage({
        params: Promise.resolve({ id: '99999', locale: 'en' }),
        searchParams: Promise.resolve({}),
      })
    ).rejects.toThrow('NEXT_NOT_FOUND');

    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });
});
