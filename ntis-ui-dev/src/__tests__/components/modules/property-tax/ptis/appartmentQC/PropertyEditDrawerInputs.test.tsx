import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import {
  EditableInput,
  EditableSelect,
  ReadOnlyInput,
  PropertyInfoBadges,
  CompactSelect,
  CompactCellInput,
  EditableInputWithRefresh,
} from '@/components/modules/property-tax/ptis/appartmentQC/PropertyEditDrawerInputs';

// Mock the common components
vi.mock('@/components/common', () => ({
  Input: ({ label, ...props }: { label?: string; [key: string]: unknown }) => (
    <input aria-label={label} {...props} />
  ),
  Select: ({ label, options, onChange, ...props }: { label?: string; options?: Array<{ value: string; label: string }>; onChange?: (e: unknown, val: string) => void; [key: string]: unknown }) => (
    <select
      aria-label={label}
      {...props}
      onChange={(e) => {
        onChange?.(undefined, e.target.value);
      }}
    >
      {options?.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  ),
  ValidationMessage: ({ message, visible }: { message?: string; visible?: boolean }) => (
    <span data-testid="validation-message" style={{ display: visible ? 'block' : 'none' }}>
      {message}
    </span>
  ),
  Badge: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => (
    <span data-testid="badge" {...props}>{children}</span>
  ),
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('PropertyEditDrawerInputs', () => {
  describe('EditableInput', () => {
    it('renders with label and value', () => {
      const onChange = vi.fn();
      render(<EditableInput label="Test Label" value="test value" onChange={onChange} />);
      expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
      expect(screen.getByLabelText('Test Label')).toHaveValue('test value');
    });

    it('calls onChange when value changes', () => {
      const onChange = vi.fn();
      render(<EditableInput label="Test Label" value="" onChange={onChange} />);
      const input = screen.getByLabelText('Test Label');
      fireEvent.change(input, { target: { value: 'new value' } });
      expect(onChange).toHaveBeenCalledWith('new value');
    });

    it('shows validation message when error is provided', () => {
      const onChange = vi.fn();
      render(<EditableInput label="Test Label" value="" onChange={onChange} error="Test error" />);
      expect(screen.getByTestId('validation-message')).toBeInTheDocument();
      expect(screen.getByTestId('validation-message')).toHaveTextContent('Test error');
    });
  });

  describe('EditableInputWithRefresh', () => {
    it('renders with refresh button', async () => {
      const onChange = vi.fn();
      const onRefresh = vi.fn().mockResolvedValue(undefined);
      render(<EditableInputWithRefresh label="Test Label" value="test" onChange={onChange} onRefresh={onRefresh} />);
      expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
    });

    it('calls onRefresh when refresh button is clicked', async () => {
      const onChange = vi.fn();
      const onRefresh = vi.fn().mockResolvedValue(undefined);
      render(<EditableInputWithRefresh label="Test Label" value="test" onChange={onChange} onRefresh={onRefresh} />);
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      fireEvent.click(refreshButton);
      await waitFor(() => {
        expect(onRefresh).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('EditableSelect', () => {
    it('renders with options', () => {
      const onChange = vi.fn();
      const options = [
        { value: '1', label: 'Option 1' },
        { value: '2', label: 'Option 2' },
      ];
      render(<EditableSelect label="Test Select" value="1" onChange={onChange} options={options} />);
      expect(screen.getByLabelText('Test Select')).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Option 1' })).toBeInTheDocument();
    });

    it('calls onChange when option is selected', () => {
      const onChange = vi.fn();
      const options = [
        { value: '1', label: 'Option 1' },
        { value: '2', label: 'Option 2' },
      ];
      render(<EditableSelect label="Test Select" value="1" onChange={onChange} options={options} />);
      const select = screen.getByLabelText('Test Select');
      fireEvent.change(select, { target: { value: '2' } });
      expect(onChange).toHaveBeenCalledWith('2');
    });

    it('shows validation message when error is provided', () => {
      const onChange = vi.fn();
      const options = [
        { value: '1', label: 'Option 1' },
      ];
      render(<EditableSelect label="Test Select" value="1" onChange={onChange} options={options} error="Test error" />);
      expect(screen.getByTestId('validation-message')).toBeInTheDocument();
      expect(screen.getByTestId('validation-message')).toHaveTextContent('Test error');
    });
  });

  describe('ReadOnlyInput', () => {
    it('renders read-only input with value', () => {
      render(<ReadOnlyInput label="Test Read Only" value="read only value" />);
      expect(screen.getByLabelText('Test Read Only')).toBeInTheDocument();
      expect(screen.getByLabelText('Test Read Only')).toHaveValue('read only value');
      expect(screen.getByLabelText('Test Read Only')).toHaveAttribute('readOnly');
    });
  });

  describe('PropertyInfoBadges', () => {
    it('renders all badges', () => {
      render(<PropertyInfoBadges 
        wardId="1"
        zoneNo="Zone 1"
        propertyNo="123"
        type="Residential"
        copy={{ ward: 'Ward', zone: 'Zone', prop: 'Property', type: 'Type' }}
      />);
      const badges = screen.getAllByTestId('badge');
      expect(badges).toHaveLength(4);
    });
  });

  describe('CompactSelect', () => {
    it('renders compact select with options', () => {
      const onChange = vi.fn();
      const options = [
        { value: '1', label: 'Option 1' },
        { value: '2', label: 'Option 2' },
      ];
      render(<CompactSelect value="1" onChange={onChange} options={options} />);
      expect(screen.getByDisplayValue('Option 1')).toBeInTheDocument();
    });
  });

  describe('CompactCellInput', () => {
    it('renders with value', () => {
      const onChange = vi.fn();
      render(<CompactCellInput value="123" onChange={onChange} />);
      const input = screen.getByDisplayValue('123');
      expect(input).toBeInTheDocument();
      fireEvent.change(input, { target: { value: '456' } });
      expect(onChange).toHaveBeenCalledWith('456');
    });
  });
});