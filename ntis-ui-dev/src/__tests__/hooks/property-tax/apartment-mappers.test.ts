import { describe, it, expect } from 'vitest';
import { parseApartmentItemNodes } from '@/hooks/property-tax/apartment/apartment-mappers';

describe('apartment-mappers — parseApartmentItemNodes property ID resolution', () => {
  it('correctly sets propertyId and oldPropertyId on both new and old units', () => {
    const rawItems = [
      {
        newSurvey: {
          id: 2078970,
          propertyNo: '116',
          carpetASqFt: 624,
          rateableValue: 3510,
          newTaxTotal: 10811,
        },
        oldSurvey: {
          id: 2565750,
          propertyNo: '8071629',
          carpetASqFt: 600,
          rateableValue: 69152,
          oldTotalTax: 72305,
          propertyMastOldId: 2565750,
        },
        difference: {
          carpetAreaSqFeetDiff: 24,
          totalTaxDiff: -61494,
        },
      },
    ];

    const { newUnits, oldUnits } = parseApartmentItemNodes(rawItems, 999);

    expect(newUnits).toHaveLength(1);
    expect(oldUnits).toHaveLength(1);

    const sUnit = newUnits[0];
    const pUnit = oldUnits[0];

    // sUnit receives the new property ID and the mapped old property ID
    expect(sUnit.propertyId).toBe(2078970);
    expect(sUnit.oldPropertyId).toBe(2565750);

    // pUnit receives the new property ID (used for mapped-old-properties API) and old property ID
    expect(pUnit.propertyId).toBe(2078970);
    expect(pUnit.oldPropertyId).toBe(2565750);
  });

  it('falls back to defaultPropertyId when newSurvey does not contain propertyId or id', () => {
    const rawItems = [
      {
        oldSurvey: {
          id: 2565750,
          oldPropertyId: 2565750,
        },
        difference: {},
      },
    ];

    const { newUnits, oldUnits } = parseApartmentItemNodes(rawItems, 456);

    expect(newUnits[0].propertyId).toBe(456);
    expect(pUnitResolved(oldUnits[0])).toBe(456);
    expect(oldUnits[0].oldPropertyId).toBe(2565750);
  });

  it('correctly includes partitionNo in prop string and sets partitionNo property', () => {
    const rawItems = [
      {
        newSurvey: {
          id: 101,
          propertyNo: '116',
          partitionNo: '1',
          flatOrShopNo: '202',
        },
        oldSurvey: {
          id: 102,
          propertyNo: '8071629',
          oldPartitionNo: '0',
          flatOrShopNo: '101',
        },
        difference: {},
      },
      {
        newSurvey: {
          id: 103,
          propertyNo: '116',
          partitionNo: '2',
        },
        oldSurvey: {
          id: 104,
          oldPropertyNo: '8071630',
        },
        difference: {},
      },
    ];

    const { newUnits, oldUnits } = parseApartmentItemNodes(rawItems);

    // The survey table shows the partition as PROP NO (the flat has its own column); the whole number stays in propFull
    expect(newUnits[0].prop).toBe('1');
    expect(newUnits[0].propFull).toBe('116 - 1 - 202');
    expect(newUnits[0].partitionNo).toBe('1');
    expect(newUnits[0].flatNo).toBe('202');

    // The old assessment keeps its own old property number: "8071629 - 0 - 101"
    expect(oldUnits[0].prop).toBe('8071629 - 0 - 101');
    expect(oldUnits[0].partitionNo).toBe('0');
    expect(oldUnits[0].flatNo).toBe('101');

    // With partition only
    expect(newUnits[1].prop).toBe('2');
    expect(newUnits[1].propFull).toBe('116 - 2');
    expect(newUnits[1].partitionNo).toBe('2');

    // Without partition: "8071630"
    expect(oldUnits[1].prop).toBe('8071630');
    expect(oldUnits[1].partitionNo).toBeUndefined();
  });

  it('correctly maps totalTax on oldSurvey to tax and taxDisplay', () => {
    const rawItems = [
      {
        newSurvey: {
          id: 1,
          capitalValue: 0,
          rateableValue: 28084.87,
          newTaxTotal: 25182.0,
          newTaxTotalCV: 0,
          newTaxTotalRV: 28084.87,
          retroTaxTotal: 31768.0,
          carpetASqMtr: 269.75,
          carpetASqFt: 4939.34,
          builtupASqMtr: 323.71,
          builtupASqFt: 3484.32,
        },
        oldSurvey: {
          rateableValue: 37557,
          capitalValue: null,
          totalTax: 35382,
          retroTaxTotal: null,
          csn: '16',
          constructionArea: 3530,
          builtupASqMtr: 3530,
          builtupASqFt: 37996.567,
        },
        difference: {
          carpetAreaSqMeterDiff: 269.75,
          carpetAreaSqFeetDiff: 4939.34,
          builtupAreaSqMeterDiff: -3206.29,
          builtupAreaSqFeetDiff: -34512.247,
          rateableValueDiff: -9472.13,
          capitalValueDiff: 0,
          totalTaxDiff: -10200.0,
          retroTaxDiff: 31768.0,
        },
      },
    ];

    const { newUnits, oldUnits, mappedDiffs } = parseApartmentItemNodes(rawItems);

    expect(newUnits[0].tax).toBe(25182);
    expect(newUnits[0].taxDisplay).toBe('₹25,182');
    expect(newUnits[0].rv).toBe(28084.87);

    expect(oldUnits[0].tax).toBe(35382);
    expect(oldUnits[0].taxDisplay).toBe('₹35,382');
    expect(oldUnits[0].rv).toBe(37557);
    expect(oldUnits[0].rvDisplay).toBe('37,557');

    expect(mappedDiffs[0].taxDiff).toBe(-10200);
  });
});

