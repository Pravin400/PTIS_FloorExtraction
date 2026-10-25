'use client';

import {
  type ReactNode,
  useState,
  useRef,
  useImperativeHandle,
  useCallback,
  useEffect,
  Fragment,
} from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { MappedFloorDetail } from '@/types/reassessment.types';
import type { SharedAutoScrollController } from '@/hooks/ptis/reassessment/useSharedAutoScroll';

/**
 * Compact color pill for floor detail cells based on status
 */
export function getFloorDetailCellClasses(status: string | undefined): string {
  return cn(
    'h-[20px] rounded px-1 py-0 border border-gray-300 shadow-sm hover:border-blue-500 hover:shadow transition-all duration-150 cursor-pointer text-[11px] leading-[18px] text-center text-gray-900',
    status === 'Unchanged' && 'bg-yellow-200',
    status === 'Added' && 'bg-green-200',
    status === 'Removed' && 'bg-red-300'
  );
}

export interface FloorDetailsReassessmentTableColumn {
  key: string;
  label: ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  cellClassName?: string;
  render: (value: unknown, row: MappedFloorDetail, index: number) => ReactNode;
  tooltip?: ReactNode;
}

interface FloorDetailsReassessmentTableProps {
  data: MappedFloorDetail[];
  columns: FloorDetailsReassessmentTableColumn[];
  title?: ReactNode;
  emptyMessage?: ReactNode;

  // Styling Configuration
  tableClassName?: string;
  containerClassName?: string;
  theadClassName?: string;
  tbodyClassName?: string;
  headerCellClassName?: string;
  cellClassName?: string;
  rowClassName?: (row: MappedFloorDetail, index: number) => string;

  // Custom Content
  renderHeader?: () => ReactNode;
  renderFooter?: () => ReactNode;

  // Interaction
  onRowClick?: (row: MappedFloorDetail, index: number) => void;

  // Scroll toggle visibility
  showScrollButtons?: boolean;

  // Scroll container ref
  scrollContainerRef?: React.Ref<HTMLDivElement>;

  // Container ID for auto scroll
  containerId?: string;

  /** Pixels per frame for auto-scroll (default: 0.8) */
  scrollSpeed?: number;

  /** Optional shared controller — stops auto-scroll across multiple tables */
  autoScrollController?: SharedAutoScrollController;

  /** Unique ID for this instance (required when using autoScrollController) */
  instanceId?: string;
}

/**
 * A specialized table component for reassessment floor details (Old/New tax comparison)
 */
