'use client';

import React from 'react';
import { Label } from '@/components/common/label';
import { Input } from '@/components/common';
import { FieldWrapperProps, ReadOnlyFieldProps } from '@/types/floor-details.types';
import { cn } from '@/lib/utils/cn';

export const FieldWrapper: React.FC<FieldWrapperProps> = ({
  label,
  htmlFor,
  required,
  error,
  children,
  className,
  labelExtra,
}) => (
  <div className={cn("space-y-1.5", className)}>
    <Label htmlFor={htmlFor} className="text-xs font-semibold text-gray-700 flex items-center justify-between">
      <span>
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {labelExtra}
    </Label>
    {children}
    {error && <p className="text-[10px] text-red-500 font-medium mt-0.5 ml-1">{error}</p>}
  </div>
);

const formatValue = (val: string | number | undefined | null): string => {
  if (val === undefined || val === null) return '';
  const num = typeof val === 'number' ? val : parseFloat(val);
  if (!isNaN(num)) {
    return num % 1 !== 0 ? num.toFixed(2) : String(val);
  }
  return String(val);
};

export const ReadOnlyField: React.FC<ReadOnlyFieldProps> = ({ label, value, badgeText, id }) => (
  <FieldWrapper
    label={label}
    htmlFor={id}
    labelExtra={badgeText && (
      <span className="ml-auto text-[9px] text-blue-600 font-semibold bg-blue-100 px-1.5 py-0.5 rounded">
        {badgeText}
      </span>
    )}
  >
    <Input
      id={id}
      type="text"
      placeholder="0.00"
      value={formatValue(value)}
      className="h-9 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 font-semibold text-blue-700 bg-gray-50 border-blue-200"
      readOnly
    />
  </FieldWrapper>
);
