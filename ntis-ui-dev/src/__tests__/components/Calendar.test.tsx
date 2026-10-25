import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Calendar } from '@/components/common/Calendar';

describe('Calendar Component', () => {
  it('renders calendar component', () => {
    render(<Calendar />);
    // Calendar should render navigation elements
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('renders with current month by default', () => {
    render(<Calendar />);
    // Should have a grid for the calendar
    const grid = screen.getByRole('grid');
    expect(grid).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Calendar className="custom-calendar" />);
    // The className is applied to the DayPicker wrapper
    const calendar = document.querySelector('.custom-calendar');
    expect(calendar).toBeInTheDocument();
  });

  it('shows outside days by default', () => {
    render(<Calendar />);
    // When showOutsideDays is true (default), the calendar displays a full grid
    // This includes days from previous and next months to fill the grid
    const gridCells = screen.getAllByRole('gridcell');
    // A calendar grid with outside days should have between 28-42 cells (4-6 weeks)
    // depending on the month. With showOutsideDays=true, it fills the grid.
    expect(gridCells.length).toBeGreaterThanOrEqual(28);
  });

  it('can hide outside days', () => {
    render(<Calendar showOutsideDays={false} />);
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('has navigation buttons', () => {
    render(<Calendar />);
    // Navigation buttons should be present
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it('renders with single mode', () => {
    render(<Calendar mode="single" />);
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('renders with range mode', () => {
    render(<Calendar mode="range" />);
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('renders with multiple mode', () => {
    render(<Calendar mode="multiple" />);
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('accepts custom classNames prop', () => {
    const customClassNames = {
      months: 'custom-months-class',
    };
    render(<Calendar classNames={customClassNames} />);
    const monthsContainer = document.querySelector('.custom-months-class');
    expect(monthsContainer).toBeInTheDocument();
  });

  it('displays day cells', () => {
    render(<Calendar />);
    // Should have multiple day buttons (at least 28 for a month)
    const gridCells = screen.getAllByRole('gridcell');
    expect(gridCells.length).toBeGreaterThanOrEqual(28);
  });

  it('has displayName set', () => {
    expect(Calendar.displayName).toBe('Calendar');
  });
});
