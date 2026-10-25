'use client';
import type { LoadingStateProps } from "@/types/asset/municipal-Asset/new-add-new-asset";
export type { LoadingStateProps };


import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';



const ICON_SIZE = {
  sm: 'size-5',
  md: 'size-8',
  lg: 'size-12',
} as const;

/**
 * Lightweight inline loading indicator for use inside an already-rendered
 * step/panel (no page chrome). For route-level `loading.tsx` files, use
 * `LoadingPage` instead.
 */
export function LoadingState({
  message = 'Loading...',
  size = 'md',
  minHeight = 'min-h-[240px]',
  className,
  iconClassName,
  messageClassName,
}: LoadingStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', minHeight, className)}>
      <Loader2 className={iconClassName ?? cn(ICON_SIZE[size], 'animate-spin text-blue-600')} />
      {message && <p className={messageClassName ?? 'text-sm font-semibold text-slate-500'}>{message}</p>}
    </div>
  );
}

export default LoadingState;
