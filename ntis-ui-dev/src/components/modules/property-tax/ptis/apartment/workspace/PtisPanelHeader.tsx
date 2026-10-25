'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';
import { Maximize2, Minimize2, EyeOff } from 'lucide-react';

interface PtisPanelHeaderProps {
  title: string;
  subtitle?: string;
  widthPercent?: number;
  variant?: 'survey' | 'difference' | 'existing';
  hasAiStatus?: boolean;
  onToggleHide?: () => void;
  onToggleExpand?: () => void;
  isExpanded?: boolean;
}

export const PtisPanelHeader: React.FC<PtisPanelHeaderProps> = ({
  title,
  subtitle,
  variant = 'survey',
  onToggleHide,
  onToggleExpand,
  isExpanded = false,
}) => {
  const styles = {
    survey: {
      bar: 'bg-blue-100 border-b border-blue-200 text-blue-950',
      subtitle: 'text-blue-700 font-medium',
      btn: 'text-blue-700 hover:bg-blue-200 hover:text-blue-950',
    },
    difference: {
      bar: 'bg-amber-100 border-b border-amber-200 text-amber-950',
      subtitle: 'text-amber-700 font-medium',
      btn: 'text-amber-700 hover:bg-amber-200 hover:text-amber-950',
    },
    existing: {
      bar: 'bg-emerald-100 border-b border-emerald-200 text-emerald-950',
      subtitle: 'text-emerald-700 font-medium',
      btn: 'text-emerald-700 hover:bg-emerald-200 hover:text-emerald-950',
    },
  }[variant];

  return (
    <div
      className={cn(
        'px-3 py-2 flex items-center justify-between shadow-2xs select-none font-sans h-10',
        styles.bar
      )}
    >
      <div className="flex items-center gap-2">
        <h2 className="text-[13px] font-extrabold tracking-wide uppercase">{title}</h2>
        {subtitle && <span className={cn("text-[11px]", styles.subtitle)}>({subtitle})</span>}
      </div>

      <div className="flex items-center gap-2">
        {onToggleExpand && (
          <button
            type="button"
            onClick={onToggleExpand}
            className={cn("p-1 rounded transition-colors cursor-pointer", styles.btn)}
            title={isExpanded ? 'Restore Layout' : 'Expand Full Width'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        )}

        {onToggleHide && (
          <button
            type="button"
            onClick={onToggleHide}
            className={cn("p-1 rounded transition-colors cursor-pointer", styles.btn)}
            title="Hide Panel"
          >
            <EyeOff className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