export function FloorDetailsReassessmentTable({
  data,
  columns,
  title,
  emptyMessage = 'No data found',
  tableClassName,
  containerClassName,
  theadClassName,
  tbodyClassName,
  headerCellClassName,
  cellClassName,
  rowClassName,
  renderHeader,
  renderFooter,
  onRowClick,
  showScrollButtons = true,
  scrollContainerRef,
  containerId,
  scrollSpeed = 0.8,
  autoScrollController,
  instanceId,
}: FloorDetailsReassessmentTableProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const directionRef = useRef<1 | -1>(1);
  const scrollAccumulatorRef = useRef<number>(0);

  useImperativeHandle(scrollContainerRef, () => containerRef.current as HTMLDivElement, []);

  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  // Position ratio 0..1 based on actual scrollLeft — drives sticky side
  const [scrollRatio, setScrollRatio] = useState(0);

  /** Read the current scroll ratio from the DOM and update state */
  const updateScrollRatio = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const maxScroll = container.scrollWidth - container.clientWidth;
    if (maxScroll <= 0) {
      setScrollRatio(0);
      return;
    }
    const ratio = container.scrollLeft / maxScroll;
    setScrollRatio((prev) => (Math.abs(prev - ratio) > 0.001 ? ratio : prev));
  }, []);

  /** Stop any ongoing auto-scroll (local only) */
  const stopScrollLocal = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    scrollAccumulatorRef.current = 0;
    setIsAutoScrolling(false);
  }, []);

  // Register with shared controller
  useEffect(() => {
    if (!autoScrollController || !instanceId) return;
    const unregister = autoScrollController.register(instanceId, stopScrollLocal);
    return unregister;
  }, [autoScrollController, instanceId, stopScrollLocal]);

  /** Ping-pong scroll */
  const startPingPongScroll = useCallback(
    (initialDirection: 1 | -1) => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      directionRef.current = initialDirection;
      scrollAccumulatorRef.current = 0;
      setIsAutoScrolling(true);

      const step = () => {
        const container = containerRef.current;
        if (!container) {
          setIsAutoScrolling(false);
          return;
        }

        const maxScroll = container.scrollWidth - container.clientWidth;
        if (maxScroll <= 0) {
          animationFrameRef.current = null;
          setIsAutoScrolling(false);
          return;
        }

        scrollAccumulatorRef.current += directionRef.current * scrollSpeed;
        const delta = Math.trunc(scrollAccumulatorRef.current);
        scrollAccumulatorRef.current -= delta;

        const next = container.scrollLeft + delta;

        if (next <= 0) {
          container.scrollLeft = 0;
          directionRef.current = 1;
        } else if (next >= maxScroll) {
          container.scrollLeft = maxScroll;
          directionRef.current = -1;
        } else {
          container.scrollLeft = next;
        }

        updateScrollRatio();
        animationFrameRef.current = requestAnimationFrame(step);
      };

      animationFrameRef.current = requestAnimationFrame(step);
    },
    [scrollSpeed, updateScrollRatio]
  );

  const handleScrollToggle = () => {
    const container = containerRef.current;
    if (!container) return;

    if (autoScrollController?.activeScrollerId) {
      autoScrollController.stopAll();
      return;
    }

    if (isAutoScrolling) {
      stopScrollLocal();
      return;
    }

    const maxScroll = container.scrollWidth - container.clientWidth;
    if (maxScroll <= 0) return;

    if (autoScrollController && instanceId) {
      autoScrollController.setActive(instanceId);
    }

    startPingPongScroll(scrollRatio > 0.5 ? -1 : 1);
  };

  const handleScroll = () => {
    updateScrollRatio();
  };

  /** Stop auto-scroll on any click inside the table (except the scroll toggle button) */
  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    // Ignore clicks on the scroll toggle button
    if (target.closest('[data-scroll-toggle]')) return;

    // Stop auto-scroll if it's running
    if (autoScrollController?.activeScrollerId) {
      autoScrollController.stopAll();
    } else if (isAutoScrolling) {
      stopScrollLocal();
    }
  };

  useEffect(() => {
    updateScrollRatio();
  }, [updateScrollRatio, data, columns]);

  useEffect(() => stopScrollLocal, [stopScrollLocal]);

  const hasScrollButton = showScrollButtons && columns.length > 8;

  // Decide where to insert the sticky scroll-toggle column.
  // If there are many columns, put it near the middle so it remains visible
  // and useful after adding/removing columns. For moderate counts keep it
  // at the 8th column for backwards compatibility.
  const scrollToggleIndex = columns.length > 8 ? Math.floor(columns.length / 2) : 7;

  const isAnyScrolling = autoScrollController
    ? autoScrollController.activeScrollerId !== null
    : isAutoScrolling;

  /**
   * Sticky side derived from actual scroll position (ratio):
   *   - ratio < 0.5 (closer to LEFT)  → stick to RIGHT
   *   - ratio ≥ 0.5 (closer to RIGHT) → stick to LEFT
   */
  const stickySide = scrollRatio >= 0.5 ? 'left-0' : 'right-0';
  const chevronRotated = scrollRatio >= 0.5;

  return (
    <div className="flex-grow flex flex-col min-w-0">
      {title && (
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-sm font-bold text-[#2f5597]">{title}</h4>
        </div>
      )}

      <div
        id={containerId}
        ref={containerRef}
        onScroll={handleScroll}
        onClick={handleContainerClick}
        className={cn(
          'w-full overflow-x-auto bg-white shadow-sm transition-all duration-200 border border-blue-200 rounded-xl',
          containerClassName
        )}
      >
        <table
          className={cn(
            'w-max min-w-full text-[11px] font-medium border-separate border-spacing-x-[3px] border-spacing-y-[2px]',
            tableClassName
          )}
        >
          <thead className={cn('bg-[#e8eef5] text-black font-bold', theadClassName)}>
            {renderHeader?.()}
            <tr>
              {columns.map((col, idx) => (
                <Fragment key={col.key}>
                  <th
                    style={col.width ? { width: col.width, minWidth: col.width } : undefined}
                    className={cn(
                      'px-1.5 py-[3px] whitespace-nowrap text-center font-sans',
                      'bg-[#dbe5f0] border border-[#a9b8cc] rounded shadow-sm',
                      col.align === 'left' && 'text-left',
                      col.align === 'right' && 'text-right',
                      headerCellClassName
                    )}
                  >
                    {typeof col.label === 'string' ? (
                      <span className="font-bold tracking-normal text-[#2f4256] text-[11px]">
                        {col.label}
                      </span>
                    ) : (
                      col.label
                    )}
                  </th>

                  {hasScrollButton && idx === scrollToggleIndex && (
                    <th
                      className={cn(
                        'w-[32px] min-w-[32px] px-1 py-[3px] text-center align-middle sticky z-30 bg-[#e8eef5]',
                        stickySide
                      )}
                    >
                      <button
                        type="button"
                        data-scroll-toggle
                        onClick={handleScrollToggle}
                        className={cn(
                          'inline-flex h-5 w-7 items-center justify-center rounded border shadow-sm cursor-pointer transition-colors',
                          isAnyScrolling
                            ? 'border-red-400/30 bg-red-500 hover:bg-red-600'
                            : 'border-blue-400/30 bg-blue-500 hover:bg-blue-600'
                        )}
                        aria-label={isAnyScrolling ? 'Stop auto scroll' : 'Start auto scroll'}
                      >
                        <ChevronRight
                          className={cn(
                            'h-3 w-3 text-white transition-transform duration-300',
                            chevronRotated && 'rotate-180'
                          )}
                        />
                      </button>
                    </th>
                  )}
                </Fragment>
              ))}
            </tr>
          </thead>

          <tbody className={tbodyClassName}>
            {!data || data.length === 0 ? (
              <tr className="h-[120px] bg-gray-50/30">
                <td
                  colSpan={columns.length + (hasScrollButton ? 1 : 0)}
                  className="px-6 py-10 text-center align-middle"
                >
                  <div className="flex flex-col items-center justify-center gap-2 text-gray-400">
                    <span className="text-sm font-medium italic opacity-80">{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, index) => {
                const baseRowClass = rowClassName
                  ? rowClassName(row, index)
                  : 'transition-colors';

                return (
                  <tr
                    key={index}
                    className={cn(baseRowClass, onRowClick && 'cursor-pointer')}
                    onClick={(e) => {
                      const target = e.target as HTMLElement;
                      if (
                        target.closest('a') ||
                        target.closest('button') ||
                        target.closest('input') ||
                        target.closest('select')
                      ) {
                        return;
                      }
                      onRowClick?.(row, index);
                    }}
                  >
                    {columns.map((col, idx) => (
                      <Fragment key={`${index}-${col.key}`}>
                        <td
                          style={col.width ? { width: col.width, minWidth: col.width } : undefined}
                          className={cn(
                            'text-center align-middle px-0.5 py-[2px]',
                            col.align === 'left' && 'text-left',
                            col.align === 'right' && 'text-right',
                            cellClassName,
                            col.cellClassName
                          )}
                        >
                          {col.render(row[col.key as keyof MappedFloorDetail], row, index)}
                        </td>

                        {hasScrollButton && idx === scrollToggleIndex && (
                          <td
                            className={cn(
                              'px-1 py-[2px] text-center align-middle sticky z-10 bg-white',
                              stickySide
                            )}
                          >
                            <button
                              type="button"
                              data-scroll-toggle
                              onClick={handleScrollToggle}
                              className={cn(
                                'rounded border p-0.5 shadow-sm cursor-pointer flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 mx-auto',
                                isAnyScrolling
                                  ? 'border-red-300 bg-red-50 hover:bg-red-100 hover:border-red-400'
                                  : 'border-blue-200 bg-blue-50/40 hover:bg-blue-50 hover:border-blue-400'
                              )}
                              aria-label={isAnyScrolling ? 'Stop auto scroll' : 'Start auto scroll'}
                            >
                              <ChevronRight
                                className={cn(
                                  'h-3 w-3 transition-transform duration-300',
                                  isAnyScrolling ? 'text-red-600' : 'text-blue-600',
                                  chevronRotated && 'rotate-180'
                                )}
                              />
                            </button>
                          </td>
                        )}
                      </Fragment>
                    ))}
                  </tr>
                );
              })
            )}
            {renderFooter?.()}
          </tbody>
        </table>
      </div>
    </div>
  );
}