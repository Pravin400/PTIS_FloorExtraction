import { render, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { PtisRedesignWorkspace } from '@/components/modules/property-tax/ptis/apartment/workspace/PtisRedesignWorkspace';
import { ROW_TINT_TEXT_CLASS } from '@/lib/utils/apartment-row-tint';
import type { AssessmentUnit, UnitDifference, PtisRedesignCopy } from '@/types/property-tax/apartment';

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

vi.mock('@/components/modules/property-tax/ptis/media/ImageWithFallback', () => ({
  ImageWithFallback: () => null,
}));

const unit = (id: string, prop: string, type: string, bhk?: string): AssessmentUnit => ({
  id, prop, bhk, wgFl: '-', type, cty: '-', ayr: '-', cyr: '-', use: '-', cpt: 0, cptDisplay: '-', bua: 0, buaDisplay: '-',
  ocNo: '-', occdt: '-', rntr: '-', rentDisplay: '-', appliedOn: '-', rateDisplay: '-', rate: 0, yrv: '-', depr: '-', alv: '-', mr: '-',
  rv: 0, rvDisplay: '-', tax: 0, taxDisplay: '-', cv: 0, rttx: 0, pen: 0,
});

const diff = (unitId: string): UnitDifference => ({ unitId, carpetDiff: 0, buaDiff: 0, rvDiff: 0, taxDiff: 0, rtTaxDiff: 0 });

const copy = { newSurveyTitle: 'NEW SURVEY', differenceEngineTitle: 'DIFFERENCE', existingAssessmentTitle: 'EXISTING' } as unknown as PtisRedesignCopy;
const ref = () => React.createRef<HTMLDivElement>();

// New survey units: a, b have the same type (R1, different BHK), c is another type, d has no type but a BHK, e has no type and the same BHK as d,
// f has no type and another BHK, g has neither. The old units have their own (old) type text.
const survey = [
  unit('a', 'PROP-A', 'R1', '2 BHK'),
  unit('b', 'PROP-B', 'R1', '3 BHK'),
  unit('c', 'PROP-C', 'C3', '1 BHK'),
  unit('d', 'PROP-D', '-', '2 BHK'),
  unit('e', 'PROP-E', '-', '2 BHK'),
  unit('f', 'PROP-F', '-', '3 BHK'),
  unit('g', 'PROP-G', '-'),
];
const previous = survey.map((u) => unit(u.id, `OLD-${u.id.toUpperCase()}`, 'Residential'));

function renderWorkspace(props: Partial<React.ComponentProps<typeof PtisRedesignWorkspace>> = {}) {
  return render(
    <PtisRedesignWorkspace
      copy={copy}
      surveyUnits={survey}
      previousUnits={previous}
      differences={survey.map((u) => diff(u.id))}
      totalDeltas={{ carpetDelta: 0, buaDelta: 0, rvDelta: 0, taxDelta: 0, rtTaxDelta: 0 }}
      hoveredUnitId={null}
      expandedUnitIds={[]}
      hiddenPanels={[]}
      expandedPanel={null}
      panelWidthPercent={33}
      onHoverUnit={vi.fn()}
      onToggleExpandRow={vi.fn()}
      onEditUnit={vi.fn()}
      onToggleHidePanel={vi.fn()}
      onToggleExpandPanel={vi.fn()}
      surveyScrollRef={ref()}
      differenceScrollRef={ref()}
      existingScrollRef={ref()}
      onSyncScroll={vi.fn()}
      taxMode="rateable"
      {...props}
    />,
  );
}

const rowsOf = (table: HTMLElement) => Array.from(table.querySelectorAll('tbody > tr')) as HTMLElement[];
const tintOf = (row: HTMLElement) => row.style.getPropertyValue('--row-tint') || undefined;

describe('the data of the rows is coloured by the type, else by the BHK, every different one in its own colour', () => {
  it('colours a row of the new survey by its type; units of the same type share a colour whatever their BHK', () => {
    const { container } = renderWorkspace();
    const [surveyTable] = Array.from(container.querySelectorAll('table')) as HTMLElement[];
    const rows = rowsOf(surveyTable);

    expect(tintOf(rows[0])).toBeDefined();
    expect(tintOf(rows[1])).toBe(tintOf(rows[0]));   // R1 / 2 BHK and R1 / 3 BHK: the type decides
    expect(tintOf(rows[2])).not.toBe(tintOf(rows[0]));
  });

  it('colours a unit without a type by its BHK, and every different BHK differently', () => {
    const { container } = renderWorkspace();
    const [surveyTable] = Array.from(container.querySelectorAll('table')) as HTMLElement[];
    const rows = rowsOf(surveyTable);

    expect(tintOf(rows[3])).toBeDefined();           // d: no type, 2 BHK
    expect(tintOf(rows[4])).toBe(tintOf(rows[3]));   // e: the same BHK, the same colour
    expect(tintOf(rows[5])).not.toBe(tintOf(rows[3])); // f: 3 BHK, another colour
  });

  it('never uses a colour twice for different types / BHKs', () => {
    const { container } = renderWorkspace();
    const [surveyTable] = Array.from(container.querySelectorAll('table')) as HTMLElement[];
    const rows = rowsOf(surveyTable);

    // R1, C3, 2 BHK (no type), 3 BHK (no type): four different keys, four different colours
    const colours = [rows[0], rows[2], rows[3], rows[5]].map(tintOf);
    expect(new Set(colours).size).toBe(4);
  });

  it('has no colour for a unit with neither a type nor a BHK', () => {
    const { container } = renderWorkspace();
    const [surveyTable] = Array.from(container.querySelectorAll('table')) as HTMLElement[];

    expect(tintOf(rowsOf(surveyTable)[6])).toBeUndefined();
    expect(rowsOf(surveyTable)[6].className).not.toContain(ROW_TINT_TEXT_CLASS);
  });

  it('applies the colour to the TEXT of the cells of the row, not to the background', () => {
    const { container } = renderWorkspace();
    const [surveyTable] = Array.from(container.querySelectorAll('table')) as HTMLElement[];
    const row = rowsOf(surveyTable)[0];

    expect(row.className).toContain(ROW_TINT_TEXT_CLASS);            // [&>td]:!text-[color:var(--row-tint)]
    expect(row.className).not.toContain('bg-[var(--row-tint');         // no background colour from the type
    expect((row.querySelector('td') as HTMLElement).className).toContain('bg-white');   // the sticky cell stays white as before
  });

  it('colours the existing assessment too, by the type of the NEW survey row of the same unit', () => {
    const { container } = renderWorkspace();
    const [surveyTable, , existingTable] = Array.from(container.querySelectorAll('table')) as HTMLElement[];

    expect(rowsOf(existingTable).map(tintOf)).toEqual(rowsOf(surveyTable).map(tintOf));
  });

  it('does NOT colour the difference table by type wise (removes type-wise tint in difference table only)', () => {
    const { container } = renderWorkspace();
    const [, differenceTable] = Array.from(container.querySelectorAll('table')) as HTMLElement[];

    expect(rowsOf(differenceTable).map(tintOf)).toEqual(rowsOf(differenceTable).map(() => undefined));
  });

  it('colours the new survey and existing assessment tables by type/BHK, while difference table remains untinted', () => {
    const { container } = renderWorkspace();
    const [surveyTable, differenceTable, existingTable] = Array.from(container.querySelectorAll('table')) as HTMLElement[];

    const surveyTints = rowsOf(surveyTable).map(tintOf);
    expect(rowsOf(existingTable).map(tintOf)).toEqual(surveyTints);
    expect(rowsOf(differenceTable).map(tintOf)).toEqual(surveyTints.map(() => undefined));
  });

  it('includes font-semibold in the row tint text class for slightly bold records data', () => {
    expect(ROW_TINT_TEXT_CLASS).toContain('font-semibold');
  });

  it('shows the same colours when the property is shown again (refresh) or its rows come in another order (sort)', () => {
    const first = renderWorkspace();
    const [surveyBefore] = Array.from(first.container.querySelectorAll('table')) as HTMLElement[];
    const byUnit = (table: HTMLElement, units: AssessmentUnit[]) =>
      Object.fromEntries(rowsOf(table).map((row, i) => [units[i].id, tintOf(row)]));
    const before = byUnit(surveyBefore, survey);
    first.unmount();

    const reversed = [...survey].reverse();
    const second = renderWorkspace({ surveyUnits: reversed, previousUnits: [...previous].reverse(), differences: reversed.map((u) => diff(u.id)) });
    const [surveyAfter] = Array.from(second.container.querySelectorAll('table')) as HTMLElement[];

    expect(byUnit(surveyAfter, reversed)).toEqual(before);
  });
});

describe('PROP NO and FLAT NO of the new survey have a vertical line', () => {
  it('draws a line after the PROP NO and after the FLAT NO, in the header and in every row', () => {
    const { container } = renderWorkspace();
    const [surveyTable] = Array.from(container.querySelectorAll('table')) as HTMLElement[];
    const headers = Array.from(surveyTable.querySelectorAll('thead th')) as HTMLElement[];
    const propIndex = headers.findIndex((h) => /propNo/.test(h.textContent ?? ''));
    const flatIndex = headers.findIndex((h) => /flatNo/.test(h.textContent ?? ''));

    expect(flatIndex).toBe(propIndex + 1);
    expect(headers[propIndex].className).toContain('border-r');
    expect(headers[flatIndex].className).toContain('border-r');
    for (const row of rowsOf(surveyTable)) {
      const cells = Array.from(row.querySelectorAll('td')) as HTMLElement[];
      expect(cells[propIndex].className).toContain('border-r');
      expect(cells[flatIndex].className).toContain('border-r');
    }
  });
});

describe('the BHK column of the new survey and existing assessment tables', () => {
  it('is right after TYPE and shows the BHK of each unit in new survey', () => {
    const { container } = renderWorkspace();
    const [surveyTable] = Array.from(container.querySelectorAll('table')) as HTMLElement[];
    const headers = Array.from(surveyTable.querySelectorAll('thead th')).map((h) => h.textContent ?? '');
    const typeIndex = headers.findIndex((h) => /^type$/i.test(h.trim()));

    expect(typeIndex).toBeGreaterThan(-1);
    expect(headers[typeIndex + 1]).toMatch(/bhk/i);

    const cells = (i: number) => Array.from(rowsOf(surveyTable)[i].querySelectorAll('td')).map((c) => c.textContent ?? '');
    expect(cells(0)[typeIndex]).toBe('R1');
    expect(cells(0)[typeIndex + 1]).toBe('2 BHK');
    expect(cells(3)[typeIndex]).toBe('-');
    expect(cells(3)[typeIndex + 1]).toBe('2 BHK');
    expect(cells(6)[typeIndex + 1]).toBe('-');
  });

  it('is right after TYPE in existing assessment table', () => {
    const { container } = renderWorkspace();
    const [, , existingTable] = Array.from(container.querySelectorAll('table')) as HTMLElement[];
    const headers = Array.from(existingTable.querySelectorAll('thead th')).map((h) => h.textContent ?? '');
    const typeIndex = headers.findIndex((h) => /^type$/i.test(h.trim()));

    expect(typeIndex).toBeGreaterThan(-1);
    expect(headers[typeIndex + 1]).toMatch(/bhk/i);
  });
});

describe('the combined CARPET (FT/M) and BUA (FT/MT) columns in difference engine table', () => {
  it('combines carpet and bua columns and omits sq.ft/sq.mt from values', () => {
    const { container } = renderWorkspace();
    const [, differenceTable] = Array.from(container.querySelectorAll('table')) as HTMLElement[];
    const headers = Array.from(differenceTable.querySelectorAll('thead th')).map((h) => h.textContent ?? '');

    expect(headers[0]).toMatch(/carpet/i);
    expect(headers[0]).not.toMatch(/sq\.ft/i);
    expect(headers[1]).toMatch(/bua/i);
    expect(headers[1]).not.toMatch(/sq\.ft/i);

    const firstRowCells = Array.from(rowsOf(differenceTable)[0].querySelectorAll('td')).map((c) => c.textContent ?? '');
    expect(firstRowCells[0]).not.toMatch(/sq\.ft|sq\.mt/i);
    expect(firstRowCells[1]).not.toMatch(/sq\.ft|sq\.mt/i);
    expect(firstRowCells[0]).toBe('0 / 0');
    expect(firstRowCells[1]).toBe('0 / 0');
  });
});

describe('sorting by TYPE, PROP NO, FLAT NO and BHK (ascending, descending, off)', () => {
  const columnOf: Record<string, string> = { propNo: 'prop', flatNo: 'flat', type: 'type', bhk: 'bhk' };

  it.each(['propNo', 'flatNo', 'type', 'bhk'])('a click on the %s header asks for that column', (label) => {
    const onSort = vi.fn();
    const { container } = renderWorkspace({ onSort });
    const [surveyTable] = Array.from(container.querySelectorAll('table')) as HTMLElement[];

    fireEvent.click(within(surveyTable).getByRole('button', { name: new RegExp('^' + label + '$', 'i') }));

    expect(onSort).toHaveBeenCalledWith('survey', columnOf[label]);
  });

  it('marks the sorted column ascending and descending', () => {
    const asc = renderWorkspace({ onSort: vi.fn(), sort: { panel: 'survey', column: 'type', direction: 'asc' } });
    expect(within(asc.container.querySelectorAll('table')[0] as HTMLElement).getByRole('columnheader', { name: /^type$/i })).toHaveAttribute('aria-sort', 'ascending');
    asc.unmount();

    const desc = renderWorkspace({ onSort: vi.fn(), sort: { panel: 'survey', column: 'prop', direction: 'desc' } });
    expect(within(desc.container.querySelectorAll('table')[0] as HTMLElement).getByRole('columnheader', { name: /^propNo$/i })).toHaveAttribute('aria-sort', 'descending');
  });
});
