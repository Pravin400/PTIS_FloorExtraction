/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DashboardFilters } from '@/components/modules/assets/dashboard/DashboardFilter';

// Mock Lucide icons
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    MapPin: () => <span data-testid="icon-MapPin" />
  };
});

// Mock SearchSelect as a simple select to make testing easier
vi.mock('@/components/common/SearchSelect', () => ({
  SearchSelect: ({ id, name, placeholder, options, value, onChange }: any) => (
    <select 
      data-testid={`select-${name}`} 
      id={id} 
      value={value} 
      onChange={(e) => onChange(null, e.target.value)}
    >
      <option value="">{placeholder}</option>
      {options.map((opt: any) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )
}));

describe('DashboardFilters', () => {
  const defaultProps = {
    zonesList: ['all', 'North', 'South'],
    wardsList: ['all', 'Ward A', 'Ward B'],
    activeZone: 'all',
    activeWard: 'all',
    onZoneChange: vi.fn(),
    onWardChange: vi.fn(),
    allZonesLabel: 'All Zones',
    allWardsLabel: 'All Wards',
    filtersLabel: 'Filters'
  };

  it('should render the filter labels and current selected Zone and Ward', () => {
    render(<DashboardFilters {...defaultProps} />);

    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByTestId('icon-MapPin')).toBeInTheDocument();

    const zoneSelect = screen.getByTestId('select-zone');
    const wardSelect = screen.getByTestId('select-ward');

    expect(zoneSelect).toHaveValue('all');
    expect(wardSelect).toHaveValue('all');
  });

  it('should trigger onZoneChange callback when selecting a new zone', () => {
    const onZoneChange = vi.fn();
    render(<DashboardFilters {...defaultProps} onZoneChange={onZoneChange} />);

    const zoneSelect = screen.getByTestId('select-zone');
    
    act(() => {
      fireEvent.change(zoneSelect, { target: { value: 'North' } });
    });

    expect(onZoneChange).toHaveBeenCalledWith('North');
  });

  it('should trigger onWardChange callback when selecting a new ward', () => {
    const onWardChange = vi.fn();
    render(<DashboardFilters {...defaultProps} onWardChange={onWardChange} />);

    const wardSelect = screen.getByTestId('select-ward');
    
    act(() => {
      fireEvent.change(wardSelect, { target: { value: 'Ward B' } });
    });

    expect(onWardChange).toHaveBeenCalledWith('Ward B');
  });
});
