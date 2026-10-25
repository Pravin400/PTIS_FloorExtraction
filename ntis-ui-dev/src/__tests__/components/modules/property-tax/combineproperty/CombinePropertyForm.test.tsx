import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CombinePropertyForm from '@/components/modules/property-tax/ptis/combineproperty/CombinePropertyForm';
import { useCombinePropertyForm } from '@/hooks/combineProperty/useCombineProperty';
import { PropertyCombineDetails } from '@/types/combine-property.types';

// Mock dependencies
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/hooks/combineProperty/useCombineProperty', () => ({
  useCombinePropertyForm: vi.fn(),
}));

vi.mock('@/components/common/Drawer', () => ({
  Drawer: ({ children, title, footer, onClose }: { children: React.ReactNode, title: React.ReactNode, footer: React.ReactNode, onClose: () => void }) => (
    <div data-testid="mock-drawer">
      <div data-testid="drawer-title">{title}</div>
      <button onClick={onClose} data-testid="drawer-close">Close</button>
      <div>{children}</div>
      <div data-testid="drawer-footer">{footer}</div>
    </div>
  ),
}));

vi.mock('@/components/common/SearchSelect', () => ({
  SearchSelect: ({ id, value, onChange, placeholder }: { id: string, value: string, onChange: (id: string, val: string) => void, placeholder: string }) => (
    <select
      data-testid={`select-${id}`}
      value={value}
      onChange={(e) => onChange(id, e.target.value)}
    >
      <option value="">{placeholder}</option>
      <option value="1">Option 1</option>
      <option value="2">Option 2</option>
    </select>
  ),
}));

vi.mock('@/components/common/Dropdown', () => ({
  MultiSelectDropdown: ({ onChange }: { onChange: (val: string[]) => void }) => (
    <div data-testid="multi-select">
      <button onClick={() => onChange(['1', '2'])}>Select 1 and 2</button>
    </div>
  ),
}));

vi.mock('@/components/common/ActionButtons', () => ({
  AddButton: ({ onClick, label, disabled }: { onClick: () => void, label: string, disabled?: boolean }) => (
    <button data-testid="add-btn" onClick={onClick} disabled={disabled}>{label}</button>
  ),
  CancelButton: ({ onClick, label }: { onClick: () => void, label: string }) => (
    <button data-testid="cancel-btn" onClick={onClick}>{label}</button>
  ),
  ShowHistoryButton: ({ onClick, label }: { onClick: () => void, label: string }) => (
    <button data-testid="history-btn" onClick={onClick}>{label}</button>
  ),
}));

vi.mock('@/components/common/MasterTable', () => ({
  MasterTable: ({ data }: { data: unknown[] }) => (
    <div data-testid="master-table">
      Rows: {data?.length}
    </div>
  ),
}));

