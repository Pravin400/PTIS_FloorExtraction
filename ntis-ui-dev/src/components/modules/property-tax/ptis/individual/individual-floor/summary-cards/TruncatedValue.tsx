'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';
import { Tooltip } from '@/components/common/Tooltip';
import type { TruncatedValueProps } from '@/types/summaryCard.types';

export const TruncatedValue: React.FC<TruncatedValueProps> = ({
  value,
  className,
}) => {
  if (value === undefined || value === null || value === '') {
    return <span className={className}>-</span>;
  }

  const str = String(value);

  return (
    <Tooltip
      content={<div className="whitespace-nowrap font-bold text-xs">{str}</div>}
      placement="top"
    >
      <span
        aria-label={str}
        tabIndex={0}
        className={cn('inline-block whitespace-nowrap cursor-default outline-none transition-colors hover:opacity-80', className)}
      >
        {str}
      </span>
    </Tooltip>
  );
};
