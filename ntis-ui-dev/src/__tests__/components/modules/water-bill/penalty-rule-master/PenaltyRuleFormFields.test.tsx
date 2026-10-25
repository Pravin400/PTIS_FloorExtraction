import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { PenaltyRuleFormFields } from '@/components/modules/water-bill/penalty-rule-master/PenaltyRuleFormFields';
import type { CreateWaterPenaltyRuleModel } from '@/types/water-bill/penalty-rule-master.types';
import type { FinancialYearLookupOption } from '@/types/water-bill/lookups.types';

describe('PenaltyRuleFormFields - Type Switch Regression & Normalization', () => {
  beforeAll(() => {
    window.HTMLElement.prototype.scrollIntoView = function () { };
  });

  const mockFYOptions: FinancialYearLookupOption[] = [
    { value: '1', label: '2026-27', startDate: '2026-04-01', endDate: '2027-03-31', isCurrent: true },
    { value: '2', label: '2025-26', startDate: '2025-04-01', endDate: '2026-03-31', isCurrent: false },
  ];

  const t = (key: string) => key;

  it('normalizes fields: clears percentageRate when switching to Flat and clears flatAmount when switching back', () => {
    let currentData: CreateWaterPenaltyRuleModel = {
      financialYearId: 1,
      connectionCategoryId: 1,
      penaltyType: 'Percentage',
      percentageRate: 2,
      flatAmount: null,
      fromDay: 1,
      effectiveFrom: '2026-04-01',
      effectiveTo: '2027-03-31',
      isCurrentBill: true,
      isPendingBill: false,
      isActive: true,
    };

    const handleChange = vi.fn((updated: CreateWaterPenaltyRuleModel) => {
      currentData = updated;
    });

    const { rerender } = render(
      <PenaltyRuleFormFields
        formData={currentData}
        onChange={handleChange}
        t={t}
        financialYearOptions={mockFYOptions}
      />
    );

    // Click Penalty Type select dropdown and choose "Flat Amount (₹)"
    const penaltyTypeButton = screen.getByRole('combobox', { name: /form\.penaltyType/i });
    fireEvent.click(penaltyTypeButton);
    fireEvent.click(screen.getByText('Flat Amount (₹)'));

    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        penaltyType: 'Flat',
        percentageRate: null,
        flatAmount: null,
      })
    );

    // Rerender with Flat mode and flatAmount populated
    currentData = { ...currentData, penaltyType: 'Flat', percentageRate: null, flatAmount: 200 };
    rerender(
      <PenaltyRuleFormFields
        formData={currentData}
        onChange={handleChange}
        t={t}
        financialYearOptions={mockFYOptions}
      />
    );

    // Switch back to Percentage
    fireEvent.click(penaltyTypeButton);
    fireEvent.click(screen.getByText('Percentage (%)'));

    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        penaltyType: 'Percentage',
        percentageRate: null,
        flatAmount: null,
      })
    );
  });

  it('updates effectiveFrom and effectiveTo dynamically when financial year changes', () => {
    let currentData: CreateWaterPenaltyRuleModel = {
      financialYearId: 1,
      connectionCategoryId: 1,
      penaltyType: 'Percentage',
      percentageRate: 2,
      flatAmount: null,
      fromDay: 1,
      effectiveFrom: '2026-04-01',
      effectiveTo: '2027-03-31',
      isCurrentBill: true,
      isPendingBill: false,
      isActive: true,
    };

    const handleChange = vi.fn((updated: CreateWaterPenaltyRuleModel) => {
      currentData = updated;
    });

    render(
      <PenaltyRuleFormFields
        formData={currentData}
        onChange={handleChange}
        t={t}
        financialYearOptions={mockFYOptions}
      />
    );

    // Click Financial Year select dropdown and choose 2025-26
    const fyButton = screen.getByRole('combobox', { name: /form\.financialYear/i });
    fireEvent.click(fyButton);
    fireEvent.click(screen.getByText('2025-26'));

    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        financialYearId: 2,
        effectiveFrom: '2025-04-01',
        effectiveTo: '2026-03-31',
      })
    );
  });

  it('hides Maximum Penalty Cap input when penaltyType is Flat, and displays it for Percentage', () => {
    const flatData: CreateWaterPenaltyRuleModel = {
      financialYearId: 1,
      connectionCategoryId: 1,
      penaltyType: 'Flat',
      percentageRate: null,
      flatAmount: 200,
      maximumAmount: null,
      fromDay: 1,
      effectiveFrom: '2026-04-01',
      effectiveTo: '2027-03-31',
      isCurrentBill: true,
      isPendingBill: false,
      isActive: true,
    };

    const { rerender } = render(
      <PenaltyRuleFormFields formData={flatData} onChange={vi.fn()} t={t} />
    );

    expect(screen.queryByText('form.maximumAmount')).toBeNull();

    const percentageData: CreateWaterPenaltyRuleModel = {
      ...flatData,
      penaltyType: 'Percentage',
      percentageRate: 2,
      flatAmount: null,
      maximumAmount: 500,
    };

    rerender(<PenaltyRuleFormFields formData={percentageData} onChange={vi.fn()} t={t} />);

    expect(screen.getByText('form.maximumAmount')).toBeInTheDocument();
  });

  it('provides All Categories (General) option in the connection category dropdown', () => {
    const data: CreateWaterPenaltyRuleModel = {
      financialYearId: 1,
      connectionCategoryId: 0,
      penaltyType: 'Percentage',
      percentageRate: 2,
      flatAmount: null,
      maximumAmount: null,
      fromDay: 1,
      effectiveFrom: '2026-04-01',
      effectiveTo: '2027-03-31',
      isCurrentBill: true,
      isPendingBill: false,
      isActive: true,
    };

    render(<PenaltyRuleFormFields formData={data} onChange={vi.fn()} t={t} />);

    const catSelect = screen.getByRole('combobox', { name: /form\.connectionCategory/i });
    fireEvent.click(catSelect);

    expect(screen.getByRole('option', { name: 'All Categories (General)' })).toBeInTheDocument();
  });

  it('displays All Categories (General) when connectionCategoryId is null', () => {
    const data: CreateWaterPenaltyRuleModel = {
      financialYearId: 1,
      connectionCategoryId: null,
      penaltyType: 'Percentage',
      percentageRate: 2,
      flatAmount: null,
      maximumAmount: null,
      fromDay: 1,
      effectiveFrom: '2026-04-01',
      effectiveTo: '2027-03-31',
      isCurrentBill: true,
      isPendingBill: false,
      isActive: true,
    };

    render(<PenaltyRuleFormFields formData={data} onChange={vi.fn()} t={t} />);

    const catSelect = screen.getByRole('combobox', { name: /form\.connectionCategory/i });
    expect(catSelect).toHaveTextContent('All Categories (General)');
  });

  it('calls onChange with numeric ID when a specific category is selected', () => {
    const handleChange = vi.fn();
    const data: CreateWaterPenaltyRuleModel = {
      financialYearId: 1,
      connectionCategoryId: null,
      penaltyType: 'Percentage',
      percentageRate: 2,
      flatAmount: null,
      maximumAmount: null,
      fromDay: 1,
      effectiveFrom: '2026-04-01',
      effectiveTo: '2027-03-31',
      isCurrentBill: true,
      isPendingBill: false,
      isActive: true,
    };

    render(<PenaltyRuleFormFields formData={data} onChange={handleChange} t={t} />);

    const catSelect = screen.getByRole('combobox', { name: /form\.connectionCategory/i });
    fireEvent.click(catSelect);

    const regularOption = screen.getByRole('option', { name: /Regular/i });
    fireEvent.click(regularOption);

    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        connectionCategoryId: 1,
      })
    );
  });

  it('calls onChange with null when switching from specific category to All Categories (General)', () => {
    const handleChange = vi.fn();
    const data: CreateWaterPenaltyRuleModel = {
      financialYearId: 1,
      connectionCategoryId: 1,
      penaltyType: 'Percentage',
      percentageRate: 2,
      flatAmount: null,
      maximumAmount: null,
      fromDay: 1,
      effectiveFrom: '2026-04-01',
      effectiveTo: '2027-03-31',
      isCurrentBill: true,
      isPendingBill: false,
      isActive: true,
    };

    render(<PenaltyRuleFormFields formData={data} onChange={handleChange} t={t} />);

    const catSelect = screen.getByRole('combobox', { name: /form\.connectionCategory/i });
    fireEvent.click(catSelect);

    const generalOption = screen.getByRole('option', { name: 'All Categories (General)' });
    fireEvent.click(generalOption);

    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        connectionCategoryId: null,
      })
    );
  });
});