describe('CombinePropertyForm', () => {
  const mockProps = {
    basePropertyList: [
      { id: 1, wardId: 1, wardNo: 'W1', propertyNo: 'P1', fromProperty: 'P1', toProperty: 'P1', isActive: true, createdDate: '2024-01-01', updatedDate: null }
    ],
    subPropertyList: [
      { id: 2, wardId: 1, wardNo: 'W1', propertyNo: 'P2', fromProperty: 'P2', toProperty: 'P2', isActive: true, createdDate: '2024-01-01', updatedDate: null }
    ],
    propertyTypeList: [
      { id: 1, propertyDescription: 'Residential', type: 'R', propertyTypeGroup: 'Res', searchSequence: 1, propertyTypeCategoryId: 1, isActive: true, createdBy: 1, createdDate: '2024-01-01', updatedDate: null }
    ],
  };

  const mockHookReturnValue = {
    reviewData: [],
    isReviewing: false,
    isPending: false,
    isSubmitting: false,
    rangeFrom: '',
    rangeTo: '',
    selectedProperties: [],
    selectionMethod: 'range',
    selectedCount: 0,
    canProceed: false,
    hasDifferentOwners: false,
    differentOwnerProps: '',
    handleBasePropertyChange: vi.fn(),
    handleMethodChange: vi.fn(),
    handleRangeFromChange: vi.fn(),
    handleRangeToChange: vi.fn(),
    handleIndividualChange: vi.fn(),
    handleClear: vi.fn(),
    handleProceed: vi.fn(),
    handleCombine: vi.fn(),
    router: { back: vi.fn() },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCombinePropertyForm).mockReturnValue(mockHookReturnValue as unknown as ReturnType<typeof useCombinePropertyForm>);
  });

  it('renders correctly with empty state', () => {
    render(<CombinePropertyForm {...mockProps} />);

    expect(screen.getByTestId('mock-drawer')).toBeDefined();
    expect(screen.getByText('title')).toBeDefined();
    expect(screen.getByText('noPropertiesSelected')).toBeDefined();
  });

  it('calls handleBasePropertyChange when base property is selected', () => {
    render(<CombinePropertyForm {...mockProps} />);

    const select = screen.getByTestId('select-baseProperty');
    fireEvent.change(select, { target: { value: '1' } });

    expect(mockHookReturnValue.handleBasePropertyChange).toHaveBeenCalledWith('baseProperty', '1');
  });

  it('switches between range and individual selection methods', () => {
    render(<CombinePropertyForm {...mockProps} />);

    const individualBtn = screen.getByText('individual');
    fireEvent.click(individualBtn);

    expect(mockHookReturnValue.handleMethodChange).toHaveBeenCalledWith('individual');
  });

  it('renders review table when isReviewing is true', () => {
    vi.mocked(useCombinePropertyForm).mockReturnValue({
      ...mockHookReturnValue,
      isReviewing: true,
      selectedBasePropertyId: '1',
      reviewData: [{ propertyId: 2, ownerName: 'John' }] as unknown as PropertyCombineDetails[],
    } as unknown as ReturnType<typeof useCombinePropertyForm>);

    render(<CombinePropertyForm {...mockProps} selectedBasePropertyId="1" />);

    expect(screen.getByTestId('master-table')).toBeDefined();
    expect(screen.getByText('Rows: 1')).toBeDefined();
    expect(screen.getByText('reviewCombination')).toBeDefined();
  });

  it('shows warning when hasDifferentOwners is true', () => {
    vi.mocked(useCombinePropertyForm).mockReturnValue({
      ...mockHookReturnValue,
      isReviewing: true,
      selectedBasePropertyId: '1',
      reviewData: [{ propertyId: 2, ownerName: 'John' }, { propertyId: 3, ownerName: 'Jane' }] as unknown as PropertyCombineDetails[],
      hasDifferentOwners: true,
      differentOwnerProps: 'propertyNo: W1-P3',
    } as unknown as ReturnType<typeof useCombinePropertyForm>);

    render(<CombinePropertyForm {...mockProps} selectedBasePropertyId="1" />);

    expect(screen.getByText('warningDifferentOwners')).toBeDefined();
    expect(screen.getByText('• propertyNo: W1-P3')).toBeDefined();
  });

  it('calls handleProceed when proceed button is clicked', () => {
    vi.mocked(useCombinePropertyForm).mockReturnValue({
      ...mockHookReturnValue,
      canProceed: true,
    } as unknown as ReturnType<typeof useCombinePropertyForm>);

    render(<CombinePropertyForm {...mockProps} />);

    // There are usually two AddButtons (one in filter bar, one in footer).
    // The footer one is only rendered if isReviewing && reviewData.length > 0.
    // So here we get the one in the filter bar.
    const proceedBtn = screen.getByTestId('add-btn');
    fireEvent.click(proceedBtn);

    expect(mockHookReturnValue.handleProceed).toHaveBeenCalled();
  });

  it('disables proceed button when canProceed is false', () => {
    render(<CombinePropertyForm {...mockProps} />);

    const proceedBtn = screen.getByTestId('add-btn') as HTMLButtonElement;
    expect(proceedBtn.disabled).toBe(true);
  });
});
