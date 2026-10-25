"use client";

import { AlertTriangle } from "lucide-react";

interface MandatoryNoteProps {
  text: string;
}

export function MandatoryNote({ text }: MandatoryNoteProps) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-amber-200/80 bg-amber-50/60 p-3 text-xs text-amber-800">
      <AlertTriangle size={15} className="text-amber-600 shrink-0" />
      <span>{text}</span>
    </div>
  );
}
