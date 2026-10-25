import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CommonPropertyTable from '@/components/modules/property-tax/ptis/appartmentQC/CommonPropertyTable';
import type { Column } from '@/components/common/MasterTable';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) => {
    if (key === 'apartmentTabs.showingData' && values) {
      return `Showing ${values.tab} data`;
    }
    if (key === 'searchPlaceholder') return 'Search properties...';
    return key;
  },
  useLocale: () => 'en',
}));

describe('CommonPropertyTable', () => {
  const mockProps = {
    columns: [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Name' }] as Column<{ id: string; name: string }>[],
    data: [{ id: '1', name: 'Prop 1' }, { id: '2', name: 'Prop 2' }],
    title: 'Property List',
    activeTab: 'residential',
    searchQuery: '',
    onSearchChange: vi.fn(),
    onRowClick: vi.fn(),
    isAutoScrolling: false,
    onToggleAutoScroll: vi.fn(),
  };

  it('renders title and active tab info', () => {
    render(<CommonPropertyTable {...mockProps} />);
    expect(screen.getByText('Property List')).toBeInTheDocument();
    expect(screen.getByText(/Showing residential data/)).toBeInTheDocument();
  });

  it('renders table headers and data', () => {
    render(<CommonPropertyTable {...mockProps} />);
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Prop 1')).toBeInTheDocument();
    expect(screen.getByText('Prop 2')).toBeInTheDocument();
  });

  it('calls onSearchChange when search input changes', () => {
    vi.useFakeTimers();
    render(<CommonPropertyTable {...mockProps} />);
    const searchInput = screen.getByPlaceholderText('Search properties...');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    vi.advanceTimersByTime(500);
    expect(mockProps.onSearchChange).toHaveBeenCalledWith('test');
    vi.useRealTimers();
  });
});
