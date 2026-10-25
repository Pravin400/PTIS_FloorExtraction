import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NASummaryCards } from '@/components/modules/assets/municipal-Asset/NewAddNewAsset/components/NASummaryCards';
import enTranslations from '@/i18n/locales/en/newAddNewAsset.json';

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return path;
    }
  }
  return typeof current === 'string' ? current : path;
}

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    let text = getNestedValue(enTranslations, key);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  },
  useLocale: () => 'en',
}));

describe('NASummaryCards Component', () => {
  const mockSummary = {
    totalFloors: 3,
    totalUnits: 12,
    totalCarpetSqm: 450.75,
    totalBuiltupSqm: 620.5,
    capitalValue: 15000000,
  };

  it('renders all 5 metric cards with localized titles', () => {
    render(<NASummaryCards summary={mockSummary} />);

    expect(screen.getByText('Total Floors')).toBeInTheDocument();
    expect(screen.getByText('Total Rooms / Units')).toBeInTheDocument();
    expect(screen.getByText('Total Carpet Area')).toBeInTheDocument();
    expect(screen.getByText('Total Built-up Area')).toBeInTheDocument();
    expect(screen.getByText('Capital Value')).toBeInTheDocument();
  });

  it('formats metric values correctly from summary prop', () => {
    render(<NASummaryCards summary={mockSummary} />);

    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText(/450\.75 Sq\.m\./)).toBeInTheDocument();
    expect(screen.getByText(/620\.50 Sq\.m\./)).toBeInTheDocument();
    // 15,000,000 is 1.50 Cr
    expect(screen.getByText(/₹ 1\.50 Cr/)).toBeInTheDocument();
  });

  it('handles empty/zero values gracefully with dash placeholder', () => {
    const emptySummary = {
      totalFloors: 0,
      totalUnits: 0,
      totalCarpetSqm: 0,
      totalBuiltupSqm: 0,
      capitalValue: 0,
    };

    render(<NASummaryCards summary={emptySummary} />);

    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(4);
  });

  it('prioritizes cvRollup values when provided', () => {
    const cvRollup = {
      totalFloors: 5,
      totalUnits: 20,
      totalCarpetAreaSqMeter: 800,
      totalBuiltUpAreaSqMeter: 1000,
      totalCapitalValue: 250000, // 2.50 L
    };

    render(<NASummaryCards summary={mockSummary} cvRollup={cvRollup} />);

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText(/800\.00 Sq\.m\./)).toBeInTheDocument();
    expect(screen.getByText(/1,000\.00 Sq\.m\./)).toBeInTheDocument();
    expect(screen.getByText(/₹ 2\.50 L/)).toBeInTheDocument();
  });
});
