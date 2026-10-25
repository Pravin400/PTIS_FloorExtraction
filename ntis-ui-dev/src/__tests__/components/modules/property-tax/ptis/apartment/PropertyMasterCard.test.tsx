import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PropertyMasterCard } from '@/components/modules/property-tax/ptis/apartment/apartment-tabSection/PropertyMasterCard';
import type { PropertyMasterData } from '@/types/property-tax/apartment';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'header.propertyNo': 'PROPERTY NO.:',
      'header.upicId': 'UPIC ID:',
      'header.copyUpic': 'Copy UPIC',
      'header.societyName': 'SOCIETY NAME:',
      'header.editSociety': 'Edit Society',
      'header.hideMiddleSection': 'Hide Middle Section',
      'header.showMiddleSection': 'Show Middle Section (ON)',
      'header.hideManagementDetails': 'Hide Management Details',
      'header.showManagementDetails': 'Show Management Details (ON)',
      'grid.generalInfo': 'Location & Info',
      'grid.management': 'Management',
      'grid.managementDetails': 'Management Details',
      'grid.metrics': 'Address & Area',
      'grid.builderName': 'Builder Name:',
      'grid.secretaryName': 'Secretary Name:',
      'actions.hide': 'Hide',
      'revenueCard.addRevenue': 'ADD. REVENUE',
      'revenueCard.desc': 'DESC:',
      'media.noPhoto': 'No Photo',
    };
    return translations[key] || key;
  },
  useLocale: () => 'en',
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/en/property-tax/ptis/apartment',
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/hooks/property-tax/usePropertyTaxAutoSync', () => ({
  usePropertyTaxAutoSync: vi.fn(),
}));

describe('PropertyMasterCard - Middle Section Hide/Show functionality', () => {
  const mockData: PropertyMasterData = {
    propertyId: 101,
    wardNo: 'MM15',
    propertyNo: '37',
    upic: '2026MM1537228366',
    societyName: 'HIGHLAND PARK CO.-OP. HSG. SOC. LTD.',
    division: 'Majiwada-Manpada',
    plotNo: '-',
    taxZone: '-',
    builderName: 'Shree Developers',
    secretaryName: 'Dharmendr Yadav',
    totalWings: 8,
    performance: {
      thisAssessmentRevenue: '₹80,73,960',
    },
  };

  it('hides middle section by default, showing > open option', () => {
    render(<PropertyMasterCard data={mockData} />);

    // Header identifiers are visible
    expect(screen.getByText('MM15-37')).toBeInTheDocument();
    expect(screen.getByText('2026MM1537228366')).toBeInTheDocument();
    expect(screen.getByText('HIGHLAND PARK CO.-OP. HSG. SOC. LTD.')).toBeInTheDocument();

    // Top header only has Edit Society, no hide/show toggle buttons upside
    expect(screen.getByRole('button', { name: /Edit Society/i })).toBeInTheDocument();

    // Middle section values are hidden by default
    expect(screen.queryByText('Shree Developers')).not.toBeInTheDocument();
    expect(screen.queryByText('Dharmendr Yadav')).not.toBeInTheDocument();

    // Show button (> option) is visible
    const showBtns = screen.getAllByRole('button', {
      name: /Show Management Details|Show Middle Section/i,
    });
    expect(showBtns.length).toBeGreaterThanOrEqual(1);
  });

  it('expands middle section when > arrow button is clicked', () => {
    render(<PropertyMasterCard data={mockData} />);

    // Click Show (> option)
    const showBtns = screen.getAllByRole('button', {
      name: /Show Management Details|Show Middle Section/i,
    });
    fireEvent.click(showBtns[0]);

    // Middle section values are now visible
    expect(screen.getByText('Shree Developers')).toBeInTheDocument();
    expect(screen.getByText('Dharmendr Yadav')).toBeInTheDocument();

    // Hide buttons exist (chevron button on divider and hide button in header)
    const hideBtns = screen.getAllByRole('button', {
      name: /Hide Management Details|Hide Middle Section/i,
    });
    expect(hideBtns.length).toBeGreaterThanOrEqual(1);
  });

  it('collapses the middle section back when chevron hide button is clicked', () => {
    render(<PropertyMasterCard data={mockData} />);

    // Click Show (> option)
    const showBtns = screen.getAllByRole('button', {
      name: /Show Management Details|Show Middle Section/i,
    });
    fireEvent.click(showBtns[0]);
    expect(screen.getByText('Shree Developers')).toBeInTheDocument();

    // Click Hide
    const hideBtns = screen.getAllByRole('button', {
      name: /Hide Management Details|Hide Middle Section/i,
    });
    fireEvent.click(hideBtns[0]);

    // Middle section values are hidden again
    expect(screen.queryByText('Shree Developers')).not.toBeInTheDocument();
    expect(screen.queryByText('Dharmendr Yadav')).not.toBeInTheDocument();
  });

  it('honors controlled isMiddleSectionVisible and onToggleMiddleSection props if passed', () => {
    const handleToggle = vi.fn();
    const { rerender } = render(
      <PropertyMasterCard
        data={mockData}
        isMiddleSectionVisible={true}
        onToggleMiddleSection={handleToggle}
      />
    );

    const hideBtns = screen.getAllByRole('button', {
      name: /Hide Management Details|Hide Middle Section/i,
    });
    fireEvent.click(hideBtns[0]);
    expect(handleToggle).toHaveBeenCalledTimes(1);

    // Rerender with isMiddleSectionVisible = false
    rerender(
      <PropertyMasterCard
        data={mockData}
        isMiddleSectionVisible={false}
        onToggleMiddleSection={handleToggle}
      />
    );

    const showBtns = screen.getAllByRole('button', {
      name: /Show Management Details|Show Middle Section/i,
    });
    fireEvent.click(showBtns[0]);
    expect(handleToggle).toHaveBeenCalledTimes(2);
  });
});
