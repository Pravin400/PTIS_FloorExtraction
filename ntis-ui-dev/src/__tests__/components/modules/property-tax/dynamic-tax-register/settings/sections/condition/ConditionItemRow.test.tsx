import { render, screen } from '@testing-library/react';
import { ConditionItemRow } from '@/components/modules/property-tax/dynamic-tax-register/settings/sections/condition/ConditionItemRow';
import type { ConditionItem } from '@/types/dynamic-tax-register.types';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('ConditionItemRow', () => {
  const condition: ConditionItem = {
    id: 'c1',
    logicalOperator: 'AND',
    fieldId: 'f1',
    operator: 'EQUALS',
    value: '10',
  };

  const props = {
    condition,
    fields: [
      {
        id: 1,
        fieldId: 'f1',
        fieldName: 'Field 1',
        dataType: 'STRING' as const,
        inputType: 'TEXTBOX' as const,
        sourceType: 'STATIC' as const,
        isRequired: false,
        supportedOperators: [],
      },
    ],
    isFirst: true,
    onPatch: vi.fn(),
    onRemove: vi.fn(),
  };

  it('renders IF for first item', () => {
    render(<ConditionItemRow {...props} />);
    expect(screen.getByText('IF')).toBeInTheDocument();
  });

  it('renders AND/OR buttons for non-first item', () => {
    render(<ConditionItemRow {...props} isFirst={false} />);
    expect(screen.getByText('AND')).toBeInTheDocument();
    expect(screen.getByText('OR')).toBeInTheDocument();
  });
});
