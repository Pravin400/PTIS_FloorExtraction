/**
 * Sorting of the three apartment comparison tables (New Survey, Difference Engine, Existing Assessment).
 *
 * The three tables are rows of the same units, side by side: the scroll, the hover and the expanded row are matched
 * per unit. So there is ONE sort for all three: the column that was clicked decides the order of the units, and
 * every table shows its row of that unit in that order.
 *
 * The order is made by the API (`SortBy=<panel>:<column>&SortOrder=asc|desc`) over ALL the units of the wing, not only
 * the pages that are loaded. The column names below are the ones the API's ApartmentComparisonSorter knows.
 */
export type ApartmentSortPanel = 'survey' | 'difference' | 'existing';
export type ApartmentSortDirection = 'asc' | 'desc';

export interface ApartmentSortState {
  panel: ApartmentSortPanel;
  column: string;
  direction: ApartmentSortDirection;
}

/** Columns of the New Survey and Existing Assessment tables that can be sorted. */
const UNIT_COLUMNS: readonly string[] = [
  'prop', 'flat', 'wgFl', 'type', 'bhk', 'cty', 'ayr', 'cyr', 'use', 'cpt', 'bua', 'ocNo', 'ocDate',
  'renter', 'rent', 'alv', 'rv', 'cv', 'tax', 'img', 'plan',
];

/** Columns of the Difference Engine table that can be sorted. */
const DIFFERENCE_COLUMNS: readonly string[] = ['carpetFt', 'carpet', 'carpetMtr', 'buaFt', 'bua', 'buaMtr', 'rv', 'cv', 'tax', 'rtTax'];

export function isApartmentColumnSortable(panel: ApartmentSortPanel, column: string): boolean {
  return (panel === 'difference' ? DIFFERENCE_COLUMNS : UNIT_COLUMNS).includes(column);
}

/** none -> ascending -> descending -> none, per column. A different column starts at ascending. */
export function nextApartmentSort(
  current: ApartmentSortState | null,
  panel: ApartmentSortPanel,
  column: string,
): ApartmentSortState | null {
  if (!current || current.panel !== panel || current.column !== column) return { panel, column, direction: 'asc' };
  if (current.direction === 'asc') return { panel, column, direction: 'desc' };
  return null;
}

/** The direction a column header shows: only the sorted column has one. */
export function sortDirectionOf(
  sort: ApartmentSortState | null | undefined,
  panel: ApartmentSortPanel,
  column: string,
): ApartmentSortDirection | null {
  return sort && sort.panel === panel && sort.column === column ? sort.direction : null;
}

/** The query values for the API: `{ sortBy: 'survey:tax', sortOrder: 'desc' }`, or nothing without a sort. */
export function toSortQuery(sort: ApartmentSortState | null): { sortBy: string | null; sortOrder: string | null } {
  return sort ? { sortBy: `${sort.panel}:${sort.column}`, sortOrder: sort.direction } : { sortBy: null, sortOrder: null };
}

/** The sort of the filters (`sortBy` / `sortOrder`), or null when there is none or it is not one this screen knows. */
export function sortFromQuery(sortBy?: string | null, sortOrder?: string | null): ApartmentSortState | null {
  if (!sortBy) return null;
  const [panel, column] = sortBy.split(':');
  if (panel !== 'survey' && panel !== 'difference' && panel !== 'existing') return null;
  if (!column || !isApartmentColumnSortable(panel, column)) return null;
  return { panel, column, direction: sortOrder === 'desc' ? 'desc' : 'asc' };
}
