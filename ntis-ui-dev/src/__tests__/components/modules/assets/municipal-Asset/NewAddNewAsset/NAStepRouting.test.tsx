import { describe, it, expect, vi, beforeEach } from 'vitest';
import AssetRootStepPage from '@/app/[locale]/assets/municipal-Asset/new-add-new-asset/[assetId]/page';
import NewAddNewAssetRootPage from '@/app/[locale]/assets/municipal-Asset/new-add-new-asset/page';

vi.mock('next-intl/server', () => ({
  setRequestLocale: vi.fn(),
}));

const mockRedirect = vi.fn();
vi.mock('next/navigation', () => ({
  redirect: (url: string) => mockRedirect(url),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/en/assets/municipal-Asset/new-add-new-asset/390621/basic-info',
  useSearchParams: () => new URLSearchParams('category=Building&assetType=Municipal%20School'),
  useParams: () => ({ locale: 'en', assetId: '390621' }),
}));

vi.mock('@/lib/utils/asset-utils/new-add-new-asset/basic-info/basic-info-page-data.utils', () => ({
  loadBasicInfoPageData: vi.fn().mockResolvedValue({
    initialWizardData: {},
    wards: [],
    zones: [],
    departments: [],
    moujas: [],
    designations: [],
    ownershipTypes: [],
    subzones: [],
    assetConditions: [],
  }),
}));

describe('New Add New Asset Step Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects [assetId] root step page to [assetId]/basic-info with query params preserved', async () => {
    await AssetRootStepPage({
      params: Promise.resolve({ locale: 'en', assetId: '390621' }),
      searchParams: Promise.resolve({ category: 'Building', typeId: '2' }),
    });

    expect(mockRedirect).toHaveBeenCalledWith(
      expect.stringContaining('/en/assets/municipal-Asset/new-add-new-asset/390621/basic-info?category=Building&typeId=2')
    );
  });

  it('redirects root new-add-new-asset page when assetId > 0 to [assetId]/basic-info', async () => {
    await NewAddNewAssetRootPage({
      params: Promise.resolve({ locale: 'en' }),
      searchParams: Promise.resolve({ assetId: '390621', category: 'Building' }),
    });

    expect(mockRedirect).toHaveBeenCalledWith(
      expect.stringContaining('/en/assets/municipal-Asset/new-add-new-asset/390621/basic-info?assetId=390621&category=Building')
    );
  });
});
