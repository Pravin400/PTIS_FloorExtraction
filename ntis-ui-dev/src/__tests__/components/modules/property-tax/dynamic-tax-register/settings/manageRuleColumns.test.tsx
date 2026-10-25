import { getManageRuleColumns } from '@/components/modules/property-tax/dynamic-tax-register/settings/manageRuleColumns';
import type { TaxCalculationModeOption } from '@/types/dynamic-tax-register.types';

describe('getManageRuleColumns', () => {
  const mockT = vi.fn((key: string) => key);
  const RULE_TYPE_LABEL: Record<string, string> = { VALUE_BASED: 'Value Based' };
  const modeByCode = new Map<string, TaxCalculationModeOption>();
  const mockIsRuleInUse = vi.fn(() => false);
  const mockHandleEdit = vi.fn();
  const mockHandleDelete = vi.fn();

  it('returns columns for manage rule table', () => {
    const columns = getManageRuleColumns({
      t: mockT,
      RULE_TYPE_LABEL,
      modeByCode,
      isRuleInUse: mockIsRuleInUse,
      handleEdit: mockHandleEdit,
      handleDelete: mockHandleDelete,
    });

    expect(columns).toHaveLength(7);
    expect(columns.map((c) => c.key)).toEqual([
      'id',
      'displayName',
      'ruleType',
      'attachedReference',
      'sortOrder',
      'isActive',
      'action',
    ]);
  });
});
