'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils/cn';

export type ContextMenuItem =
  | {
      key?: string;
      separator: true;
      label?: never;
      icon?: never;
      onClick?: never;
      shortcut?: never;
      disabled?: never;
      danger?: never;
    }
  | {
      key?: string;
      separator?: false;
      label: string;
      icon?: React.ElementType;
      onClick?: () => void;
      shortcut?: string;
      disabled?: boolean;
      danger?: boolean;
    };

export interface ContextMenuProps {
  items: ContextMenuItem[];
  children: React.ReactNode;
  className?: string;
}

/**
 * Helper to calculate menu position.
 */
function calculateMenuPosition(
  x: number,
  y: number,
  winWidth: number,
  winHeight: number,
  options?: { menuWidth?: number; menuHeight?: number }
) {
  const defaultMenuWidth = 192;
  const defaultMenuHeight = 200;
  const menuWidth = options?.menuWidth ?? defaultMenuWidth;
  const menuHeight = options?.menuHeight ?? defaultMenuHeight;
  const flipX = x + menuWidth > winWidth;
  const flipY = y + menuHeight > winHeight;
  return { flipX, flipY };
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ items, children, className }) => {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0, flipX: false, flipY: false });

  // Track the currently highlighted item index
  const [activeIndex, setActiveIndex] = useState(-1);
  const menuRef = useRef<HTMLDivElement>(null);

  // When menu opens, focus it
  useEffect(() => {
    if (visible && menuRef.current) {
      menuRef.current.focus();
    }
  }, [visible]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const x = e.clientX;
    const y = e.clientY;
    let flipX = false;
    let flipY = false;

    if (typeof window !== 'undefined') {
      const result = calculateMenuPosition(x, y, window.innerWidth, window.innerHeight);
      flipX = result.flipX;
      flipY = result.flipY;
    }

    setPosition({ x, y, flipX, flipY });
    setActiveIndex(-1); // Reset selection when opening
    setVisible(true);
  }, []);

  const handleClickOutside = useCallback((e: Event) => {
    if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
      setVisible(false);
    }
  }, []);

  const handleGlobalKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setVisible(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('scroll', handleClickOutside, true);
      // Add global KeyDown listener for Escape to close menu even if focus is lost
      document.addEventListener('keydown', handleGlobalKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', handleClickOutside, true);
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [visible, handleClickOutside, handleGlobalKeyDown]);

  const handleItemClick = (item: ContextMenuItem) => {
    if (item.disabled) return;
    setVisible(false);
    item.onClick?.();
  };

  // --- Keyboard Navigation Logic ---
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!visible) return;

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        setVisible(false);
        break;

      case 'ArrowDown':
        e.preventDefault();
        navigateMenu(1);
        break;

      case 'ArrowUp':
        e.preventDefault();
        navigateMenu(-1);
        break;

      case 'Enter':
      case ' ': // Space bar
        e.preventDefault();
        if (activeIndex !== -1) {
          const item = items[activeIndex];
          if (item && !item.separator) {
            handleItemClick(item);
          }
        }
        break;
    }
  };

  // Helper to skip separators and wrap around
  const navigateMenu = (direction: number) => {
    // Safety guard: if no items or all items are separators OR disabled, do nothing
    if (!items.length || items.every((item) => item.separator || item.disabled)) return;

    let nextIndex = activeIndex + direction;
    const length = items.length;

    // Loop until we find a non-separator, enabled item or complete a full cycle
    // (Safety guard: loop max length times)
    for (let i = 0; i < length; i++) {
      // Handle wrapping
      if (nextIndex < 0) nextIndex = length - 1;
      if (nextIndex >= length) nextIndex = 0;

      const currentItem = items[nextIndex];
      // Check separator first to properly narrow the discriminated union type
      if (!currentItem.separator && !currentItem.disabled) {
        setActiveIndex(nextIndex);
        return;
      }
      nextIndex += direction;
    }
  };

  return (
    // Use Tailwind `contents` so this wrapper doesn't affect layout/DOM flow.
    // This keeps the trigger visually unchanged while still handling contextmenu events.
    <div
      onContextMenu={handleContextMenu}
      className={cn('contents', className)}
      aria-haspopup="menu"
    >
      {children}
      {visible &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            tabIndex={-1} // Make div focusable so it can catch key events
            onKeyDown={handleKeyDown}
            className="fixed z-[9999] outline-none" // outline-none to remove browser focus ring
            role="menu"
            aria-orientation="vertical"
            style={{
              top: position.y,
              left: position.x,
              transform: `translate(${position.flipX ? '-100%' : '0'}, ${position.flipY ? '-100%' : '0'})`,
            }}
          >
            <div className="min-w-[12rem] overflow-hidden rounded-md border border-gray-200 bg-white/95 p-1 shadow-lg backdrop-blur-sm ring-1 ring-black ring-opacity-5">
              {(() => {
                // Generate stable keys without falling back to array index
                let separatorAutoId = 0;
                const labelAutoIdMap = new Map<string, number>();

                return items.map((item, index) => {
                  let itemKey: string;

                  if (item.key) {
                    itemKey = item.key;
                  } else if (item.separator) {
                    separatorAutoId += 1;
                    itemKey = `sep-auto-${separatorAutoId}`;
                  } else {
                    // For non-separator items, use label plus an occurrence counter
                    // TypeScript enforces that non-separator items have a label
                    const baseLabel = item.label;
                    const currentCount = labelAutoIdMap.get(baseLabel) ?? 0;
                    const nextCount = currentCount + 1;
                    labelAutoIdMap.set(baseLabel, nextCount);
                    itemKey = `${baseLabel}-${nextCount}`;
                  }

                  const isActive = index === activeIndex;

                  if (item.separator) {
                    return <div key={itemKey} className="my-1 h-px bg-gray-100" role="separator" />;
                  }

                  // If not a separator, label is required for rendering
                  if (!item.label) return null;

                  const Icon = item.icon;
                  return (
                    <button
                      key={itemKey}
                      role="menuitem"
                      tabIndex={-1} // Remove items from natural tab order; managed by arrow keys
                      onClick={() => handleItemClick(item)}
                      onMouseEnter={() => !item.disabled && setActiveIndex(index)} // Sync mouse hover with keyboard state
                      disabled={item.disabled}
                      aria-disabled={item.disabled}
                      className={cn(
                        'flex w-full cursor-default select-none items-center rounded px-2 py-1.5 text-sm font-medium outline-none transition-colors',
                        {
                          'bg-blue-50 text-blue-700': isActive && !item.danger,
                          'bg-red-50 text-red-600': isActive && item.danger,
                          'text-gray-700': !isActive,
                          'text-red-600': !isActive && item.danger,
                          'cursor-not-allowed opacity-50': item.disabled,
                        }
                      )}
                    >
                      {Icon && (
                        <Icon
                          className={cn('mr-2.5 h-4 w-4 transition-colors', {
                            'text-red-500': item.danger,
                            'text-blue-600': isActive && !item.danger,
                            'text-gray-500': !isActive && !item.danger,
                          })}
                        />
                      )}
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.shortcut && (
                        <span className="ml-auto text-xs tracking-tight text-gray-400">
                          {item.shortcut}
                        </span>
                      )}
                    </button>
                  );
                });
              })()}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
