/**
 * Shared table cell rendering utilities for PTIS modules.
 * Provides consistent cell rendering across rateable, capital, and dual method tables.
 */

/**
 * Renders a simple cell box with a value and fallback.
 *
 * @param value - The value to display
 * @param className - CSS class name for the cell
 * @param fallback - Fallback value when value is empty (default: '-')
 * @returns React element with the rendered cell
 */
export function renderCellBox(value: string, className: string, fallback = '-') {
  return <span className={className}>{value || fallback}</span>;
}

export function renderCellBoxWithTooltip(value: string, className: string, fallback = '-') {
  const displayValue = value || fallback;
  return (
    <span
      className={className}
      tabIndex={0}
      title={displayValue !== fallback ? displayValue : undefined}
    >
      {displayValue}
    </span>
  );
}
