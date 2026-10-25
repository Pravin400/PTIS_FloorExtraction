'use client';

import { useApartmentFilters } from './useApartmentFilters';
import { useApartmentData } from './useApartmentData';
import { useApartmentActions } from './useApartmentActions';
import {
  nextApartmentSort,
  sortFromQuery,
  toSortQuery,
  type ApartmentSortPanel,
  type ApartmentSortState,
} from '@/lib/utils/apartment-sort';

export function useApartment(
  initialPropertyId: number | null = null,
  initialWingId: number | null = null,
  initialWingDetailId: number | null = null
) {
  const { filters, setFilters, paginationInfo, setPaginationInfo } = useApartmentFilters(
    initialPropertyId,
    initialWingId,
    initialWingDetailId
  );

  const data = useApartmentData(filters, paginationInfo, setPaginationInfo);
  const actions = useApartmentActions(data.setSurveyUnits);

  const handlePageChange = (newPage: number) => {
    const updatedFilters = { ...filters, pageNumber: newPage };
    setFilters(updatedFilters);
    data.fetchWingWiseData(updatedFilters);
  };

  const handlePageSizeChange = (newSize: number) => {
    const updatedFilters = { ...filters, pageSize: newSize, pageNumber: 1 };
    setFilters(updatedFilters);
    data.fetchWingWiseData(updatedFilters);
  };

  // One sort for the three tables, made by the API over all the units: a click asks again from page 1.
  const sort = sortFromQuery(filters.sortBy, filters.sortOrder);

  const applySort = (next: ApartmentSortState | null) => {
    const updatedFilters = { ...filters, ...toSortQuery(next), pageNumber: 1 };
    setFilters(updatedFilters);
    data.fetchWingWiseData(updatedFilters);
  };

  const handleSort = (panel: ApartmentSortPanel, column: string) => applySort(nextApartmentSort(sort, panel, column));
  const clearSort = () => applySort(null);

  return {
    previousUnits: data.previousUnits,
    surveyUnits: data.surveyUnits,
    differences: data.differences,
    allPreviousUnits: data.allPreviousUnits,
    allSurveyUnits: data.allSurveyUnits,
    totalDeltas: data.totalDeltas,
    hiddenPanels: actions.hiddenPanels,
    hoveredUnitId: actions.hoveredUnitId,
    expandedUnitIds: actions.expandedUnitIds,
    editingUnit: actions.editingUnit,
    filters,
    paginationInfo,
    isLoading: data.isLoading,
    isLoadingMore: data.isLoadingMore,
    apiError: data.apiError,
    rvTaxAmounts: data.rvTaxAmounts,
    cvTaxAmounts: data.cvTaxAmounts,
    setFilters,
    setHoveredUnitId: actions.setHoveredUnitId,
    setEditingUnit: actions.setEditingUnit,
    toggleExpandRow: actions.toggleExpandRow,
    togglePanelVisibility: actions.togglePanelVisibility,
    restoreAllPanels: actions.restoreAllPanels,
    handleUpdateUnit: actions.handleUpdateUnit,
    fetchWingWiseData: data.fetchWingWiseData,
    handlePageChange,
    handlePageSizeChange,
    sort,
    handleSort,
    clearSort,
    loadMoreUnits: data.loadMoreUnits,
  };
}

export type { PtisPaginationInfo } from './useApartmentFilters';
export type { AssessmentUnit } from '@/types/property-tax/apartment';
