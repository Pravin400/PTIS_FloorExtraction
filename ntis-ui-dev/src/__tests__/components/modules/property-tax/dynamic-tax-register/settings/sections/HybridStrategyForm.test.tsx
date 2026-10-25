import { render, screen } from '@testing-library/react';
import { HybridStrategyForm } from '@/components/modules/property-tax/dynamic-tax-register/settings/sections/HybridStrategyForm';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('HybridStrategyForm', () => {
  const props: Parameters<typeof HybridStrategyForm>[0] = {
    hybEvalPriority: 'MASTER_THEN_CONDITION',
    setHybEvalPriority: vi.fn(),
    hybFallback: 'DEFAULT_ZERO',
    setHybFallback: vi.fn(),
    hybBase: 'NONE',
    setHybBase: vi.fn(),
    hybBusy: false,
    handleHybridSave: vi.fn(),
  };

  it('renders strategy form options', () => {
    render(<HybridStrategyForm {...props} />);
    expect(screen.getByText('hybrid.evaluationPriority')).toBeInTheDocument();
  });
});
