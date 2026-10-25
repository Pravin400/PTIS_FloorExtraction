'use client';

import React from 'react';
import { Loader2, Plus, Pencil, Trash2, Save, RefreshCw } from 'lucide-react';
import { usePermissionsContext } from '@/lib/providers/PermissionsProvider';
import { cleanPath } from '@/lib/utils/permission-helper';
import type { UserScreenAccess } from '@/types/user-screen-access.types';

/* ----------------------------------------------------------
   GENERIC BUTTON - SERVER COMPONENT
---------------------------------------------------------- */

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger'
  | 'success'
  | 'edit'
  | 'delete'
  | 'contained'
  | 'outline';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

/**
 * Props for the Button component
 * @property {ButtonVariant} variant - The visual style variant of the button
 * @property {ButtonSize} size - The size of the button
 * @property {React.ElementType} icon - Optional icon component to display
 * @property {"left" | "right"} iconPosition - Position of the icon relative to text
 * @property {boolean} isLoading - Whether the button is in a loading state
 * @property {React.ReactNode} children - Button content/text
 * @property {string} className - Optional tailwind classes to apply
 * @property {boolean} disabled - Whether the button is disabled
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ElementType;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
  children?: React.ReactNode;
  hidden?: boolean;
  actionType?: 'add' | 'edit' | 'delete' | 'save';
}

/**
 * A versatile button component with multiple variants, sizes, and loading states.
 * Server Component compatible.
 *
 * @example
 * <Button variant="primary" size="md" isLoading={false}>
 *   Click Me
 * </Button>
 *
 * @param {ButtonProps} props - The button props
 * @returns {React.ReactElement} The rendered button element
 */
export function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  isLoading = false,
  disabled = false,
  hidden = false,
  className = '',
  children,
  type = 'button',
  actionType,
  ...props
}: ButtonProps): React.ReactElement | null {
  let pathname = '';
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nextNav = require('next/navigation');
    if (nextNav && typeof nextNav.usePathname === 'function') {
      pathname = nextNav.usePathname();
    }
  } catch { }
  let screens: UserScreenAccess[] = [];
  try {
    const context = usePermissionsContext();
    screens = context.screens || [];
  } catch {
    // Not in provider context
  }

  // Resolve active screen permissions
  let activeScreenPermission: UserScreenAccess | null = null;
  if (pathname && screens.length > 0) {
    const segments = pathname.split('/').filter(Boolean);
    const hasLocale = segments.length > 0 && segments[0].length === 2;
    const cleanSegments = hasLocale ? segments.slice(1) : segments;
    const pathWithoutLocale = cleanSegments.join('/');

    const normalizedVisited = cleanPath(pathWithoutLocale);

    const matchingScreens = screens.filter((s) => {
      if (!s.routePath) return false;
      const normalizedRoute = cleanPath(s.routePath);
      return (
        normalizedVisited === normalizedRoute || normalizedVisited.startsWith(normalizedRoute + '/')
      );
    });

    if (matchingScreens.length > 0) {
      matchingScreens.sort((a, b) => (b.routePath?.length || 0) - (a.routePath?.length || 0));
      activeScreenPermission = matchingScreens[0];
    } else {
      activeScreenPermission = screens.find((s) => {
        if (!s.screenCode) return false;
        const codeClean = s.screenCode.replace(/[_-]/g, '').toUpperCase();
        return cleanSegments.some((seg) => {
          const segClean = seg.replace(/[_-]/g, '').toUpperCase();
          return segClean === codeClean;
        });
      }) ?? null;
    }
  }

  // Enforce access control if permissions are found
  if (activeScreenPermission) {
    const isFull = !!activeScreenPermission.haveFullAccess;
    const canEdit = !!activeScreenPermission.canEdit || isFull;
    const canDelete = !!activeScreenPermission.canDelete || isFull;

    const isAdd = actionType === 'add' || Icon === Plus;
    const isEdit = actionType === 'edit' || variant === 'edit' || Icon === Pencil;
    const isDelete = actionType === 'delete' || variant === 'delete' || Icon === Trash2;
    // Save and Update (RefreshCw) require edit access — covers SaveButton, UpdateButton globally
    const isSaveOrUpdate = actionType === 'save' || Icon === Save || Icon === RefreshCw;

    if (isAdd && !isFull) return null;
    if (isEdit && !canEdit) return null;
    if (isDelete && !canDelete) return null;
    if (isSaveOrUpdate && !canEdit) return null;
  }

  const sizeClasses: Record<ButtonSize, string> = {
    xs: 'h-7 px-2.5 text-xs gap-1.5 whitespace-nowrap',
    sm: 'h-8 px-3 text-sm gap-2 whitespace-nowrap',
    md: 'h-10 px-4 text-sm gap-2 whitespace-nowrap',
    lg: 'h-12 px-6 text-base gap-2.5 whitespace-nowrap',
  };

  const iconSizes: Record<ButtonSize, string> = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const variantClasses: Record<ButtonVariant, string> = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
    ghost: 'text-gray-600 hover:bg-gray-100',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
    success: 'bg-green-600 text-white hover:bg-green-700 shadow-sm',
    edit: 'text-[#1A86E8] hover:bg-blue-50 border border-blue-400 hover:shadow-md hover:scale-105',
    delete: 'text-red-500 hover:bg-red-50 border border-red-400 hover:shadow-md hover:scale-105',
    contained: 'bg-sky-500 text-white hover:bg-sky-600 shadow-sm',
    outline: 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50 shadow-sm',
  };

  if (hidden) return null;

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`
        inline-flex items-center justify-center font-medium rounded-lg
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-300
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
      {...props}
    >
      {isLoading && <Loader2 className={`${iconSizes[size]} animate-spin`} />}

      {!isLoading && Icon && iconPosition === 'left' && <Icon className={iconSizes[size]} />}

      {children && <span>{children}</span>}

      {!isLoading && Icon && iconPosition === 'right' && <Icon className={iconSizes[size]} />}
    </button>
  );
}
