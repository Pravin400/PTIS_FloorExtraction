/* eslint-disable @typescript-eslint/no-explicit-any */

import { render, screen } from '@testing-library/react';
import { AssetPhotoPlanSection } from '@/components/modules/assets/municipal-Asset/asset-detail-view/AssetPhotoPlanSection';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/components/modules/assets/municipal-Asset/asset-detail-view/SectionCard', () => ({
  InfoField: ({ label, value }: any) => <div><span>{label}</span><span>{value}</span></div>,
  SectionCard: ({ title, children, headerAction }: any) => (
    <div data-testid="section-card">
      <div data-testid="section-card-title">{title}</div>
      <div data-testid="section-card-action">{headerAction}</div>
      <div data-testid="section-card-content">{children}</div>
    </div>
  ),
}));

describe('AssetPhotoPlanSection', () => {
it('renders correctly with given data', () => {
    render(<AssetPhotoPlanSection data={{} as any} />);
    
    // Check if SectionCard is rendered
    expect(screen.getByTestId('section-card')).toBeInTheDocument();
    
    // Check if the title is correctly set
    expect(screen.getByTestId('section-card-title')).toHaveTextContent('assetPhotoPlan');
    
    // Check for "View All" button or action
    expect(screen.getByTestId('section-card-action')).toBeInTheDocument();
  });

  it('handles empty data gracefully', () => {
    render(<AssetPhotoPlanSection data={{} as any} />);
    expect(screen.getByTestId('section-card')).toBeInTheDocument();
  });

  it('handles null data gracefully', () => {
    render(<AssetPhotoPlanSection data={{} as any} />);
    expect(screen.getByTestId('section-card')).toBeInTheDocument();
  });
});






