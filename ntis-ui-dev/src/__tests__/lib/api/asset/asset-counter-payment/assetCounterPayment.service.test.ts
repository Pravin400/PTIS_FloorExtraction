import { describe, expect, it, vi, beforeEach } from 'vitest';
import { assetCounterPaymentService } from '@/lib/api/asset/asset-counter-payment/assetCounterPayment.service';
import { apiClient } from '@/services/api.service';

vi.mock('@/services/api.service', () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({ success: true, data: { items: [] } }),
    post: vi.fn().mockResolvedValue({ success: true, data: { status: 'Success' } }),
  },
}));

describe('assetCounterPaymentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls search with parameters', async () => {
    const res = await assetCounterPaymentService.search({ searchText: 'AST-100' });
    expect(apiClient.get).toHaveBeenCalledWith('/AssetCounterPayment/search?SearchText=AST-100', { cache: 'no-store' });
    expect(res).toBeDefined();
  });

  it('calls getLeaseRentDetailsById', async () => {
    const res = await assetCounterPaymentService.getLeaseRentDetailsById(10);
    expect(apiClient.get).toHaveBeenCalledWith('/AssetLeaseRentDetails/10', { cache: 'no-store' });
    expect(res).toBeDefined();
  });

  it('calls getDemandDetailsByAssetId', async () => {
    const res = await assetCounterPaymentService.getDemandDetailsByAssetId('101');
    expect(apiClient.get).toHaveBeenCalledWith('/AssetCounterPayment/by-asset/101/demand-details', { cache: 'no-store' });
    expect(res).toBeDefined();
  });

  it('calls processPayment with recordId and payload', async () => {
    const payload = {
      paymentType: 'Partial',
      paidAmount: 5000,
    };
    const res = await assetCounterPaymentService.processPayment('1051', payload);
    expect(apiClient.post).toHaveBeenCalledWith('/AssetCounterPayment/1051', payload);
    expect(res).toBeDefined();
  });
});
