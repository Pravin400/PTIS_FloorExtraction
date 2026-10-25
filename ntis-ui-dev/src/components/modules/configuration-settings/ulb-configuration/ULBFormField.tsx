'use client';

import { Input, Select, TextArea, Label, ValidationMessage } from '@/components/common';
import type { InputProps } from '@/components/common';
import { cn } from '@/lib/utils/cn';
import type { ChangeEvent, FocusEvent } from 'react';
import type { UlbSelectBaseProps, UlbTextAreaProps } from '@/types/ulbconfig-master.types';

const INPUT_SM = 'h-9 bg-white border-slate-200/80 text-sm font-medium';
const INPUT_MD = 'h-10 bg-white border-slate-200 text-sm';

interface UlbFormFieldProps {
  id: string;
  label: string;
  value: string;
  required?: boolean;
  maxLength?: number;
  placeholder?: string;
  error?: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
  className?: string;
  type?: string;
  inputMode?: InputProps['inputMode'];
}

/** Field wrapper aligned with bank-master `BankFormField` pattern. */
export function UlbFormField({
  id,
  label,
  value,
  required = false,
  maxLength,
  placeholder,
  error,
  onChange,
  onBlur,
  className,
  type = 'text',
  inputMode,
}: UlbFormFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {label} {required ? <span className="text-red-500">*</span> : null}
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
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(INPUT_SM, error && 'border-red-500 focus-visible:ring-red-500', className)}
      />
      <ValidationMessage id={`${id}-error`} message={error} />
    </div>
  );
}

/** Input wrapper aligned to the ULB visual style. */
export function UlbInput({ className, fullWidth = true, ...props }: InputProps) {
  return <Input fullWidth={fullWidth} className={cn(INPUT_SM, className)} {...props} />;
}

export function UlbInputMd({ className, fullWidth = true, ...props }: InputProps) {
  return <Input fullWidth={fullWidth} className={cn(INPUT_MD, className)} {...props} />;
}

/** Select wrapper that exposes a value-only onChange handler. */
export function UlbSelect({ className, selectSize = 'sm', onChange, ...props }: UlbSelectBaseProps) {
  return (
    <Select
      selectSize={selectSize}
      className={cn('h-9', className)}
      onChange={onChange ? (_e, value) => onChange(value) : undefined}
      {...props}
    />
  );
}

export function UlbSelectMd({ className, onChange, ...props }: UlbSelectBaseProps) {
  return (
    <Select
      className={cn('h-10', className)}
      onChange={onChange ? (_e, value) => onChange(value) : undefined}
      {...props}
    />
  );
}

/** TextArea with a leading <Label> (TextArea itself does not expose a label prop). */
export function UlbTextArea({ label, required, className, ...props }: UlbTextAreaProps) {
  return (
    <div className="flex w-full flex-col gap-1">
      {label ? <Label required={required}>{label}</Label> : null}
      <TextArea
        className={cn(
          'min-h-[100px] resize-none bg-white border-slate-200 text-sm font-medium p-3',
          className
        )}
        {...props}
      />
    </div>
  );
}
