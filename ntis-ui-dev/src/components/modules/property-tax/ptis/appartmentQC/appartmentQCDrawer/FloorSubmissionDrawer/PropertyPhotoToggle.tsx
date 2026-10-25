'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

/**
 * Floating expandable tab-like half-button protruding from the right edge.
 * Only rendered when the Property Photo Viewer is closed.
 * On hover, expands to the left revealing the text "View Image".
 * Supports dragging vertically to adjust its position on the screen.
 */
export function PropertyPhotoToggle({
  onClick,
}: {
  onClick: () => void;
}): React.ReactElement | null {
  const t = useTranslations('appartmentQC');
  const [topY, setTopY] = useState(96);
  const dragInfo = useRef({ isDragging: false, startY: 0, startTopY: 0, hasDragged: false });
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const label = t('drawer.viewImage');

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    startDrag(e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      startDrag(e.touches[0].clientY);
    }
  };

  const startDrag = (clientY: number) => {
    dragInfo.current = {
      isDragging: true,
      startY: clientY,
      startTopY: topY,
      hasDragged: false,
    };
  };

  const onDrag = useCallback(
    (clientY: number) => {
      if (!dragInfo.current.isDragging) return;

      const deltaY = clientY - dragInfo.current.startY;
      if (Math.abs(deltaY) > 5) {
        dragInfo.current.hasDragged = true;
      }

      let newTopY = dragInfo.current.startTopY + deltaY;

      // Bounds check
      const minTop = 92;
      const maxTop = typeof window !== 'undefined' ? window.innerHeight - 56 : 500;

      if (newTopY < minTop) newTopY = minTop;
      if (newTopY > maxTop) newTopY = maxTop;

      setTopY(newTopY);
    },
    []
  );

  const endDrag = useCallback(() => {
    dragInfo.current.isDragging = false;
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragInfo.current.isDragging) {
        e.preventDefault();
        onDrag(e.clientY);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (dragInfo.current.isDragging && e.touches.length > 0) {
        onDrag(e.touches[0].clientY);
      }
    };

    const handleMouseUp = () => endDrag();
    const handleTouchEnd = () => endDrag();

    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', handleMouseMove, { passive: false });
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [onDrag, endDrag]);

  const handleClick = (e: React.MouseEvent) => {
    if (dragInfo.current.hasDragged) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onClick();
  };

  return (
    <button
      ref={buttonRef}
      type="button"
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onClick={handleClick}
      style={{ top: `${topY}px` }}
      className="hidden lg:flex fixed right-0 z-[110] group items-center gap-2 pl-3.5 pr-2.5 py-2.5 rounded-l-full rounded-r-none border border-r-0 border-[#4b70a6] bg-gradient-to-r from-[#4b70a6] to-[#5a82b8] hover:from-[#3a5d8f] hover:to-[#4b70a6] shadow-md hover:shadow-lg text-white transition-[background,box-shadow] duration-300 ease-in-out cursor-pointer focus:outline-none select-none"
      aria-label={label}
    >
      <ImageIcon className="w-5 h-5 shrink-0 text-white group-hover:scale-110 transition-transform duration-200 pointer-events-none" />
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-xs font-semibold opacity-0 transition-all duration-300 ease-in-out group-hover:max-w-[180px] group-hover:opacity-100 group-hover:ml-1 pointer-events-none">
        {label}
      </span>
    </button>
  );
}
