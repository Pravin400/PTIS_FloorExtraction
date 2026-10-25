import { render, screen } from '@testing-library/react';
import { ConditionEffectInputs } from '@/components/modules/property-tax/dynamic-tax-register/settings/sections/condition/ConditionEffectInputs';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('ConditionEffectInputs', () => {
  const props = {
    resultMode: 'FIXED' as const,
    resultBase: 'NONE' as const,
    resultValue: 50,
    referenceTaxId: null,
    unitFieldId: null,
    taxOptions: [],
    fields: [],
    onChange: vi.fn(),
  };

  it('renders mode, base, value inputs', () => {
    render(<ConditionEffectInputs {...props} />);
    expect(screen.getByDisplayValue('50')).toBeInTheDocument();
  });
});
