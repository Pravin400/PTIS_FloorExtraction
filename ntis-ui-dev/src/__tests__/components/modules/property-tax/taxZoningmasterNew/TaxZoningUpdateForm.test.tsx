/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TaxZoningUpdateForm from '@/components/modules/property-tax/taxZoningmasterNew/TaxZoningUpdateForm';
import type { Ward, TaxZone } from '@/types/taxZoningRange.types';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/components/common/ValidationMessage', () => ({
  ValidationMessage: ({ message, visible = true }: any) =>
    visible && message ? <span data-testid="validation-msg">{message}</span> : null,
}));

vi.mock('@/components/common/SearchSelect', () => ({
  SearchSelect: ({ name, options, value, onChange, placeholder, disabled }: any) => (
    <select
      data-testid="search-select"
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(name, e.target.value)}
    >
      <option value="">{placeholder}</option>
      {options.map((opt: any) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  ),
}));

vi.mock('@/components/common/Dropdown', () => ({
  MultiSelectDropdown: ({ options, value, onChange, placeholder }: any) => (
    <div data-testid="multi-select-dropdown">
      <span>{placeholder}</span>
      {options.map((opt: any) => (
        <button
          key={opt.value}
          data-testid={`ward-option-${opt.value}`}
          onClick={() => {
            const next = value.includes(opt.value)
              ? value.filter((v: string) => v !== opt.value)
              : [...value, opt.value];
            onChange(next);
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  ),
}));

const wardsData: Ward[] = [
  { id: 1, wardNo: 'W1', zoneNo: 'Z1', description: null, descriptionEnglish: null, sequenceNo: 1, isActive: true, createdBy: null, createdDate: '', updatedBy: null, updatedDate: null },
  { id: 2, wardNo: 'W2', zoneNo: 'Z2', description: null, descriptionEnglish: null, sequenceNo: 2, isActive: true, createdBy: null, createdDate: '', updatedBy: null, updatedDate: null },
];

const taxZones: TaxZone[] = [
  { id: 1, taxZoneNo: 'TZ1', taxZoneType: 'R', remark: null, createdDate: '', updatedDate: null, isActive: true },
  { id: 2, taxZoneNo: 'TZ2', taxZoneType: 'C', remark: null, createdDate: '', updatedDate: null, isActive: true },
];

function makeProps(overrides: Partial<React.ComponentProps<typeof TaxZoningUpdateForm>> = {}) {
  return {
    wardsData,
    taxZones,
    selectedWards: [1],
    setSelectedWards: vi.fn(),
    propertyFrom: '',
    setPropertyFrom: vi.fn(),
    propertyTo: '',
    setPropertyTo: vi.fn(),
    description: '',
    setDescription: vi.fn(),
    selectedZone: '',
    setSelectedZone: vi.fn(),
    propertyOptions: [{ label: '10', value: '10' }, { label: '20', value: '20' }],
    isMultiWard: false,
    isEditMode: false,
    submitted: false,
    isWardValid: true,
    isZoneValid: true,
    isDescriptionValid: true,
    isRangeValid: true,
    onSubmit: vi.fn(),
    ...overrides,
  };
}

describe('TaxZoningUpdateForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the ward multi-select with ward options', () => {
    render(<TaxZoningUpdateForm {...makeProps()} />);
    expect(screen.getByTestId('multi-select-dropdown')).toBeInTheDocument();
    expect(screen.getByTestId('ward-option-1')).toHaveTextContent('W1');
    expect(screen.getByTestId('ward-option-2')).toHaveTextContent('W2');
  });

  it('hides property-range inputs and shows multi-ward note when isMultiWard is true', () => {
    render(<TaxZoningUpdateForm {...makeProps({ isMultiWard: true, selectedWards: [1, 2] })} />);
    // Only the Tax Zone SearchSelect remains; property-range SearchSelects are hidden
    expect(screen.queryAllByTestId('search-select')).toHaveLength(1);
    expect(screen.queryByText('propertyFrom')).not.toBeInTheDocument();
    expect(screen.queryByText('propertyTo')).not.toBeInTheDocument();
    expect(screen.getByText('multiWardNote')).toBeInTheDocument();
  });

  it('shows property-range inputs when isMultiWard is false', () => {
    render(<TaxZoningUpdateForm {...makeProps({ isMultiWard: false })} />);
    expect(screen.queryByText('multiWardNote')).not.toBeInTheDocument();
    expect(screen.getByText('propertyFrom')).toBeInTheDocument();
    expect(screen.getByText('propertyTo')).toBeInTheDocument();
  });

  it('renders taxZones as zone select options', () => {
    render(<TaxZoningUpdateForm {...makeProps()} />);
    expect(screen.getByText('TZ1')).toBeInTheDocument();
    expect(screen.getByText('TZ2')).toBeInTheDocument();
  });

  it('shows ward validation message only when submitted and invalid', () => {
    const { rerender } = render(<TaxZoningUpdateForm {...makeProps({ submitted: false, isWardValid: false })} />);
    expect(screen.queryByText('wardRequired')).not.toBeInTheDocument();

    rerender(<TaxZoningUpdateForm {...makeProps({ submitted: true, isWardValid: true })} />);
    expect(screen.queryByText('wardRequired')).not.toBeInTheDocument();

    rerender(<TaxZoningUpdateForm {...makeProps({ submitted: true, isWardValid: false })} />);
    expect(screen.getByText('wardRequired')).toBeInTheDocument();
  });

  it('shows range validation message only when submitted and invalid', () => {
    const { rerender } = render(<TaxZoningUpdateForm {...makeProps({ submitted: false, isRangeValid: false })} />);
    expect(screen.queryByText('rangeInvalid')).not.toBeInTheDocument();

    rerender(<TaxZoningUpdateForm {...makeProps({ submitted: true, isRangeValid: true })} />);
    expect(screen.queryByText('rangeInvalid')).not.toBeInTheDocument();

    rerender(<TaxZoningUpdateForm {...makeProps({ submitted: true, isRangeValid: false })} />);
    expect(screen.getByText('rangeInvalid')).toBeInTheDocument();
  });

  it('shows zone validation message only when submitted and invalid', () => {
    const { rerender } = render(<TaxZoningUpdateForm {...makeProps({ submitted: false, isZoneValid: false })} />);
    expect(screen.queryByText('zoneRequired')).not.toBeInTheDocument();

    rerender(<TaxZoningUpdateForm {...makeProps({ submitted: true, isZoneValid: true })} />);
    expect(screen.queryByText('zoneRequired')).not.toBeInTheDocument();

    rerender(<TaxZoningUpdateForm {...makeProps({ submitted: true, isZoneValid: false })} />);
    expect(screen.getByText('zoneRequired')).toBeInTheDocument();
  });

  it('shows description validation message only when submitted and invalid', () => {
    const { rerender } = render(<TaxZoningUpdateForm {...makeProps({ submitted: false, isDescriptionValid: false })} />);
    expect(screen.queryByText('descriptionInvalid')).not.toBeInTheDocument();

    rerender(<TaxZoningUpdateForm {...makeProps({ submitted: true, isDescriptionValid: true })} />);
    expect(screen.queryByText('descriptionInvalid')).not.toBeInTheDocument();

    rerender(<TaxZoningUpdateForm {...makeProps({ submitted: true, isDescriptionValid: false })} />);
    expect(screen.getByText('descriptionInvalid')).toBeInTheDocument();
  });

  it('disables property-range SearchSelects when no ward is selected', () => {
    render(<TaxZoningUpdateForm {...makeProps({ selectedWards: [] })} />);
    // 3 SearchSelects now render: Property From, Property To, Tax Zone (in that DOM order).
    // Only the first two (property-range) are gated by ward selection.
    const selects = screen.getAllByTestId('search-select');
    expect(selects).toHaveLength(3);
    const [propertyFrom, propertyTo] = selects;
    expect(propertyFrom).toBeDisabled();
    expect(propertyTo).toBeDisabled();
  });

  it('disables property-range SearchSelects when propertyOptions is empty', () => {
    render(<TaxZoningUpdateForm {...makeProps({ selectedWards: [1], propertyOptions: [] })} />);
    const selects = screen.getAllByTestId('search-select');
    expect(selects).toHaveLength(3);
    const [propertyFrom, propertyTo] = selects;
    expect(propertyFrom).toBeDisabled();
    expect(propertyTo).toBeDisabled();
  });

  it('enables property-range SearchSelects when ward selected and options available', () => {
    render(<TaxZoningUpdateForm {...makeProps({ selectedWards: [1], propertyOptions: [{ label: '10', value: '10' }] })} />);
    const selects = screen.getAllByTestId('search-select');
    expect(selects).toHaveLength(3);
    const [propertyFrom, propertyTo] = selects;
    expect(propertyFrom).not.toBeDisabled();
    expect(propertyTo).not.toBeDisabled();
  });

  it('calls onSubmit when the form is submitted', () => {
    const onSubmit = vi.fn((e) => e.preventDefault());
    const { container } = render(<TaxZoningUpdateForm {...makeProps({ onSubmit })} />);
    const form = container.querySelector('#tax-zoning-form') as HTMLFormElement;
    fireEvent.submit(form);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
