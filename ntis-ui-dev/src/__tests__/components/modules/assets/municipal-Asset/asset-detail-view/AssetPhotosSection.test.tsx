/* eslint-disable @typescript-eslint/no-explicit-any */

import { render, screen } from '@testing-library/react';
import { AssetPhotosSection } from '@/components/modules/assets/municipal-Asset/asset-detail-view/AssetPhotosSection';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/components/modules/assets/municipal-Asset/asset-detail-view/SectionCard', () => ({
  InfoField: ({ label, value }: any) => <div><span>{label}</span><span>{value}</span></div>,
  SectionCard: ({ title, children }: any) => (
    <div data-testid="section-card">
      <div data-testid="section-card-title">{title}</div>
      <div data-testid="section-card-content">{children}</div>
    </div>
  ),
}));

describe('AssetPhotosSection', () => {
it('renders correctly with given photos', () => {
    render(<AssetPhotosSection data={{ photos: [] } as any} />);
    
    expect(screen.getByTestId('section-card')).toBeInTheDocument();
    expect(screen.getByTestId('section-card-title')).toHaveTextContent('assetPhotos');
  });

  it('handles empty photos list', () => {
    render(<AssetPhotosSection data={{ photos: [] } as any} />);
    expect(screen.getByTestId('section-card')).toBeInTheDocument();
  });
});






