import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { NewSurveyTableRow } from '@/components/modules/property-tax/ptis/apartment/tables/NewSurveyTableRow';
import { NewSurveyTableHeader } from '@/components/modules/property-tax/ptis/apartment/tables/NewSurveyTableHeader';
import { partitionKindOf } from '@/lib/utils/apartment-partition';
import { mapSurveyDetailToUnit } from '@/hooks/property-tax/apartment/apartment-mappers';
import type { AssessmentUnit, SurveyDetailDto } from '@/types/property-tax/apartment';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/property-tax/ptis/apartment',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ locale: 'en' }),
}));

vi.mock('@/components/common/Tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const unitOf = (detail: Partial<SurveyDetailDto>): AssessmentUnit =>
  mapSurveyDetailToUnit({ id: 1, propertyNo: '37', ...detail } as SurveyDetailDto, '1');

const renderRow = (unit: AssessmentUnit) =>
  render(
    <table>
      <tbody>
        <NewSurveyTableRow
          unit={unit}
          idx={0}
          isHovered={false}
          isExpanded={false}
          onHoverUnit={vi.fn()}
          onToggleExpandRow={vi.fn()}
          taxMode="rateable"
        />
      </tbody>
    </table>,
  );

describe('the partition and the flat of a survey row', () => {
  it('shows the partition as PROP NO and the flat in the next column', () => {
    renderRow(unitOf({ partitionNo: 'A1', flatOrShopNo: '1', wing: 'A' }));

    expect(screen.getByText('A1')).toBeInTheDocument();
    expect(screen.queryByText(/37/)).not.toBeInTheDocument();
    const cells = Array.from(document.querySelectorAll('tbody td'));
    const partitionCell = cells.findIndex((c) => c.textContent === 'A1');
    expect(cells[partitionCell + 1].textContent).toBe('1');
  });

  it('says "Wing: A" when the mouse is over the wing', () => {
    renderRow(unitOf({ partitionNo: 'A', wing: 'A' }));

    expect(screen.getByText('A')).toHaveAttribute('title', 'wingLabel: A');
  });

  it('says "Partition No: A1" when the mouse is over the partition of a unit', () => {
    renderRow(unitOf({ partitionNo: 'A1', flatOrShopNo: '1', wing: 'A' }));

    expect(screen.getByText('A1')).toHaveAttribute('title', 'partitionLabel: A1');
  });

  it('shows a dash when the row has no flat', () => {
    renderRow(unitOf({ partitionNo: 'A', wing: 'A' }));

    const cells = Array.from(document.querySelectorAll('tbody td'));
    const partitionCell = cells.findIndex((c) => c.textContent === 'A');
    expect(cells[partitionCell + 1].textContent).toBe('-');
  });

  it('falls back to the property number when there is no partition', () => {
    renderRow(unitOf({}));

    expect(screen.getByText('37')).toBeInTheDocument();
  });

  it('has a FLAT NO column right after PROP NO', () => {
    render(
      <table>
        <NewSurveyTableHeader taxMode="rateable" onSort={vi.fn()} />
      </table>,
    );

    const headers = screen.getAllByRole('columnheader').map((h) => h.textContent ?? '');
    const prop = headers.findIndex((h) => /propNo/.test(h));
    expect(prop).toBeGreaterThan(-1);
    expect(headers[prop + 1]).toMatch(/flatNo/);
  });
});

describe('partitionKindOf', () => {
  const kind = (partitionNo: string | undefined, flatNo: string | undefined, wing?: string) =>
    partitionKindOf({ partitionNo, flatNo, rawSurvey: wing ? ({ wing } as SurveyDetailDto) : undefined });

  it('is the wing when the partition is the name of its wing', () => {
    expect(kind('A', undefined, 'A')).toBe('wing');
    expect(kind('a', '1', 'Wing A')).toBe('wing');
  });

  it('is a partition when it differs from the wing', () => {
    expect(kind('A1', '1', 'A')).toBe('partition');
  });

  it('without a wing name, a row without a flat is the wing', () => {
    expect(kind('A', undefined)).toBe('wing');
    expect(kind('A1', '1')).toBe('partition');
  });

  it('is nothing without a partition', () => {
    expect(kind(undefined, '1', 'A')).toBeNull();
    expect(kind('', '1')).toBeNull();
  });
});
