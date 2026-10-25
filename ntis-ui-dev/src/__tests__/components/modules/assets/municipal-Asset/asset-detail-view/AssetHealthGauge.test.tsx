import { render, screen } from '@testing-library/react';
import { AssetHealthGauge } from '@/components/modules/assets/municipal-Asset/asset-detail-view/AssetHealthGauge';
import { vi } from 'vitest';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('AssetHealthGauge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with given value and max', () => {
    render(<AssetHealthGauge value={80} max={100} healthLabel="Good Health" />);
    
    expect(screen.getByText('80')).toBeInTheDocument();
    expect(screen.getByText('/100')).toBeInTheDocument();
    expect(screen.getByText('Good Health')).toBeInTheDocument();
  });

  it('handles zero values correctly', () => {
    render(<AssetHealthGauge value={0} max={0} healthLabel="Poor Health" />);
    
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('/0')).toBeInTheDocument();
    expect(screen.getByText('Poor Health')).toBeInTheDocument();
  });
});
