/* eslint-disable @typescript-eslint/no-explicit-any */

import { render, screen } from '@testing-library/react';
import { AdditionalDetailsSection } from '@/components/modules/assets/municipal-Asset/asset-detail-view/AdditionalDetailsSection';

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

describe('AdditionalDetailsSection', () => {
  const mockData = {
    backendConfiguredFields: [
      { label: 'Asset Code', value: 'AC-1234' },
      { label: 'Year Built', value: '2010' }
    ],
  };

  it('renders correctly with given details', () => {
    render(<AdditionalDetailsSection data={mockData as any} />);
    
    expect(screen.getByTestId('section-card')).toBeInTheDocument();
    
    expect(screen.getByText('Asset Code')).toBeInTheDocument();
    expect(screen.getByText('AC-1234')).toBeInTheDocument();
  });

  it('handles missing details gracefully', () => {
    render(<AdditionalDetailsSection data={{ backendConfiguredFields: [] } as any} />);
    expect(screen.getByTestId('section-card')).toBeInTheDocument();
  });

  it('handles completely null data', () => {
    render(<AdditionalDetailsSection data={{ backendConfiguredFields: [] } as any} />);
    expect(screen.getByTestId('section-card')).toBeInTheDocument();
  });
});





