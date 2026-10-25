import { render, screen, fireEvent } from '@testing-library/react';
import { MatrixDeleteButton } from '@/components/common/MatrixDeleteButton';
import { vi } from 'vitest';

describe('MatrixDeleteButton', () => {
  const defaultProps = {
    rowIndex: 5,
    onRowDelete: vi.fn(),
    ariaLabel: 'Delete row 5',
  };

  it('renders correctly', () => {
    render(<MatrixDeleteButton {...defaultProps} />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', 'Delete row 5');
  });

  it('calls onRowDelete with rowIndex when clicked', () => {
    render(<MatrixDeleteButton {...defaultProps} />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(defaultProps.onRowDelete).toHaveBeenCalledWith(5);
  });

  it('does not crash if onRowDelete is undefined', () => {
    render(<MatrixDeleteButton rowIndex={1} />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    // Should just not throw
  });
});
