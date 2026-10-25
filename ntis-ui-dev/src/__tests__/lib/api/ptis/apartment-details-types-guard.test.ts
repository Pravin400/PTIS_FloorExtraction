import { describe, it, expect } from 'vitest';
import { normalizeSurveyDetail } from '@/lib/api/ptis/apartment-details-types-guard';
import { parseApartmentItemNodes } from '@/hooks/property-tax/apartment/apartment-mappers';

describe('normalizeSurveyDetail — fields the screen reads', () => {
  it('keeps the OC number and the OC date', () => {
    const detail = normalizeSurveyDetail({ id: 1, ocNo: 'OC-101', ocDate: '2024-03-05T00:00:00' });

    expect(detail.ocNo).toBe('OC-101');
    expect(detail.ocDate).toBe('2024-03-05T00:00:00');
  });

  it('keeps the old assessment year of an old survey row (a number from the API becomes text)', () => {
    const detail = normalizeSurveyDetail({ id: 2, oldAssessmentYear: 2012 });

    expect(detail.oldAssessmentYear).toBe('2012');
  });

  it('keeps the old property type name and code', () => {
    const detail = normalizeSurveyDetail({ id: 3, oldPropertyTypeName: 'निवासी', oldPropertyTypeCode: 'R' });

    expect(detail.oldPropertyTypeName).toBe('निवासी');
    expect(detail.oldPropertyTypeCode).toBe('R');
  });

  it('gives null for all of them when the API sends nothing', () => {
    const detail = normalizeSurveyDetail({ id: 4 });

    expect(detail.ocNo).toBeNull();
    expect(detail.oldAssessmentYear).toBeNull();
    expect(detail.oldPropertyTypeName).toBeNull();
  });
});

describe('Existing Assessment (old survey) row — columns from PropertyMastOld / PropertyDetailsOld', () => {
  const oldUnit = (oldSurvey: Record<string, unknown>) =>
    parseApartmentItemNodes([{ newSurvey: { id: 9, propertyNo: '5' }, oldSurvey: { id: 77, propertyNo: '8071629', ...oldSurvey } }], 1).oldUnits[0];

  it('shows the assessment year and the old property type of the old property', () => {
    const unit = oldUnit({ oldAssessmentYear: 2012, oldPropertyTypeName: 'दुकान', oldPropertyTypeCode: 'C' });

    expect(unit.ayr).toBe('2012');
    expect(unit.type).toBe('दुकान');
  });

  it('shows the OC number (CSN) and the construction year of the old property', () => {
    const unit = oldUnit({ csn: 'CSN-55', constructionYear: '1995' });

    expect(unit.ocNo).toBe('CSN-55');
    expect(unit.cyr).toBe('1995');
  });

  it('shows dashes when the old property carries nothing', () => {
    const unit = oldUnit({});

    expect(unit.ayr).toBe('-');
    expect(unit.type).toBe('-');
  });
});
