'use client';

import { cn } from "@/lib/utils/cn";

interface RequiredFieldsNoteProps {
  text: string;
  className?: string;
}

/**
 * Standard note for mandatory fields.
 */
export function RequiredFieldsNote({ text, className = '' }: RequiredFieldsNoteProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
      <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
        {text}
      </span>
    </div>
  );
}