function pUnitResolved(unit: { propertyId?: number | null }) {
  return unit.propertyId;
}

describe('apartment-mappers — Type column is PropertyMast.Type', () => {
  const unitOf = (newSurvey: Record<string, unknown>) =>
    parseApartmentItemNodes([{ newSurvey: { id: 1, propertyNo: '132', ...newSurvey } }], 1).newUnits[0];

  it('shows the apartment / society Type of the unit, not the property type name', () => {
    const unit = unitOf({ apartmentType: '2', propertyTypeName: 'निवासी', partType: 'R' });
    expect(unit.type).toBe('2');
    expect(unit.typeFull).toBe('2 / निवासी');
  });

  it('shows a dash when the unit has no Type yet and keeps the property type name for the tooltip', () => {
    const unit = unitOf({ propertyTypeName: 'माहिती व तंत्रज्ञान उद्योग', partType: 'I' });
    expect(unit.type).toBe('-');
    expect(unit.typeFull).toBe('माहिती व तंत्रज्ञान उद्योग');
  });

  it('trims the Type', () => {
    expect(unitOf({ apartmentType: ' 5 ' }).type).toBe('5');
  });
});

describe('the BHK of the new survey has its own field; TYPE is only the type', () => {
  const unitsOf = (newSurvey: Record<string, unknown>, oldSurvey: Record<string, unknown> = { id: 9, oldPropertyNo: 'OLD-9' }) =>
    parseApartmentItemNodes([{ newSurvey: { id: 1, propertyNo: '37', ...newSurvey }, oldSurvey, difference: {} }]);

  it('TYPE is the type, the BHK is in its own field', () => {
    const { newUnits } = unitsOf({ apartmentType: 'R1', bhk: '2 BHK' });

    expect(newUnits[0].type).toBe('R1');
    expect(newUnits[0].bhk).toBe('2 BHK');
  });

  it('a unit without a type has a dash as TYPE, and keeps its BHK', () => {
    const { newUnits } = unitsOf({ bhk: '3 BHK' });

    expect(newUnits[0].type).toBe('-');
    expect(newUnits[0].bhk).toBe('3 BHK');
  });

  it('a unit without a BHK has none', () => {
    const { newUnits } = unitsOf({ apartmentType: 'C3' });

    expect(newUnits[0].type).toBe('C3');
    expect(newUnits[0].bhk).toBeUndefined();
  });

  it('ignores a blank BHK', () => {
    const { newUnits } = unitsOf({ apartmentType: 'R1', bhk: '   ' });

    expect(newUnits[0].bhk).toBeUndefined();
  });

  it('the hover text of TYPE does not carry the BHK', () => {
    const { newUnits } = unitsOf({ apartmentType: 'R1', propertyTypeName: 'Residential', bhk: '2 BHK' });

    expect(newUnits[0].typeFull).toBe('R1 / Residential');
  });

  it('maps the BHK of the existing assessment when present', () => {
    const { oldUnits } = unitsOf({ apartmentType: 'R1', bhk: '2 BHK' }, { id: 9, oldPropertyNo: 'OLD-9', oldPropertyTypeName: 'Residential', bhk: '3 BHK' });

    expect(oldUnits[0].type).toBe('Residential');
    expect(oldUnits[0].bhk).toBe('3 BHK');
  });
});
