'use client';

import { Plus, Minus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/common';

export interface SurveyorMapZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRecenter: () => void;
  className?: string;
}

export function SurveyorMapZoomControls({
  onZoomIn,
  onZoomOut,
  onRecenter,
  className = '',
}: SurveyorMapZoomControlsProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {/* Zoom In & Out Pill */}
      <div className="flex flex-col rounded-xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-[0_4px_12px_rgba(15,23,42,0.1)] overflow-hidden">
        <Button
          type="button"
          variant="ghost"
          size="xs"
          icon={Plus}
          onClick={onZoomIn}
          aria-label="Zoom in"
          className="h-8! w-8! p-0! text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-none border-b border-slate-100 cursor-pointer"
        />
        <Button
          type="button"
          variant="ghost"
          size="xs"
          icon={Minus}
          onClick={onZoomOut}
          aria-label="Zoom out"
          className="h-8! w-8! p-0! text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-none cursor-pointer"
        />
      </div>

      {/* Reset Camera View Button */}
      <Button
        type="button"
        variant="ghost"
        size="xs"
        icon={RotateCcw}
        onClick={onRecenter}
        aria-label="Reset map view"
        className="h-8! w-8! p-0! rounded-xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-[0_4px_12px_rgba(15,23,42,0.1)] text-slate-700 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
      />
    </div>
  );
}
