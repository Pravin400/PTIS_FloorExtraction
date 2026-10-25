import type React from 'react';

export interface AnimatedDigitInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  placeholder?: string;
  allowedPattern?: RegExp;
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  charClassName?: string;
}

export interface InfoRowProps {
  label: string;
  value: string | number;
  highlighted?: boolean;
  isBadge?: boolean;
}

export interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  minHeight?: string;
  className?: string;
  /** Escape hatch: fully replaces the spinner icon's className (default: size + blue-600). */
  iconClassName?: string;
  /** Escape hatch: fully replaces the message text's className (default: text-sm font-semibold text-slate-500). */
  messageClassName?: string;
}

export interface MunicipalStatusBadgeProps {
  status: string;
}

export interface SectionHeaderProps {
  title: string;
  actionText?: string;
  onActionClick?: () => void;
  onAction?: () => void;
  infoIcon?: boolean;
  rightElement?: React.ReactNode;
  className?: string;
}
