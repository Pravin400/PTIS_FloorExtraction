import { render, screen, fireEvent } from '@testing-library/react';
import { MatrixCellInput } from '@/components/common/MatrixCellInput';
import { vi } from 'vitest';

describe('MatrixCellInput', () => {
  const defaultProps = {
    value: 50,
    rowId: 'row-1',
    columnId: 'col-1',
    onCellChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with initial value', () => {
    render(<MatrixCellInput {...defaultProps} />);
    const input = screen.getByRole('spinbutton');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue(50);
  });

  it('renders placeholder when value is 0', () => {
    render(<MatrixCellInput {...defaultProps} value={0} />);
    const input = screen.getByRole('spinbutton') as HTMLInputElement;
    // jsdom normalises an empty number input to "0"; the placeholder should still be set
    expect(input).toHaveAttribute('placeholder', '0');
  });

  it('calls onCellChange with correct arguments on valid change', () => {
    render(<MatrixCellInput {...defaultProps} />);
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '75' } });

    expect(defaultProps.onCellChange).toHaveBeenCalledWith('row-1', 'col-1', 75);
  });

  it('handles empty input by sending 0', () => {
    render(<MatrixCellInput {...defaultProps} />);
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '' } });

    expect(defaultProps.onCellChange).toHaveBeenCalledWith('row-1', 'col-1', 0);
  });

  it('prevents negative values by clamping to 0', () => {
    render(<MatrixCellInput {...defaultProps} />);
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '-50' } });

    expect(defaultProps.onCellChange).toHaveBeenCalledWith('row-1', 'col-1', 0);
  });

  it('applies custom color class', () => {
    render(<MatrixCellInput {...defaultProps} colorClass="bg-red-500" />);
    const input = screen.getByRole('spinbutton');
    expect(input).toHaveClass('bg-red-500');
  });

  it('applies aria-label correctly', () => {
    render(<MatrixCellInput {...defaultProps} metaLabel="Test Input" />);
    const input = screen.getByRole('spinbutton');
    expect(input).toHaveAttribute('aria-label', 'Test Input');
  });

  it('handles decimal values correctly', () => {
    render(<MatrixCellInput {...defaultProps} value={50.25} />);
    const input = screen.getByRole('spinbutton');
    expect(input).toHaveValue(50.25);
  });

  describe('Rate max 9999 validation', () => {
    it('rejects input when integer part exceeds 4 digits (> 9999)', () => {
      render(<MatrixCellInput {...defaultProps} />);
      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '15000' } });

      expect(defaultProps.onCellChange).not.toHaveBeenCalledWith('row-1', 'col-1', 9999);
    });

    it('rejects large values with more than 4 integer digits', () => {
      render(<MatrixCellInput {...defaultProps} />);
      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '99999' } });

      expect(defaultProps.onCellChange).not.toHaveBeenCalledWith('row-1', 'col-1', 9999);
    });

    it('accepts exactly 100 as valid', () => {
      render(<MatrixCellInput {...defaultProps} />);
      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '100' } });

      expect(defaultProps.onCellChange).toHaveBeenCalledWith('row-1', 'col-1', 100);
    });

    it('accepts values below 100', () => {
      render(<MatrixCellInput {...defaultProps} />);
      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '99' } });

      expect(defaultProps.onCellChange).toHaveBeenCalledWith('row-1', 'col-1', 99);
    });

    it('accepts 0 as valid', () => {
      render(<MatrixCellInput {...defaultProps} />);
      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '0' } });

      expect(defaultProps.onCellChange).toHaveBeenCalledWith('row-1', 'col-1', 0);
    });
  });

  describe('Decimal places validation', () => {
    it('allows up to 2 decimal places', () => {
      render(<MatrixCellInput {...defaultProps} />);
      const input = screen.getByRole('spinbutton') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '50.25' } });

      expect(input.value).toBe('50.25');
      expect(defaultProps.onCellChange).toHaveBeenCalledWith('row-1', 'col-1', 50.25);
    });

    it('blocks input with more than 2 decimal places', () => {
      render(<MatrixCellInput {...defaultProps} />);
      const input = screen.getByRole('spinbutton') as HTMLInputElement;
      const initialValue = input.value;

      fireEvent.change(input, { target: { value: '50.123' } });

      // Should not update since more than 2 decimal places
      expect(input.value).toBe(initialValue);
    });

    it('allows exactly 1 decimal place', () => {
      render(<MatrixCellInput {...defaultProps} />);
      const input = screen.getByRole('spinbutton') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '50.5' } });

      expect(input.value).toBe('50.5');
    });

    it('allows whole numbers with no decimal', () => {
      render(<MatrixCellInput {...defaultProps} />);
      const input = screen.getByRole('spinbutton') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '75' } });

      expect(input.value).toBe('75');
    });
  });

  describe('Read-only mode', () => {
    it('is disabled when readOnly is true', () => {
      render(<MatrixCellInput {...defaultProps} readOnly />);
      const input = screen.getByRole('spinbutton');
      expect(input).toBeDisabled();
    });

    it('shows 0 (not empty) when value is 0 in read-only mode', () => {
      render(<MatrixCellInput {...defaultProps} value={0} readOnly />);
      const input = screen.getByRole('spinbutton') as HTMLInputElement;
      expect(input.value).toBe('0');
    });
  });
});
