/**
 * TaxationBreakdown Module - Refactored Structure
 * 
 * This module manages taxation breakdown data entry for old property details.
 * It has been refactored into focused, reusable components for better organization.
 * 
 * MODULE STRUCTURE:
 * ================
 * 
 * 1. TaxationBreakdownForm.tsx (Main Orchestrator - ~60 lines)
 *    - Entry point component
 *    - Manages state through custom hook
 *    - Delegates rendering to field group components
 *    - Handles form submission and updates
 * 
 * 2. components/ (Field Group Components)
 *    - TaxationMetaFields.tsx (~40 lines)
 *      * Renders assessment year and interest amount fields
 *      * Handles year validation (4-digit numeric)
 *      * Manages numeric input formatting
 * 
 *    - DynamicTaxFields.tsx (~35 lines)
 *      * Renders dynamic tax input fields
 *      * Generates fields based on available tax types
 *      * Handles individual tax amount entry
 * 
 *    - TaxationSummaryFields.tsx (~40 lines)
 *      * Renders read-only summary fields
 *      * Displays aggregate tax sum
 *      * Shows net payable total (calculated)
 * 
 * BENEFITS OF REFACTORING:
 * =======================
 * - Reduced main file from ~100 lines to ~60 lines
 * - Logical grouping of related fields
 * - Clear separation between editable and calculated fields
 * - Improved component reusability
 * - Better code organization and readability
 * - Enhanced maintainability
 * 
 * FIELD GROUPS:
 * =============
 * 1. Meta Fields:
 *    - Assessment Year (4-digit year input)
 *    - Interest Amount (numeric input)
 * 
 * 2. Dynamic Tax Fields:
 *    - Generated from tax types configuration
 *    - Each tax type gets its own input field
 *    - Allows empty values (displays as empty, not 0)
 * 
 * 3. Summary Fields:
 *    - Aggregate Tax Sum (auto-calculated, read-only)
 *    - Net Payable Total (auto-calculated, read-only)
 * 
 * USAGE:
 * ======
 * Import and use the main component as before:
 * ```tsx
 * import TaxationBreakdownForm from './TaxationBreakdown/TaxationBreakdownForm';
 * 
 * <TaxationBreakdownForm
 *   initialData={taxationData}
 * />
 * ```
 */

// Re-export main component
export { default } from './TaxationBreakdownForm';
export { default as TaxationBreakdownForm } from './TaxationBreakdownForm';

// Re-export field components
export { TaxationMetaFields } from './components/TaxationMetaFields';
export { DynamicTaxFields } from './components/DynamicTaxFields';
export { TaxationSummaryFields } from './components/TaxationSummaryFields';
