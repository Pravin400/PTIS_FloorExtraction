'use client';

import React from 'react';
import { Unlink } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface EmptyMappedPropertiesStateProps {
  message: string;
  badgeLabel?: string;
  theme?: 'emerald' | 'sky';
}

export const EmptyMappedPropertiesState: React.FC<EmptyMappedPropertiesStateProps> = ({
  message,
  badgeLabel,
  theme = 'sky',
}) => {
  const isEmerald = theme === 'emerald';
  return (
    <div
      className={cn(
        'flex items-center gap-2 py-1.5 px-3 text-xs font-sans rounded-md border shadow-2xs sticky left-1 w-fit select-none',
        isEmerald
          ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
          : 'bg-sky-50/80 border-sky-200 text-sky-900'
      )}
    >
      <Unlink className={cn('w-3.5 h-3.5 shrink-0', isEmerald ? 'text-emerald-600' : 'text-sky-600')} />
      <span className="font-medium">{message}</span>
      {badgeLabel && (
        <span
          className={cn(
            'text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border',
            isEmerald
              ? 'bg-white/90 border-emerald-200 text-emerald-800'
              : 'bg-white/90 border-sky-200 text-sky-800'
          )}
        >
          {badgeLabel}
        </span>
      )}
    </div>
  );
};
