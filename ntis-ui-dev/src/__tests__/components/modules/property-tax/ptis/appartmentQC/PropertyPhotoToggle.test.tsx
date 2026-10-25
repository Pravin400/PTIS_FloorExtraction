import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PropertyPhotoToggle } from '@/components/modules/property-tax/ptis/appartmentQC/appartmentQCDrawer/FloorSubmissionDrawer/PropertyPhotoToggle';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    if (key === 'drawer.viewImage') return 'View Image';
    return key;
  },
}));

describe('PropertyPhotoToggle', () => {
  const mockOnClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the toggle button', () => {
    render(<PropertyPhotoToggle onClick={mockOnClick} />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', 'View Image');
  });

  it('calls onClick when clicked without dragging', () => {
    render(<PropertyPhotoToggle onClick={mockOnClick} />);
    const button = screen.getByRole('button');

    fireEvent.mouseDown(button, { button: 0, clientY: 100 });
    fireEvent.mouseUp(button);
    fireEvent.click(button);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick after dragging', () => {
    render(<PropertyPhotoToggle onClick={mockOnClick} />);
    const button = screen.getByRole('button');

    // Simulate a drag
    fireEvent.mouseDown(button, { button: 0, clientY: 100 });
    fireEvent.mouseMove(document.body, { clientY: 200 });
    fireEvent.mouseUp(document.body);
    fireEvent.click(button);

    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('handles touch start event', () => {
    render(<PropertyPhotoToggle onClick={mockOnClick} />);
    const button = screen.getByRole('button');

    fireEvent.touchStart(button, { touches: [{ clientY: 100 }] });
    expect(true).toBe(true); // Test just verifies no errors
  });
});
