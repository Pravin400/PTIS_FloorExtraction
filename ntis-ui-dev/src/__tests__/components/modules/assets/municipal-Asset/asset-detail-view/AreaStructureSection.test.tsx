/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import { AreaStructureSection } from '@/components/modules/assets/municipal-Asset/asset-detail-view/AreaStructureSection';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn().mockResolvedValue((key: string) => key),
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

describe('AreaStructureSection', () => {
  const mockData = {
    plotNo: '123',
    plotArea: '1500',
    builtUpArea: '1200'
  };

  it('renders correctly with given structures', async () => {
    const ui = await AreaStructureSection({ data: mockData as any, locale: "en" });
    render(ui);
    
    expect(screen.getByTestId('section-card')).toBeInTheDocument();
  });

  it('handles empty structures list', async () => {
    const ui = await AreaStructureSection({ data: {} as any, locale: "en" });
    render(ui);
    expect(screen.getByTestId('section-card')).toBeInTheDocument();
  });
});
