import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AssetSearchSection } from '@/components/modules/assets/revenue/payment/AssetSearchSection';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/en/assets/revenue/make-payment-v2/10',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ locale: 'en', recordId: '10' }),
}));

describe('AssetSearchSection', () => {
  it('renders search input and placeholder', () => {
    render(
      <AssetSearchSection
        searchValue="AST-100"
        setSearchValue={vi.fn()}
        setHasSearched={vi.fn()}
        showSuggestions={false}
        setShowSuggestions={vi.fn()}
        isSearching={false}
        searchResults={[]}
        router={{ push: vi.fn(), replace: vi.fn() }}
        startTransition={(cb) => cb()}
        assetCategoryId=""
        setAssetCategoryId={vi.fn()}
        assetTypeId=""
        setAssetTypeId={vi.fn()}
        parentAssetId=""
        setParentAssetId={vi.fn()}
        assetId=""
        setAssetId={vi.fn()}
        zoneId=""
        setZoneId={vi.fn()}
        wardId=""
        setWardId={vi.fn()}
      />
    );

    expect(screen.getByPlaceholderText('v2.searchPlaceholder')).toBeDefined();
  });
});
