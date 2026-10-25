import React from 'react';
import { Input } from './Input';
import { Select } from './select';
import { Label } from './label';

/**
 * Common props for all form field types
 */
interface BaseFormFieldProps {
  /** Unique identifier for the field */
  id: string;
  /** Field label text */
  label: string;
  /** Whether the field is required (shows red asterisk) */
  required?: boolean;
  /** Additional CSS classes for the wrapper div */
  className?: string;
}

/**
 * Props for text input fields
 */
interface TextFieldProps extends BaseFormFieldProps {
  type: 'text' | 'email';
  /** Current field value */
  value: string;
  /** Placeholder text */
  placeholder?: string;
  /** Maximum input length */
  maxLength?: number;
  /** Whether the field shows an error state */
  hasError?: boolean;
  /** Change handler */
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Focus handler */
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  /** Blur handler */
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  /** Optional input className override */
  inputClassName?: string;
}

/**
 * Props for select dropdown fields
 */
interface SelectFieldProps extends BaseFormFieldProps {
  type: 'select';
  /** Current field value */
  value: string;
  /** Placeholder text */
  placeholder?: string;
  /** Select options */
  options: { label: string; value: string }[];
  /** Change handler */
  onChange: (e: React.ChangeEvent<HTMLSelectElement>, selectedValue: string) => void;
  /** Select size variant */
  selectSize?: 'sm' | 'md';
}

/**
 * Union type for all form field configurations
 */
type FormFieldGroupProps = TextFieldProps | SelectFieldProps;

/**
 * Reusable form field component with consistent styling and layout
 * 
 * Reduces duplication across form implementations by providing:
 * - Consistent label styling
 * - Consistent input/select styling
 * - Required field indicators
 * - Error state handling
 * - Wrapper spacing
 * 
 * @example
 * ```tsx
 * // Text input
 * <FormFieldGroup
 *   type="text"
 *   id="owner-name"
 *   label="Owner Name"
 *   required
 *   value={formData.ownerName}
 *   placeholder="Enter full name"
 *   maxLength={100}
 *   hasError={!isValidName}
 *   onChange={(e) => setFormData({...formData, ownerName: e.target.value})}
 * />
 * 
 * // Select dropdown
 * <FormFieldGroup
 *   type="select"
 *   id="owner-type"
 *   label="Owner Type"
 *   value={formData.ownerTypeId}
 *   options={ownerTypeOptions}
 *   placeholder="Select type"
 *   onChange={(e, val) => setFormData({...formData, ownerTypeId: val})}
 *   selectSize="sm"
 * />
 * ```
 */
export const FormFieldGroup: React.FC<FormFieldGroupProps> = (props) => {
  const { id, label, required = false, className = '' } = props;

  const baseInputClassName = 'h-9 text-sm border-gray-300 focus:border-gray-600 focus:ring-2 focus:ring-gray-200';

  if (props.type === 'select') {
    const { value, placeholder, options, onChange, selectSize = 'sm' } = props;
    
    return (
      <div className={className}>
        <Select
          label={label}
          options={options}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          selectSize={selectSize}
        />
      </div>
    );
  }

  // Text or email input
  const { value, placeholder, maxLength, hasError = false, onChange, onFocus, onBlur, inputClassName } = props;
  const errorClassName = hasError ? 'border-red-300 focus:border-red-500' : '';
  const finalInputClassName = inputClassName ?? `${baseInputClassName} ${errorClassName}`;

  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label htmlFor={id} className="text-xs font-semibold text-gray-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </Label>
      <Input
        id={id}
        type={props.type}
        placeholder={placeholder}
        value={value}
        className={finalInputClassName}
        maxLength={maxLength}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    </div>
  );
};
