'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Label } from '@/components/common/label';
import { ValidationMessage } from '@/components/common/ValidationMessage';
import { ToggleSwitch } from '@/components/common/ToggleSwitch';

const FORM_SECTION_COLOR_CLASSES = {
  blue: {
    container: 'border-blue-100',
    icon: 'bg-blue-600',
  },
  violet: {
    container: 'border-violet-100',
    icon: 'bg-violet-600',
  },
  amber: {
    container: 'border-amber-100',
    icon: 'bg-amber-600',
  },
} as const;

export const FormSection: React.FC<{
  title: string;
  icon: React.ReactNode;
  color: 'blue' | 'violet' | 'amber';
  children: React.ReactNode;
}> = ({ title, icon, color, children }) => {
  const colorClasses = FORM_SECTION_COLOR_CLASSES[color];

  return (
    <div className={`p-5 rounded-xl border ${colorClasses.container} bg-white shadow-sm`}>
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-50">
        <div className={`p-1.5 ${colorClasses.icon} text-white rounded-lg shadow-sm font-bold`}>
          {icon}
        </div>
        <h3 className="font-bold text-gray-800">{title}</h3>
      </div>
      {children}
    </div>
  );
};

export const FieldLabel: React.FC<{ label: string; htmlFor?: string; required?: boolean }> = ({
  label,
  htmlFor,
  required,
}) => (
  <Label
    htmlFor={htmlFor}
    className="text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1 uppercase tracking-wider cursor-pointer"
  >
    {label} {required && <span className="text-red-500 font-bold">*</span>}
  </Label>
);

export const ErrorMsg: React.FC<{ error?: string }> = ({ error }) =>
  error ? <ValidationMessage message={error} className="mt-1 text-[11px] font-medium" /> : null;

export const ToggleField: React.FC<{
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}> = ({ label, value, onChange }) => {
  const t = useTranslations('common');

  return (
    <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</span>
        <span
          className={`text-[10px] font-bold uppercase tracking-wider ${
            value ? 'text-blue-600' : 'text-gray-400'
          }`}
        >
          {value ? t('status.active') : t('status.inactive')}
        </span>
      </div>
      <ToggleSwitch
        checked={value}
        onChange={onChange}
        showPopup={false}
      />
    </div>
  );
};
