'use client';

import React from 'react';
import type { ReportSection, ReportElement } from '@/hooks/reports/designer/useReportDefState';
import { ElementRenderer } from './ElementRenderer';

export interface SectionBandViewProps {
  section: ReportSection;
  elements: ReportElement[];
  selectedElementIds: string[];
  isActive: boolean;
  onSelectSection: (sectionId: string) => void;
  onResizeSectionStart?: (e: React.PointerEvent, sectionId: string) => void;
  onElementPointerDown: (e: React.PointerEvent, element: ReportElement, handle?: string) => void;
  onElementDoubleClick?: (element: ReportElement) => void;
}

export function SectionBandView({
  section,
  elements,
  selectedElementIds,
  isActive,
  onSelectSection,
  onResizeSectionStart,
  onElementPointerDown,
  onElementDoubleClick,
}: SectionBandViewProps) {
  const sectionElements = elements.filter(
    el => el.sectionId === section.id || (!el.sectionId && section.id === 'details')
  );

  return (
    <div
      className={`relative w-full border-b border-dashed border-slate-300 transition-colors ${
        isActive ? 'bg-blue-50/20' : 'bg-transparent'
      }`}
      style={{ height: `${section.height}px` }}
      onClick={() => onSelectSection(section.id)}
      data-section-id={section.id}
    >
      {/* Section Label Header */}
      <div
        className={`absolute -top-3 left-2 px-1.5 py-0.5 rounded text-[10px] font-bold select-none cursor-pointer z-20 ${
          isActive ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
        }`}
      >
        {section.name}
      </div>

      {/* Render Child Elements */}
      {sectionElements.map(el => (
        <ElementRenderer
          key={el.id}
          element={el}
          isSelected={selectedElementIds.includes(el.id)}
          onPointerDown={onElementPointerDown}
          onDoubleClick={onElementDoubleClick}
        />
      ))}

      {/* Section Bottom Resize Handle */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1.5 cursor-row-resize bg-transparent hover:bg-blue-400/50 z-20"
        onPointerDown={(e) => {
          e.stopPropagation();
          onResizeSectionStart?.(e, section.id);
        }}
        title={`Resize section height: ${section.height}px`}
      />
    </div>
  );
}
