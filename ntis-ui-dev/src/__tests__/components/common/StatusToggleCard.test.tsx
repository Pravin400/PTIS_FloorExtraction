import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StatusToggleCard } from '@/components/common/StatusToggleCard';

// Mock ToggleSwitch to isolate testing of StatusToggleCard
vi.mock('@/components/common', () => ({
  ToggleSwitch: ({ 
    checked, 
    onChange, 
    disabled, 
    activeLabel, 
    inactiveLabel 
  }: { 
    checked: boolean; 
    onChange: (checked: boolean) => void; 
    disabled?: boolean; 
    activeLabel: string; 
    inactiveLabel: string; 
  }) => (
    <button
      data-testid="mock-toggle-switch"
      data-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
    >
      {checked ? activeLabel : inactiveLabel}
    </button>
  ),
}));

describe('StatusToggleCard', () => {
  const defaultProps = {
    isActive: true,
    onToggle: vi.fn(),
    activeLabel: 'Active',
    inactiveLabel: 'Inactive',
    statusLabel: 'Status',
  };

  it('renders correctly in active state with description', () => {
    const props = {
      ...defaultProps,
      description: 'Card is currently active',
    };
    render(<StatusToggleCard {...props} />);

    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Card is currently active')).toBeInTheDocument();
    
    const toggleBtn = screen.getByTestId('mock-toggle-switch');
    expect(toggleBtn).toBeInTheDocument();
    expect(toggleBtn).toHaveAttribute('data-checked', 'true');
    expect(toggleBtn).toHaveTextContent('Active');

    // Test text color classes for active state
    const statusLabel = screen.getByText('Status');
    expect(statusLabel).toHaveClass('text-slate-900');
    expect(statusLabel).toHaveClass('dark:text-white');
  });

  it('renders correctly in inactive state without description', () => {
    const props = {
      ...defaultProps,
      isActive: false,
    };
    render(<StatusToggleCard {...props} />);

    expect(screen.getByText('Status')).toBeInTheDocument();
    // When description is missing, it falls back to inactiveLabel since isActive is false
    expect(screen.getByText('Inactive', { selector: '.text-\\[11px\\]' })).toBeInTheDocument();

    const toggleBtn = screen.getByTestId('mock-toggle-switch');
    expect(toggleBtn).toBeInTheDocument();
    expect(toggleBtn).toHaveAttribute('data-checked', 'false');
    expect(toggleBtn).toHaveTextContent('Inactive');

    // Test text color classes for inactive state
    const statusLabel = screen.getByText('Status');
    expect(statusLabel).toHaveClass('text-slate-700');
    expect(statusLabel).toHaveClass('dark:text-slate-300');
  });

  it('renders correctly in active state without description', () => {
    const props = {
      ...defaultProps,
      isActive: true,
    };
    render(<StatusToggleCard {...props} />);

    expect(screen.getByText('Status')).toBeInTheDocument();
    // When description is missing, it falls back to activeLabel since isActive is true
    expect(screen.getByText('Active', { selector: '.text-\\[11px\\]' })).toBeInTheDocument();
  });

  it('calls onToggle when toggle is clicked', () => {
    const onToggleMock = vi.fn();
    const props = {
      ...defaultProps,
      onToggle: onToggleMock,
    };
    render(<StatusToggleCard {...props} />);

    const toggleBtn = screen.getByTestId('mock-toggle-switch');
    fireEvent.click(toggleBtn);
    expect(onToggleMock).toHaveBeenCalledWith(false);
  });

  it('applies disabled classes when disabled is true', () => {
    const props = {
      ...defaultProps,
      disabled: true,
    };
    const { container } = render(<StatusToggleCard {...props} />);

    // wrapper div is the first child of the container
    const wrapperDiv = container.firstChild as HTMLElement;
    expect(wrapperDiv).toHaveClass('opacity-60');
    expect(wrapperDiv).toHaveClass('pointer-events-none');

    const toggleBtn = screen.getByTestId('mock-toggle-switch');
    expect(toggleBtn).toBeDisabled();
  });

  it('applies custom className', () => {
    const props = {
      ...defaultProps,
      className: 'custom-card-class',
    };
    const { container } = render(<StatusToggleCard {...props} />);

    const wrapperDiv = container.firstChild as HTMLElement;
    expect(wrapperDiv).toHaveClass('custom-card-class');
  });
});
