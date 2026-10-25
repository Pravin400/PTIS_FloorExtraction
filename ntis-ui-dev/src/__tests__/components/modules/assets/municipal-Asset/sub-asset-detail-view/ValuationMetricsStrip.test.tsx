/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import { ValuationMetricsStrip } from '@/components/modules/assets/municipal-Asset/sub-asset-detail-view/ValuationMetricsStrip';
import { vi, beforeEach, describe, it, expect } from 'vitest';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('ValuationMetricsStrip', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    const mockData = {
      totalCarpetAreaSqm: 100,
      totalBuiltupAreaSqm: 120,
    } as any;
    render(<ValuationMetricsStrip data={mockData} />);
    expect(screen.getByText(/totalCarpetArea/i)).toBeInTheDocument();
  });
});
