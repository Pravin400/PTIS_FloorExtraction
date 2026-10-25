/**
 * Apartment QC Hooks
 * 
 * This module exports all hooks related to the Apartment QC feature.
 */

// Property Edit Form Hooks
export { usePropertyEditForm } from './usePropertyEditForm';
export { usePropertyEditFormState } from './usePropertyEditFormState';
export { usePropertyEditFormValidation } from './usePropertyEditFormValidation';
export { usePropertyEditFormSubmission } from './usePropertyEditFormSubmission';
export { useRoomSubmissionSidebar } from './useRoomSubmissionSidebar';

// Table Hooks
export { useTableAutoScroll } from './useTableAutoScroll';
export { useColumnFilters } from './useColumnFilters';

// Tax Details Table Hooks
export {
  useTaxColumns,
  useTaxTableData,
  useHasData,
  useFooterContent,
  // Utility functions
  getTabTranslationKey,
  getSubTabLabel,
  formatCurrency,
  createTaxMap,
  getHeaderGradientClass,
  getRowClassName,
  // Types
  type TaxRowData,
  type TaxColumnDef,
  type UseApartmentTaxDetailsTableProps,
} from './useApartmentTaxDetailsTable';

export { useTaxTableColumns } from './useTaxTableColumns';

// Property Photo Viewer Hook
export { usePropertyPhotoViewer } from './usePropertyPhotoViewer';
export type { UsePropertyPhotoViewerProps } from './usePropertyPhotoViewer';
