/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import { MaintenanceSection } from '@/components/modules/assets/municipal-Asset/asset-detail-view/MaintenanceSection';

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

describe('MaintenanceSection', () => {
  it('renders correctly', async () => {
    const ui = await MaintenanceSection({ data: {} as any, locale: "en" });
    render(ui);
    expect(screen.getByTestId('section-card')).toBeInTheDocument();
  });
});





vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn().mockResolvedValue((key: string) => key),
}));

