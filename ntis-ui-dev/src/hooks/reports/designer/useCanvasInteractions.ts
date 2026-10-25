 'use client';

import { useState, useCallback, useRef } from 'react';
import { snapToGrid } from '@/lib/utils/reports/designer';
import type { ReportElement } from './useReportDefState';

export interface SmartGuide {
  position: number;
  orientation: 'vertical' | 'horizontal';
}

export interface MarqueeBox {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  active: boolean;
}

export function useCanvasInteractions(
  elements: ReportElement[],
  onUpdateElement: (id: string, updates: Partial<ReportElement>) => void,
  onSelectElement: (id: string, multiSelect?: boolean) => void,
  onSelectMultipleElements?: (ids: string[]) => void,
  snapSize = 5
) {
  const [activeGuides, setActiveGuides] = useState<SmartGuide[]>([]);
  const [marquee, setMarquee] = useState<MarqueeBox | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const dragRef = useRef<{
    elementId: string;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    initialWidth: number;
    initialHeight: number;
    handle?: string;
  } | null>(null);

  const startDrag = useCallback(
    (element: ReportElement, startX: number, startY: number, handle?: string) => {
      dragRef.current = {
        elementId: element.id,
        startX,
        startY,
        initialX: element.x,
        initialY: element.y,
        initialWidth: element.width,
        initialHeight: element.height,
        handle,
      };
      setIsDragging(true);
      onSelectElement(element.id);
    },
    [onSelectElement]
  );

  const handlePointerMove = useCallback(
    (currentX: number, currentY: number) => {
      if (!dragRef.current) {
        if (marquee?.active) {
          setMarquee(prev => (prev ? { ...prev, currentX, currentY } : null));
        }
        return;
      }

      const { elementId, startX, startY, initialX, initialY, initialWidth, initialHeight, handle } =
        dragRef.current;
      const dx = currentX - startX;
      const dy = currentY - startY;

      if (!handle) {
        // Move element
        const rawX = initialX + dx;
        const rawY = initialY + dy;
        const newX = Math.max(0, snapToGrid(rawX, snapSize));
        const newY = Math.max(0, snapToGrid(rawY, snapSize));

        // Check alignment with other elements
        const guides: SmartGuide[] = [];
        elements.forEach(other => {
          if (other.id === elementId) return;
          if (Math.abs(other.x - newX) < 4) {
            guides.push({ position: other.x, orientation: 'vertical' });
          }
          if (Math.abs(other.y - newY) < 4) {
            guides.push({ position: other.y, orientation: 'horizontal' });
          }
        });
        setActiveGuides(guides);

        onUpdateElement(elementId, { x: newX, y: newY });
      } else {
        // Resize element with handle
        let newX = initialX;
        let newY = initialY;
        let newW = initialWidth;
        let newH = initialHeight;

        if (handle.includes('e')) newW = Math.max(10, snapToGrid(initialWidth + dx, snapSize));
        if (handle.includes('s')) newH = Math.max(10, snapToGrid(initialHeight + dy, snapSize));
        if (handle.includes('w')) {
          const snappedDx = snapToGrid(dx, snapSize);
          newW = Math.max(10, initialWidth - snappedDx);
          newX = initialX + (initialWidth - newW);
        }
        if (handle.includes('n')) {
          const snappedDy = snapToGrid(dy, snapSize);
          newH = Math.max(10, initialHeight - snappedDy);
          newY = initialY + (initialHeight - newH);
        }

        onUpdateElement(elementId, { x: newX, y: newY, width: newW, height: newH });
      }
    },
    [elements, marquee, onUpdateElement, snapSize]
  );

  const endDrag = useCallback(() => {
    dragRef.current = null;
    setIsDragging(false);
    setActiveGuides([]);

    if (marquee?.active && onSelectMultipleElements) {
      const minX = Math.min(marquee.startX, marquee.currentX);
      const maxX = Math.max(marquee.startX, marquee.currentX);
      const minY = Math.min(marquee.startY, marquee.currentY);
      const maxY = Math.max(marquee.startY, marquee.currentY);

      const enclosed = elements
        .filter(
          el => el.x >= minX && el.x + el.width <= maxX && el.y >= minY && el.y + el.height <= maxY
        )
        .map(el => el.id);

      onSelectMultipleElements(enclosed);
    }
    setMarquee(null);
  }, [elements, marquee, onSelectMultipleElements]);

  const startMarquee = useCallback((x: number, y: number) => {
    setMarquee({ startX: x, startY: y, currentX: x, currentY: y, active: true });
  }, []);

  return {
    startDrag,
    handlePointerMove,
    endDrag,
    startMarquee,
    activeGuides,
    marquee,
    isInteracting: Boolean(isDragging || marquee?.active),
  };
}
