import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterDropdown } from '@/components/modules/assets/asset-gis/sidebar/FilterDropdown';
import { MapPin } from 'lucide-react';

describe('Asset GIS FilterDropdown Component', () => {
  const mockOptions = [
    { id: 'all', label: 'All Zones' },
    { id: '1', label: 'Zone A (East)' },
    { id: '2', label: 'Zone B (West)' }
  ];

  const defaultProps = {
    label: 'Select Zone',
    icon: MapPin,
    options: mockOptions,
    selectedValue: 'all',
    onSelect: vi.fn(),
    isOpen: true,
    setIsOpen: vi.fn(),
    theme: { primary: '#3b82f6' }
  };

  it('renders dropdown label and all filter options when open', () => {
    render(<FilterDropdown {...defaultProps} />);
    expect(screen.getByText('Zone A (East)')).toBeInTheDocument();
    expect(screen.getByText('Zone B (West)')).toBeInTheDocument();
  });

  it('triggers onSelect with option id when an item is clicked', () => {
    const onSelectMock = vi.fn();
    render(<FilterDropdown {...defaultProps} onSelect={onSelectMock} />);
    
    const option = screen.getByText('Zone A (East)');
    fireEvent.click(option);
    
    expect(onSelectMock).toHaveBeenCalledWith('1');
  });
});
