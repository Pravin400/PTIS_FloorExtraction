import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { PtisRedesignWorkspace } from '@/components/modules/property-tax/ptis/apartment/workspace/PtisRedesignWorkspace';
import type { AssessmentUnit, UnitDifference, PtisRedesignCopy } from '@/types/property-tax/apartment';
import type { ApartmentSortState } from '@/lib/utils/apartment-sort';

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

const unit = (id: string, prop: string, tax: number): AssessmentUnit => ({
  id, prop, wgFl: '-', type: '-', cty: '-', ayr: '-', cyr: '-', use: '-', cpt: 0, cptDisplay: '-', bua: 0, buaDisplay: '-',
  ocNo: '-', occdt: '-', rntr: '-', rentDisplay: '-', appliedOn: '-', rateDisplay: '-', rate: 0, yrv: '-', depr: '-', alv: '-', mr: '-',
  rv: 0, rvDisplay: '-', tax, taxDisplay: `TAXTEXT-${prop}`, cv: 0, rttx: 0, pen: 0,
});

const diff = (unitId: string, taxDiff: number): UnitDifference => ({
  unitId, carpetDiff: 0, buaDiff: 0, rvDiff: 0, taxDiff, rtTaxDiff: 0,
});

const copy = { newSurveyTitle: 'NEW SURVEY', differenceEngineTitle: 'DIFFERENCE', existingAssessmentTitle: 'EXISTING' } as unknown as PtisRedesignCopy;
const ref = () => React.createRef<HTMLDivElement>();

function renderWorkspace(sortProps: { sort?: ApartmentSortState | null; onSort?: () => void; onClearSort?: () => void } = {}) {
  return render(
    <PtisRedesignWorkspace
      copy={copy}
      // The rows arrive in the order the API sorted them.
      surveyUnits={[unit('a', 'PROP-C', 300), unit('b', 'PROP-A', 100), unit('c', 'PROP-B', 200)]}
      previousUnits={[unit('a', 'OLD-C', 30), unit('b', 'OLD-A', 10), unit('c', 'OLD-B', 20)]}
      differences={[diff('a', -5), diff('b', 50), diff('c', 7)]}
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
      {...sortProps}
    />,
  );
}

const rowTexts = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('tbody tr')).map((tr) => tr.textContent ?? '');

describe('PtisRedesignWorkspace: the sort is made by the API', () => {
  it('shows the rows in the order they arrive, without sorting them again', () => {
    const { container } = renderWorkspace({ sort: { panel: 'survey', column: 'tax', direction: 'asc' } });
    const [survey, , existing] = Array.from(container.querySelectorAll('table')) as HTMLElement[];

    expect(rowTexts(survey).map((t) => t.match(/PROP-[ABC]/)?.[0])).toEqual(['PROP-C', 'PROP-A', 'PROP-B']);
    expect(rowTexts(existing).map((t) => t.match(/OLD-[ABC]/)?.[0])).toEqual(['OLD-C', 'OLD-A', 'OLD-B']);
  });

  it('asks for the sort of a New Survey column', () => {
    const onSort = vi.fn();
    const { container } = renderWorkspace({ onSort });
    const survey = container.querySelectorAll('table')[0] as HTMLElement;

    fireEvent.click(within(survey).getByRole('button', { name: /^tax$/i }));

    expect(onSort).toHaveBeenCalledWith('survey', 'tax');
  });

  it('asks for the sort of a Difference Engine column', () => {
    const onSort = vi.fn();
    const { container } = renderWorkspace({ onSort });
    const difference = container.querySelectorAll('table')[1] as HTMLElement;

    fireEvent.click(within(difference).getByRole('button', { name: /^totalTax$/i }));

    expect(onSort).toHaveBeenCalledWith('difference', 'tax');
  });

  it('marks the sorted column of the sorted table', () => {
    const { container } = renderWorkspace({ sort: { panel: 'survey', column: 'tax', direction: 'desc' }, onSort: vi.fn() });
    const survey = container.querySelectorAll('table')[0] as HTMLElement;

    expect(within(survey).getByRole('columnheader', { name: /^tax$/i })).toHaveAttribute('aria-sort', 'descending');
  });

  it('the reset button on # asks for the original order', () => {
    const onClearSort = vi.fn();
    const { container } = renderWorkspace({
      sort: { panel: 'survey', column: 'tax', direction: 'asc' }, onSort: vi.fn(), onClearSort,
    });
    const survey = container.querySelectorAll('table')[0] as HTMLElement;

    fireEvent.click(within(survey).getByRole('button', { name: 'resetSort' }));

    expect(onClearSort).toHaveBeenCalled();
  });
});

describe('screen', () => {
  it('renders the three tables', () => {
    renderWorkspace();
    expect(screen.getAllByRole('table')).toHaveLength(3);
  });
});
