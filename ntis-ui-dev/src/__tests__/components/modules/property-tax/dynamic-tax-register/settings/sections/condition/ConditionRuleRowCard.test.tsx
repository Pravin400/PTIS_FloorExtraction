import { render, screen, fireEvent } from '@testing-library/react';
import { ConditionRuleRowCard } from '@/components/modules/property-tax/dynamic-tax-register/settings/sections/condition/ConditionRuleRowCard';
import type { ConditionRuleRow } from '@/types/dynamic-tax-register.types';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('ConditionRuleRowCard', () => {
  const row: ConditionRuleRow = {
    id: 1,
    taxId: 1,
    ruleDefinitionId: 1,
    sortOrder: 1,
    conditions: [],
    resultMode: 'FIXED',
    resultBase: 'NONE',
    resultValue: 100,
    referenceTaxId: null,
    unitFieldId: null,
    assessmentYearRangeId: null,
    assessmentBasis: 'PROPERTY_BASED',
    stopFurtherProcessing: false,
    isActive: true,
  };

  const props = {
    row,
    index: 0,
    total: 2,
    fields: [],
    yearRangeOptions: [],
    taxOptions: [],
    expanded: false,
    onToggleExpand: vi.fn(),
    onMoveUp: vi.fn(),
    onMoveDown: vi.fn(),
    onToggleActive: vi.fn(),
    onToggleStopFurtherProcessing: vi.fn(),
    onSetAssessmentBasis: vi.fn(),
    onRemove: vi.fn(),
    onAddCondition: vi.fn(),
    onRemoveCondition: vi.fn(),
    onPatchCondition: vi.fn(),
    onPatchEffect: vi.fn(),
  };

  it('renders sortOrder number', () => {
    render(<ConditionRuleRowCard {...props} />);
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('calls onMoveDown when move down button clicked', () => {
    render(<ConditionRuleRowCard {...props} />);
    const moveDownBtn = screen.getByLabelText('condition.moveDown');
    fireEvent.click(moveDownBtn);
    expect(props.onMoveDown).toHaveBeenCalled();
  });
});
