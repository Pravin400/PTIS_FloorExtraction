import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Toast, ToastContainer, ToastProps } from '@/components/common/Toast';

describe('Toast Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const defaultProps: ToastProps = {
    id: 'test-toast-1',
    type: 'success',
    message: 'Test message',
    onClose: vi.fn(),
  };

  it('renders toast with message', () => {
    render(<Toast {...defaultProps} />);
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('has correct accessibility attributes', () => {
    render(<Toast {...defaultProps} />);
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
  });

  it('displays correct icon for success type', () => {
    render(<Toast {...defaultProps} type="success" />);
    expect(screen.getByTestId('toast-success-test-toast-1')).toBeInTheDocument();
  });

  it('displays correct icon for error type', () => {
    render(<Toast {...defaultProps} type="error" />);
    expect(screen.getByTestId('toast-error-test-toast-1')).toBeInTheDocument();
  });

  it('displays correct icon for info type', () => {
    render(<Toast {...defaultProps} type="info" />);
    expect(screen.getByTestId('toast-info-test-toast-1')).toBeInTheDocument();
  });

  it('displays correct icon for warning type', () => {
    render(<Toast {...defaultProps} type="warning" />);
    expect(screen.getByTestId('toast-warning-test-toast-1')).toBeInTheDocument();
  });

  it('applies correct styling for success type', () => {
    render(<Toast {...defaultProps} type="success" />);
    const toast = screen.getByTestId('toast-success-test-toast-1');
    expect(toast).toHaveClass('bg-green-50');
    expect(toast).toHaveClass('border-green-200');
    expect(toast).toHaveClass('text-green-800');
  });

  it('applies correct styling for error type', () => {
    render(<Toast {...defaultProps} type="error" />);
    const toast = screen.getByTestId('toast-error-test-toast-1');
    expect(toast).toHaveClass('bg-red-50');
    expect(toast).toHaveClass('border-red-200');
    expect(toast).toHaveClass('text-red-800');
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(<Toast {...defaultProps} onClose={handleClose} />);

    const closeButton = screen.getByRole('button', { name: /close notification/i });
    fireEvent.click(closeButton);

    expect(handleClose).toHaveBeenCalledWith('test-toast-1');
  });

  it('auto-dismisses after duration', () => {
    const handleClose = vi.fn();
    render(<Toast {...defaultProps} onClose={handleClose} duration={3000} />);

    expect(handleClose).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(handleClose).toHaveBeenCalledWith('test-toast-1');
  });

  it('uses default duration of 3000ms', () => {
    const handleClose = vi.fn();
    render(<Toast {...defaultProps} onClose={handleClose} />);

    act(() => {
      vi.advanceTimersByTime(2999);
    });
    expect(handleClose).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(handleClose).toHaveBeenCalledWith('test-toast-1');
  });

  it('clears timeout on unmount', () => {
    const handleClose = vi.fn();
    const { unmount } = render(<Toast {...defaultProps} onClose={handleClose} duration={5000} />);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    unmount();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(handleClose).not.toHaveBeenCalled();
  });

  it('has displayName set', () => {
    expect(Toast.displayName).toBe('Toast');
  });
});

describe('ToastContainer Component', () => {
  const mockOnClose = vi.fn();

  it('renders multiple toasts', () => {
    const toasts = [
      { id: '1', type: 'success' as const, message: 'Success message' },
      { id: '2', type: 'error' as const, message: 'Error message' },
    ];

    render(<ToastContainer toasts={toasts} onClose={mockOnClose} />);

    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('returns null when no toasts', () => {
    const { container } = render(<ToastContainer toasts={[]} onClose={mockOnClose} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders container with correct positioning classes', () => {
    const toasts = [{ id: '1', type: 'info' as const, message: 'Info message' }];

    render(<ToastContainer toasts={toasts} onClose={mockOnClose} />);

    const container = screen.getByText('Info message').closest('.fixed');
    expect(container).toHaveClass('top-4');
    expect(container).toHaveClass('right-4');
    expect(container).toHaveClass('z-[9999]');
  });

  it('passes onClose to each toast', () => {
    const handleClose = vi.fn();
    const toasts = [{ id: '1', type: 'success' as const, message: 'Test' }];

    render(<ToastContainer toasts={toasts} onClose={handleClose} />);

    const closeButton = screen.getByRole('button', { name: /close notification/i });
    fireEvent.click(closeButton);

    expect(handleClose).toHaveBeenCalledWith('1');
  });

  it('has displayName set', () => {
    expect(ToastContainer.displayName).toBe('ToastContainer');
  });
});
