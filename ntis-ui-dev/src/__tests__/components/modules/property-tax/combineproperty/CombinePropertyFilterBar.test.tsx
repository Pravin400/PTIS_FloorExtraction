import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CombinePropertyFilterBar } from '@/components/modules/property-tax/ptis/combineproperty/CombinePropertyFilterBar';

vi.mock('@/components/common/SearchSelect', () => ({
  SearchSelect: ({ id, value, onChange, placeholder }: { id: string, value: string, onChange: (id: string, val: string) => void, placeholder: string }) => (
    <select
      data-testid={`select-${id}`}
      value={value || ''}
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

describe('CombinePropertyFilterBar', () => {
  const mockProps = {
    t: (k: string) => k,
    basePropertyOptions: [{ label: 'Base 1', value: '1' }],
    subPropertyOptions: [{ label: 'Sub 1', value: '1' }],
    propertyTypeOptions: [{ label: 'Type 1', value: '1' }],
    selectedBasePropertyId: '',
    selectionMethod: 'range' as const,
    rangeFrom: '',
    rangeTo: '',
    selectedProperties: [],
    selectedPropertyType: '',
    showPropertyTypeDropdown: false,
    selectedCount: 0,
    canProceed: true,
    isPending: false,
    handleBasePropertyChange: vi.fn(),
    handleMethodChange: vi.fn(),
    handleRangeFromChange: vi.fn(),
    handleRangeToChange: vi.fn(),
    handleIndividualChange: vi.fn(),
    setSelectedPropertyType: vi.fn(),
    handleClear: vi.fn(),
    handleProceed: vi.fn(),
    showHistory: false,
    setShowHistory: vi.fn(),
  };

  it('renders correctly with range method', () => {
    render(<CombinePropertyFilterBar {...mockProps} />);
    expect(screen.getByTestId('select-baseProperty')).toBeDefined();
    expect(screen.getByTestId('select-rangeFrom')).toBeDefined();
    expect(screen.getByTestId('select-rangeTo')).toBeDefined();
    expect(screen.getByTestId('add-btn')).toBeDefined();
  });

  it('renders correctly with individual method', () => {
    render(<CombinePropertyFilterBar {...mockProps} selectionMethod="individual" />);
    expect(screen.getByTestId('multi-select')).toBeDefined();
    expect(screen.queryByTestId('select-rangeFrom')).toBeNull();
  });

  it('shows property type dropdown when required', () => {
    render(<CombinePropertyFilterBar {...mockProps} showPropertyTypeDropdown={true} />);
    expect(screen.getByTestId('select-propertyType')).toBeDefined();
  });

  it('calls respective handlers on change', () => {
    render(<CombinePropertyFilterBar {...mockProps} />);
    
    fireEvent.change(screen.getByTestId('select-baseProperty'), { target: { value: '1' } });
    expect(mockProps.handleBasePropertyChange).toHaveBeenCalledWith('baseProperty', '1');

    fireEvent.change(screen.getByTestId('select-rangeFrom'), { target: { value: '2' } });
    expect(mockProps.handleRangeFromChange).toHaveBeenCalledWith('rangeFrom', '2');
  });

  it('handles tab switches', () => {
    render(<CombinePropertyFilterBar {...mockProps} />);
    const indTab = screen.getByText('individual');
    fireEvent.click(indTab);
    expect(mockProps.handleMethodChange).toHaveBeenCalledWith('individual');
  });

  it('handles buttons', () => {
    render(<CombinePropertyFilterBar {...mockProps} />);
    
    fireEvent.click(screen.getByTestId('add-btn'));
    expect(mockProps.handleProceed).toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('cancel-btn'));
    expect(mockProps.handleClear).toHaveBeenCalled();
  });
});
