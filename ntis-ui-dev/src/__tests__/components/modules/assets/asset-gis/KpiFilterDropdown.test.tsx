import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { KpiFilterDropdown } from '@/components/modules/assets/asset-gis/sidebar/KpiFilterDropdown';
import { Layers } from 'lucide-react';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('KpiFilterDropdown Component', () => {
  it('renders dropdown button with label and responds to open/close/selection', () => {
    const handleSelect = vi.fn();
    const handleSetIsOpen = vi.fn();
    const options = [
      { id: 'all', label: 'All Options' },
      { id: 'tax_pending', label: 'Tax Pending' },
    ];
    const colors = {
      accent: '#2563eb',
      bg: '#f8fafc',
      badge: '#dbeafe',
      badgeText: '#1e40af',
    };

    const { rerender } = render(
      <KpiFilterDropdown
        label="KPI Filter"
        icon={Layers}
        options={options}
        selectedValue="all"
        onSelect={handleSelect}
        isOpen={false}
        setIsOpen={handleSetIsOpen}
        colors={colors}
      />
    );

    expect(screen.getByText('All Options')).toBeInTheDocument();
    
    // Toggle button click
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(handleSetIsOpen).toHaveBeenCalledWith(true);

    // Rerender as open
    rerender(
      <KpiFilterDropdown
        label="KPI Filter"
        icon={Layers}
        options={options}
        selectedValue="all"
        onSelect={handleSelect}
        isOpen={true}
        setIsOpen={handleSetIsOpen}
        colors={colors}
      />
    );

    const optionItem = screen.getByText('Tax Pending');
    expect(optionItem).toBeInTheDocument();
    fireEvent.click(optionItem);
    expect(handleSelect).toHaveBeenCalledWith('tax_pending');
  });
});
