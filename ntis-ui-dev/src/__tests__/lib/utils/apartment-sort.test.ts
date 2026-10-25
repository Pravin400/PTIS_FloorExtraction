import { describe, it, expect } from 'vitest';
import {
  nextApartmentSort,
  sortDirectionOf,
  isApartmentColumnSortable,
  toSortQuery,
  sortFromQuery,
  type ApartmentSortState,
} from '@/lib/utils/apartment-sort';

describe('nextApartmentSort', () => {
  it('cycles ascending, descending, off for the same column', () => {
    const asc = nextApartmentSort(null, 'survey', 'tax');
    expect(asc).toEqual({ panel: 'survey', column: 'tax', direction: 'asc' });
    const desc = nextApartmentSort(asc, 'survey', 'tax');
    expect(desc?.direction).toBe('desc');
    expect(nextApartmentSort(desc, 'survey', 'tax')).toBeNull();
  });

  it('starts at ascending when another column (or another table) is clicked', () => {
    const current: ApartmentSortState = { panel: 'survey', column: 'tax', direction: 'desc' };
    expect(nextApartmentSort(current, 'survey', 'rv')).toEqual({ panel: 'survey', column: 'rv', direction: 'asc' });
    expect(nextApartmentSort(current, 'existing', 'tax')).toEqual({ panel: 'existing', column: 'tax', direction: 'asc' });
  });
});

describe('sortDirectionOf / isApartmentColumnSortable', () => {
  it('only the sorted column of the sorted table has a direction', () => {
    const sort: ApartmentSortState = { panel: 'difference', column: 'rv', direction: 'desc' };
    expect(sortDirectionOf(sort, 'difference', 'rv')).toBe('desc');
    expect(sortDirectionOf(sort, 'survey', 'rv')).toBeNull();
    expect(sortDirectionOf(sort, 'difference', 'tax')).toBeNull();
    expect(sortDirectionOf(null, 'survey', 'rv')).toBeNull();
  });

  it('knows the sortable columns of each table', () => {
    expect(isApartmentColumnSortable('survey', 'prop')).toBe(true);
    expect(isApartmentColumnSortable('existing', 'img')).toBe(true);
    expect(isApartmentColumnSortable('survey', 'rules')).toBe(false);
    expect(isApartmentColumnSortable('difference', 'rtTax')).toBe(true);
    expect(isApartmentColumnSortable('difference', 'prop')).toBe(false);
  });
});

describe('the sort as the API asks for it', () => {
  it('is sent as <table>:<column> with the direction', () => {
    expect(toSortQuery({ panel: 'survey', column: 'tax', direction: 'desc' })).toEqual({ sortBy: 'survey:tax', sortOrder: 'desc' });
    expect(toSortQuery({ panel: 'difference', column: 'rtTax', direction: 'asc' })).toEqual({ sortBy: 'difference:rtTax', sortOrder: 'asc' });
  });

  it('is nothing without a sort', () => {
    expect(toSortQuery(null)).toEqual({ sortBy: null, sortOrder: null });
  });

  it('is read back from the filters', () => {
    expect(sortFromQuery('existing:rv', 'desc')).toEqual({ panel: 'existing', column: 'rv', direction: 'desc' });
    expect(sortFromQuery('survey:prop', 'asc')).toEqual({ panel: 'survey', column: 'prop', direction: 'asc' });
    expect(sortFromQuery('survey:prop')).toEqual({ panel: 'survey', column: 'prop', direction: 'asc' });
  });

  it('is nothing for a value this screen does not know', () => {
    expect(sortFromQuery(null, 'asc')).toBeNull();
    expect(sortFromQuery('', 'asc')).toBeNull();
    expect(sortFromQuery('tax', 'asc')).toBeNull();
    expect(sortFromQuery('other:tax', 'asc')).toBeNull();
    expect(sortFromQuery('survey:rules', 'asc')).toBeNull();
    expect(sortFromQuery('difference:prop', 'asc')).toBeNull();
  });
});
