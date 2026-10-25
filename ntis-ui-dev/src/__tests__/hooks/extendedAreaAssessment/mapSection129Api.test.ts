import { describe, it, expect } from 'vitest';
import { extractYear, emptyForm, emptyResult, mapApiToUi } from '@/hooks/extendedAreaAssessment/mapSection129Api';
import type { Section129ScheduleApi } from '@/types/section129.types';

function buildApiFixture(overrides: Partial<Section129ScheduleApi> = {}): Section129ScheduleApi {
  return {
    propertyId: 549439,
    wardId: 1,
    baseTaxCode: 'General Tax',
    currentFinancialYear: '2026-27',
    upic: 'MM1100150000',
    oldGpNo: 'MM11001000',
    ownerName: 'The Holder',
    address: 'Sai Krupa Chawl',
    useType: 'Residential',
    zone: 'Ward MM11',
    isApplied: true,
    assessmentYear: '2024',
    appliedDate: '2026-09-29T00:00:00',
    areaInclusionDate: '2025-01-01T00:00:00',
    ocDate: '2025-02-01T00:00:00',
    useOcDateBasis: true,
    oldTax: 1240,
    fullGeneralTax: 1963,
    taxableValue: 2394,
    generalTaxRate: 0,
    areaChanged: false,
    useChanged: false,
    otherStructuralChange: false,
    otherStructuralChangeEffectiveDate: null,
    changeDetailsRemark: null,
    caseStatus: 'Calculated',
    remarks: null,
    rows: [
      {
        srNo: 1,
        financeYearId: 37,
        financialYear: '2026-27',
        stage: 'Section 129 - 60 Percent',
        municipalPct: 60,
        stageTax: 1177.8,
        oldGpTax: 1240,
        applicableTax: 1240,
        totalDemand: 1240,
        differenceFrom100: 723,
        ruleApplied: 'Which is More: Old GP Tax',
        status: 'Current',
      },
      {
        srNo: 2,
        financeYearId: 38,
        financialYear: '2027-28',
        stage: 'Section 129 - 80 Percent',
        municipalPct: 80,
        stageTax: 1570.4,
        oldGpTax: 1240,
        applicableTax: 1570.4,
        totalDemand: 1570.4,
        differenceFrom100: 392.6,
        ruleApplied: 'Which is More: Municipal Stage Tax',
        status: 'Future',
      },
    ],
    stages: [
      { code: 'SECTION_129_60', displayName: '60%', subtitle: 'Fifth year', percentage: 60, isCurrent: true, isCompleted: false },
    ],
    recalculateBlockedReason: null,
    ...overrides,
  };
}

describe('extractYear', () => {
  it('extracts a 4-digit year from a plain year string', () => {
    expect(extractYear('2020')).toBe(2020);
  });

  it('extracts the first 4-digit year from a range like "2020-21"', () => {
    expect(extractYear('2020-21')).toBe(2020);
  });

  it('returns null for null/undefined/empty input', () => {
    expect(extractYear(null)).toBeNull();
    expect(extractYear(undefined)).toBeNull();
    expect(extractYear('')).toBeNull();
  });

  it('returns null when no 4-digit year is present', () => {
    expect(extractYear('abc')).toBeNull();
    expect(extractYear('99')).toBeNull();
  });
});

describe('emptyForm', () => {
  it('returns a blank form with Draft case status and "no" change flags', () => {
    const form = emptyForm();
    expect(form.upic).toBe('');
    expect(form.oldGpNo).toBe('');
    expect(form.caseStatus).toBe('Draft');
    expect(form.areaChanged).toBe('no');
    expect(form.useChanged).toBe('no');
    expect(form.otherChanged).toBe('no');
    expect(form.oldTax).toBe(0);
    expect(form.fullGeneral).toBe(0);
  });

  it('returns a fresh object on every call (no shared mutable state)', () => {
    const a = emptyForm();
    const b = emptyForm();
    a.upic = 'MUTATED';
    expect(b.upic).toBe('');
  });
});

describe('emptyResult', () => {
  it('seeds currentFy from the given value and zeroes every numeric field', () => {
    const result = emptyResult('2026-27');
    expect(result.currentFy).toBe('2026-27');
    expect(result.rows).toEqual([]);
    expect(result.currentPct).toBe(0);
    expect(result.applicableGeneralTax).toBe(0);
    expect(result.totalDemand).toBe(0);
    expect(result.sumApplicable).toBe(0);
    expect(result.sumTotalDemand).toBe(0);
  });
});

