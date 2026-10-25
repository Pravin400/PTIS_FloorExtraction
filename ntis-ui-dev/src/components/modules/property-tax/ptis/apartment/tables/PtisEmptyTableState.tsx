'use client';

import React from 'react';
import { Inbox } from 'lucide-react';

interface PtisEmptyTableStateProps {
  message: string;
}

export const PtisEmptyTableState: React.FC<PtisEmptyTableStateProps> = ({ message }) => {
  return (
    <div className="sticky left-0 w-full max-w-full flex flex-col items-center justify-center gap-2.5 h-[370px] text-zinc-400 font-medium text-xs bg-zinc-50/40 select-none">
      <div className="w-12 h-12 rounded-full bg-zinc-100 border border-zinc-200/80 flex items-center justify-center text-zinc-400 shadow-2xs">
        <Inbox className="w-6 h-6 stroke-[1.75]" />
      </div>
      <span className="text-zinc-500 font-semibold text-[13px]">{message}</span>
    </div>
  );
};
