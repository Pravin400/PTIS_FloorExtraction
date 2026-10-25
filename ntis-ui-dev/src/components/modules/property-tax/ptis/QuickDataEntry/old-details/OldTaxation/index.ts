
// Re-export main component
export { default } from './OldTaxationForm';
export { default as OldTaxationForm } from './OldTaxationForm';

// Re-export field group components
export { PropertyDetailsFields } from './components/PropertyDetailsFields';
export { AreaDetailsFields } from './components/AreaDetailsFields';
export { TaxDetailsFields } from './components/TaxDetailsFields';

// Re-export validation utilities
export * from './utils/inputValidation';
