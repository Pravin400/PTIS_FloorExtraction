'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface UseImageViewerZoomProps {
  src: string;
  rotation: number;
}

export function useImageViewerZoom({ src, rotation }: UseImageViewerZoomProps) {
  const [zoomState, setZoomState] = useState({ scale: 1, x: 0, y: 0 });
  const { scale, x, y } = zoomState;
  const [isDragging, setIsDragging] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [prevRotation, setPrevRotation] = useState(rotation);

  if (rotation !== prevRotation) {
    setPrevRotation(rotation);
    setZoomState({ scale: 1, x: 0, y: 0 });
    setIsDragging(false);
  }

  useEffect(() => {
    return () => {
      if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current);
    };
  }, []);

  const getClampingBounds = useCallback(
    (scaleValue: number) => {
      const container = containerRef.current;
      if (!container) return { maxX: 0, maxY: 0, rect: null };

      const rect = container.getBoundingClientRect();
      if (scaleValue <= 1) {
        return { maxX: 0, maxY: 0, rect };
      }

      const img = container.querySelector('img');
      let imageWidth = rect.width;
      let imageHeight = rect.height;

      if (img?.naturalWidth && img?.naturalHeight) {
        const containerRatio = rect.width / rect.height;
        const isRotated = rotation % 180 !== 0;
        const effectiveWidth = isRotated ? img.naturalHeight : img.naturalWidth;
        const effectiveHeight = isRotated ? img.naturalWidth : img.naturalHeight;
        const imgRatio = effectiveWidth / effectiveHeight;

        if (imgRatio > containerRatio) {
          imageWidth = rect.width;
          imageHeight = rect.width / imgRatio;
        } else {
          imageWidth = rect.height * imgRatio;
          imageHeight = rect.height;
        }
      }

      return {
        maxX: ((scaleValue - 1) * imageWidth) / 2,
        maxY: ((scaleValue - 1) * imageHeight) / 2,
        rect,
      };
    },
    [rotation]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      setIsZooming(true);
      if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current);
      zoomTimeoutRef.current = setTimeout(() => setIsZooming(false), 150);

      const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * 800 : e.deltaY;
      const intensity = e.ctrlKey ? 0.008 : 0.0015;
      const factor = Math.exp(-delta * intensity);

      setZoomState((prev) => {
        const nextScale = Math.min(Math.max(prev.scale * factor, 0.5), 8.0);
        if (nextScale <= 1) return { scale: nextScale, x: 0, y: 0 };

        const { maxX, maxY, rect } = getClampingBounds(nextScale);
        if (!rect) return prev;

        const targetX = e.clientX - rect.left - rect.width / 2;
        const targetY = e.clientY - rect.top - rect.height / 2;
        const scaleRatio = prev.scale > 0 ? nextScale / prev.scale : 1;
        const newX = targetX - (targetX - prev.x) * scaleRatio;
        const newY = targetY - (targetY - prev.y) * scaleRatio;

        return {
          scale: nextScale,
          x: Math.min(Math.max(newX, -maxX), maxX),
          y: Math.min(Math.max(newY, -maxY), maxY),
        };
      });
    };

    container.addEventListener('wheel', onWheelNative, { passive: false });
    return () => container.removeEventListener('wheel', onWheelNative);
  }, [src, getClampingBounds]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (scale <= 1) return;
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX - x, y: e.clientY - y });
    },
    [scale, x, y]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDragging || scale <= 1) return;
      e.preventDefault();
      setZoomState((prev) => {
        const { maxX, maxY } = getClampingBounds(prev.scale);
        return {
          ...prev,
          x: Math.min(Math.max(e.clientX - dragStart.x, -maxX), maxX),
          y: Math.min(Math.max(e.clientY - dragStart.y, -maxY), maxY),
        };
      });
    },
    [isDragging, scale, dragStart, getClampingBounds]
  );

  const handleMouseUpOrLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleZoom = useCallback(
    (direction: 'in' | 'out' | 'reset') => {
      setZoomState((prev) => {
        if (direction === 'reset') return { scale: 1, x: 0, y: 0 };
        const nextScale = direction === 'in'
          ? Math.min(prev.scale + 0.25, 8.0)
          : Math.max(prev.scale - 0.25, 0.5);

        if (nextScale <= 1) return { scale: nextScale, x: 0, y: 0 };

        const { maxX, maxY } = getClampingBounds(nextScale);
        return {
          scale: nextScale,
          x: Math.min(Math.max(prev.x, -maxX), maxX),
          y: Math.min(Math.max(prev.y, -maxY), maxY),
        };
      });
    },
    [getClampingBounds]
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      setZoomState((prev) => {
        if (prev.scale > 1) return { scale: 1, x: 0, y: 0 };

        const nextScale = 2;
        const { maxX, maxY, rect } = getClampingBounds(nextScale);
        if (!rect) return { scale: nextScale, x: 0, y: 0 };

        const newX = -(e.clientX - rect.left - rect.width / 2);
        const newY = -(e.clientY - rect.top - rect.height / 2);

        return {
          scale: nextScale,
          x: Math.min(Math.max(newX, -maxX), maxX),
          y: Math.min(Math.max(newY, -maxY), maxY),
        };
      });
    },
    [getClampingBounds]
  );

  return {
    scale, x, y, isDragging, isZooming, containerRef,
    handleMouseDown, handleMouseMove, handleMouseUpOrLeave, handleZoom, handleDoubleClick,
  };
}
