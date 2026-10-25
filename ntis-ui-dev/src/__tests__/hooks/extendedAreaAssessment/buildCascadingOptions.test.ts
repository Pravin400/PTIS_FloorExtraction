import { describe, it, expect } from 'vitest';
import {
  buildWardOptions,
  buildWardPropertyOptions,
} from '@/hooks/extendedAreaAssessment/buildCascadingOptions';
import type { WardDropdownOption, WardPropertyOptionDto } from '@/app/[locale]/property-tax/extended-area-assesment/single-assessment/action';

const DROPDOWN_STRINGS: Record<string, string> = {
  'dropdowns.loadingWards': 'Loading Wards...',
  'dropdowns.selectWard': 'Select Ward...',
  'dropdowns.selectWardFirst': 'Select Ward first',
  'dropdowns.loadingProperties': 'Loading Properties...',
  'dropdowns.selectPropertyNo': 'Select Property No...',
  'dropdowns.selectPropertyNoFirst': 'Select Property No first',
};

const t = ((key: string) => DROPDOWN_STRINGS[key] ?? key) as unknown as Parameters<typeof buildWardOptions>[2];

describe('buildWardOptions', () => {
  it('prepends a "Select Ward..." placeholder and maps wards by wardNo', () => {
    const wards: WardDropdownOption[] = [
      { id: 1, wardNo: 'MM11', description: null },
      { id: 2, wardNo: 'MM12', description: null },
    ];
    const options = buildWardOptions(wards, false, t);
    expect(options[0]).toEqual({ label: 'Select Ward...', value: '' });
    expect(options).toHaveLength(3);
    expect(options[1]).toEqual({ label: 'MM11', value: '1' });
    expect(options[2]).toEqual({ label: 'MM12', value: '2' });
  });

  it('falls back to the ward id as the label when wardNo is missing', () => {
    const wards: WardDropdownOption[] = [{ id: 5, wardNo: '', description: null }];
    const options = buildWardOptions(wards, false, t);
    expect(options[1]).toEqual({ label: '5', value: '5' });
  });

  it('shows a loading placeholder while wards are loading', () => {
    const options = buildWardOptions([], true, t);
    expect(options[0].label).toBe('Loading Wards...');
  });
});

function buildItem(overrides: Partial<WardPropertyOptionDto> = {}): WardPropertyOptionDto {
  return {
    propertyId: 1,
    propertyNo: 'P1',
    partitionNo: null,
    upicId: 'U1',
    ...overrides,
  };
}

describe('buildWardPropertyOptions', () => {
  it('prompts to select a ward first when none is selected', () => {
    const options = buildWardPropertyOptions([], '', false, t);
    expect(options[0].label).toBe('Select Ward first');
  });

  it('shows a loading placeholder while properties are loading', () => {
    const options = buildWardPropertyOptions([], '1', true, t);
    expect(options[0].label).toBe('Loading Properties...');
  });

  it('labels a plain (non-partitioned) property by its propertyNo alone, bound by propertyId', () => {
    const items = [buildItem({ propertyId: 10, propertyNo: '1', partitionNo: null })];
    const options = buildWardPropertyOptions(items, '1', false, t);
    expect(options[0].label).toBe('Select Property No...');
    expect(options[1]).toEqual({ label: '1', value: '10' });
  });

  it('labels a partitioned property as "<propertyNo>-<partitionNo>", bound by its own propertyId', () => {
    const items = [
      buildItem({ propertyId: 21, propertyNo: '1', partitionNo: 'A' }),
      buildItem({ propertyId: 22, propertyNo: '1', partitionNo: 'A1' }),
    ];
    const options = buildWardPropertyOptions(items, '1', false, t);
    expect(options.slice(1)).toEqual([
      { label: '1-A', value: '21' },
      { label: '1-A1', value: '22' },
    ]);
  });
});