describe('mapApiToUi', () => {
  it('maps header fields onto the form, slicing dates down to YYYY-MM-DD', () => {
    const { form } = mapApiToUi(buildApiFixture());
    expect(form.upic).toBe('MM1100150000');
    expect(form.oldGpNo).toBe('MM11001000');
    expect(form.ownerName).toBe('The Holder');
    expect(form.inclusionDate).toBe('2025-01-01');
    expect(form.ocDate).toBe('2025-02-01');
    expect(form.useOcDateBasis).toBe(true);
    expect(form.oldTax).toBe(1240);
    expect(form.fullGeneral).toBe(1963);
  });

  it('maps areaChanged/useChanged/otherStructuralChange booleans to "yes"/"no"', () => {
    const { form } = mapApiToUi(buildApiFixture({ areaChanged: true, useChanged: false, otherStructuralChange: true }));
    expect(form.areaChanged).toBe('yes');
    expect(form.useChanged).toBe('no');
    expect(form.otherChanged).toBe('yes');
  });

  it('maps caseStatus via CASE_STATUS_MAP, defaulting unknown values to Draft', () => {
    expect(mapApiToUi(buildApiFixture({ caseStatus: 'NotApplied' })).form.caseStatus).toBe('Draft');
    expect(mapApiToUi(buildApiFixture({ caseStatus: 'Applied' })).form.caseStatus).toBe('Calculated');
    expect(mapApiToUi(buildApiFixture({ caseStatus: 'Calculated' })).form.caseStatus).toBe('Calculated');
    expect(mapApiToUi(buildApiFixture({ caseStatus: 'SomethingUnknown' })).form.caseStatus).toBe('Draft');
  });

  it('falls back oldGpNo to empty string when the API returns null', () => {
    const { form } = mapApiToUi(buildApiFixture({ oldGpNo: null }));
    expect(form.oldGpNo).toBe('');
  });

  it('picks the row with status "Current" as the current row for KPI figures', () => {
    const { result } = mapApiToUi(buildApiFixture());
    expect(result.stageLabel).toBe('Section 129 - 60 Percent');
    expect(result.applicableGeneralTax).toBe(1240);
    expect(result.totalDemand).toBe(1240);
    expect(result.ruleLabel).toBe('Which is More: Old GP Tax');
  });

  it('falls back to the last row when no row has status "Current"', () => {
    const api = buildApiFixture({
      rows: [
        {
          srNo: 1,
          financeYearId: 37,
          financialYear: '2026-27',
          stage: 'Section 129 - 100 Percent',
          municipalPct: 100,
          stageTax: 1963,
          oldGpTax: 1240,
          applicableTax: 1963,
          totalDemand: 1963,
          differenceFrom100: 0,
          ruleApplied: 'Which is More: Municipal Stage Tax',
          status: 'Completed',
        },
      ],
    });
    const { result } = mapApiToUi(api);
    expect(result.stageLabel).toBe('Section 129 - 100 Percent');
    expect(result.applicableGeneralTax).toBe(1963);
  });

  it('sums applicableTax and totalDemand across every row', () => {
    const { result } = mapApiToUi(buildApiFixture());
    expect(result.sumApplicable).toBe(1240 + 1570.4);
    expect(result.sumTotalDemand).toBe(1240 + 1570.4);
  });

  it('formats municipalPctLabel as "N%" or "—" when null', () => {
    const api = buildApiFixture({
      rows: [
        {
          srNo: 1,
          financeYearId: 3,
          financialYear: '2024-25',
          stage: 'Section 129 - Old Tax Year 1',
          municipalPct: null,
          stageTax: 0,
          oldGpTax: 1240,
          applicableTax: 1240,
          totalDemand: 1240,
          differenceFrom100: 723,
          ruleApplied: 'Old GP Tax',
          status: 'Completed',
        },
      ],
    });
    const { result } = mapApiToUi(api);
    expect(result.rows[0].municipalPctLabel).toBe('—');
  });

  it('defaults totalDemand to fullGeneralTax when there are no rows at all', () => {
    const { result } = mapApiToUi(buildApiFixture({ rows: [] }));
    expect(result.rows).toEqual([]);
    expect(result.totalDemand).toBe(1963);
    expect(result.currentFy).toBe('2026-27');
  });

  it('defaults baseTaxCode to "General Tax" when the API omits it', () => {
    const { result } = mapApiToUi(buildApiFixture({ baseTaxCode: undefined }));
    expect(result.baseTaxCode).toBe('General Tax');
  });

  it('passes through the stages array unchanged', () => {
    const { result } = mapApiToUi(buildApiFixture());
    expect(result.stages).toEqual([
      { code: 'SECTION_129_60', displayName: '60%', subtitle: 'Fifth year', percentage: 60, isCurrent: true, isCompleted: false },
    ]);
  });
});
