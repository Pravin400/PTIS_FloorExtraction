'use client';

import React from 'react';
import type { ReportElement } from '@/hooks/reports/designer/useReportDefState';

export interface ElementRendererProps {
  element: ReportElement;
  isSelected: boolean;
  onPointerDown: (e: React.PointerEvent, element: ReportElement, handle?: string) => void;
  onDoubleClick?: (element: ReportElement) => void;
}

const RESIZE_HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as const;

export function ElementRenderer({
  element,
  isSelected,
  onPointerDown,
  onDoubleClick,
}: ElementRendererProps) {
  const styles = element.styles || {};
  const isLine = element.type === 'line';
  const isCircle = element.type === 'circle';

  return (
    <div
      className={`absolute select-none group cursor-move ${
        isSelected ? 'ring-1 ring-blue-500 shadow-sm z-30' : 'hover:ring-1 hover:ring-blue-300 z-10'
      }`}
      style={{
        left: `${element.x}px`,
        top: `${element.y}px`,
        width: `${element.width}px`,
        height: `${element.height}px`,
        fontFamily: styles.fontFamily || "'Noto Sans Devanagari', sans-serif",
        fontSize: styles.fontSize ? (typeof styles.fontSize === 'number' ? `${styles.fontSize}px` : styles.fontSize) : '10px',
        fontWeight: styles.fontWeight || 400,
        fontStyle: styles.fontStyle || 'normal',
        textDecoration: styles.textDecoration || 'none',
        textAlign: styles.textAlign || 'left',
        color: styles.color || '#0f172a',
        backgroundColor: styles.backgroundColor || 'transparent',
        borderTop: styles.borderTop || styles.border || undefined,
        borderBottom: styles.borderBottom || styles.border || undefined,
        borderLeft: styles.borderLeft || styles.border || undefined,
        borderRight: styles.borderRight || styles.border || undefined,
        borderRadius: isCircle ? '50%' : styles.borderRadius ? `${styles.borderRadius}px` : undefined,
        padding: styles.padding ? `${styles.padding}px` : '2px 4px',
        opacity: styles.opacity !== undefined ? styles.opacity : 1,
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        onPointerDown(e, element);
      }}
      onDoubleClick={() => onDoubleClick?.(element)}
      data-element-id={element.id}
    >
      {/* Content Rendering based on type */}
      {isLine ? (
        <div className="w-full h-0.5 bg-slate-900 absolute top-1/2 -translate-y-1/2 left-0 right-0" />
      ) : (
        <div className="w-full h-full flex flex-col justify-center whitespace-pre-wrap break-words leading-tight">
          {element.text || element.displayText || element.field || 'Text'}
        </div>
      )}

      {/* 8-Point Resize Handles when element is selected */}
      {isSelected && (
        <>
          {RESIZE_HANDLES.map((handle) => {
            let posClass = '';
            if (handle === 'nw') posClass = '-top-1 -left-1 cursor-nwse-resize';
            if (handle === 'n') posClass = '-top-1 left-1/2 -translate-x-1/2 cursor-ns-resize';
            if (handle === 'ne') posClass = '-top-1 -right-1 cursor-nesw-resize';
            if (handle === 'e') posClass = 'top-1/2 -right-1 -translate-y-1/2 cursor-ew-resize';
            if (handle === 'se') posClass = '-bottom-1 -right-1 cursor-nwse-resize';
            if (handle === 's') posClass = '-bottom-1 left-1/2 -translate-x-1/2 cursor-ns-resize';
            if (handle === 'sw') posClass = '-bottom-1 -left-1 cursor-nesw-resize';
            if (handle === 'w') posClass = 'top-1/2 -left-1 -translate-y-1/2 cursor-ew-resize';

            return (
              <div
                key={handle}
                className={`absolute w-2 h-2 bg-white border border-blue-600 rounded-sm z-40 ${posClass}`}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onPointerDown(e, element, handle);
                }}
                data-handle={handle}
              />
            );
          })}
        </>
      )}
    </div>
  );
}
