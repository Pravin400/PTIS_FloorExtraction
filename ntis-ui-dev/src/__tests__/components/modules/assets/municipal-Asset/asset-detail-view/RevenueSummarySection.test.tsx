/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import { RevenueSummarySection } from '@/components/modules/assets/municipal-Asset/asset-detail-view/RevenueSummarySection';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn().mockResolvedValue((key: string) => key),
}));

vi.mock('@/components/modules/assets/municipal-Asset/asset-detail-view/SectionCard', () => ({
  SectionCard: ({ title, children }: any) => (
    <div data-testid="section-card">
      <div data-testid="section-card-title">{title}</div>
      <div data-testid="section-card-content">{children}</div>
    </div>
  ),
}));

describe('RevenueSummarySection', () => {
  it('renders correctly', async () => {
    const mockData = {
      totalDemand: 1000,
      totalCollection: 500,
      totalOutstanding: 500,
      revenueBars: [
        { month: 'Jan', value: 100, maxValue: 100 }
      ]
    };
    const ui = await RevenueSummarySection({ data: mockData as any, locale: "en" });
    render(ui);
    expect(screen.getByTestId('section-card')).toBeInTheDocument();
  });
});
