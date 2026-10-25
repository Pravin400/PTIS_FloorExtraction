import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/label';
import { ValidationMessage } from '@/components/common/ValidationMessage';
import { cn } from '@/lib/utils/cn';
import { ChangeEvent, FocusEvent } from 'react';

interface BankFormFieldProps {
  id: string;
  label: string;
  value: string;
  required?: boolean;
  maxLength?: number;
  placeholder?: string;
  error?: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur: (e: FocusEvent<HTMLInputElement>) => void;
  className?: string;
  type?: string;
  inputMode?: 'text' | 'none' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search';
  pattern?: string;
}

export function BankFormField({
  id,
  label,
  value,
  required = true,
  maxLength,
  placeholder,
  error,
  onChange,
  onBlur,
  className,
  type = 'text',
  inputMode,
  pattern,
}: BankFormFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Input
        id={id}
        name={id}
        type={type}
        required={required}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        maxLength={maxLength}
        inputMode={inputMode}
        pattern={pattern}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn('bg-white', error && 'border-red-500 focus-visible:ring-red-500', className)}
      />
      <ValidationMessage id={`${id}-error`} message={error} />
    </div>
  );
}
