'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useId, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';

/* ============================================================
   Dev Warning Utility
 ============================================================ */

/**
 * Logs a warning message in development mode only.
 * Centralizes dev warnings for easier management and potential future enhancements
 * like error tracking integration.
 */
function devWarning(message: string): void {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(message);
  }
}

/* ============================================================
   Types
 ============================================================ */

export type TabValue = string | number;
export type TabVariant = 'line' | 'pills';
export type TabSize = 'sm' | 'md' | 'lg';
export type TabOrientation = 'horizontal' | 'vertical';
export type TabJustify = 'start' | 'center' | 'end' | 'between';

export interface TabItem {
  /** Unique value key for the tab */
  value: TabValue;
  /** Label to display in the tab trigger */
  label: React.ReactNode;
  /** Content to display when tab is active */
  content: React.ReactNode;
  /** Optional icon */
  icon?: React.ElementType;
  /** Disable this specific tab */
  disabled?: boolean;
  /** Custom class for the tab trigger */
  className?: string;
  /** Custom class for the tab panel */
  panelClassName?: string;
}

interface TabsContextType {
  activeValue: TabValue | undefined;
  setActiveValue: (value: TabValue) => void;
  variant: TabVariant;
  size: TabSize;
  orientation: TabOrientation;
  justify: TabJustify;
  fullWidth: boolean;
  baseId: string;
  activeTabClassName?: string;
}

export interface TabsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Active value (controlled mode) */
  value?: TabValue;
  /** Default active value (uncontrolled mode) */
  defaultValue?: TabValue;
  /** Callback when active value changes */
  onChange?: (value: TabValue) => void;
  /** Visual variant of the tabs */
  variant?: TabVariant;
  /** Size of the tabs */
  size?: TabSize;
  /** Layout orientation */
  orientation?: TabOrientation;
  /** Flex alignment of the tabs */
  justify?: TabJustify;
  /** If true, tabs grow to fill container */
  fullWidth?: boolean;
  /** Shortcut API: Pass items directly to render tabs */
  items?: TabItem[];
  /** Custom class for the internal TabList (only with items prop) */
  tabListClassName?: string;
  /** Custom class for the internal TabPanel (only with items prop) */
  tabPanelClassName?: string;
  /** Custom class for the active tab trigger */
  activeTabClassName?: string;
  children?: React.ReactNode;
}

export interface TabListProps extends React.HTMLAttributes<HTMLDivElement> {
  /** If true, enables Horizontal Scroll for tabs */
  scrollable?: boolean;
  children: React.ReactNode;
}

export interface TabProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Value identifying the tab */
  value: TabValue;
  /** Optional icon */
  icon?: React.ElementType;
  children: React.ReactNode;
  disabled?: boolean;
}

export interface TabPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Value matching the tab trigger */
  value: TabValue;
  children: React.ReactNode;
}

/* ============================================================
   Context
 ============================================================ */

const TabsContext = createContext<TabsContextType | null>(null);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used inside <Tabs />');
  }
  return context;
}

/* ============================================================
   Tabs Root
 ============================================================ */

/**
 * Root component for Tabs system.
 * Handles state and provides context for children.
 *
 * Can be used in "Shortcut Mode" by passing `items`, or "Compound Mode" by composing children.
 */
const TabsRoot = React.forwardRef<HTMLDivElement, TabsProps>(
  (
    {
      value,
      defaultValue,
      onChange,
      variant = 'line',
      size = 'md',
      orientation = 'horizontal',
      justify = 'start',
      fullWidth = false,
      items,
      className,
      tabListClassName,
      tabPanelClassName,
      activeTabClassName,
      children,
      ...props
    },
    ref
  ) => {
    const baseId = useId();
    const isControlled = value !== undefined;

    // Determine initial uncontrolled value:
    // - Prefer explicit defaultValue when provided
    // - Otherwise, fall back to the first non-disabled item (if any)
    // - If using the compound API (no items) and no defaultValue, this will be undefined
    const initialUncontrolledValue: TabValue | undefined =
      defaultValue !== undefined ? defaultValue : items?.find((item) => !item.disabled)?.value;

    const [internalValue, setInternalValue] = useState<TabValue | undefined>(
      initialUncontrolledValue
    );

    // logic: safe access without assertions (!) to prevent crash if both are undefined
    const activeValue = isControlled ? value : internalValue;

    // Track if the "no initial value" warning has been shown to prevent duplicate logs
    const noInitialValueWarnedRef = useRef(false);

    // In dev, warn when using the compound API without an initial value,
    // as this leaves all panels empty and can break keyboard expectations.
    // Only warn once per component instance, wrapped in useEffect to avoid accessing ref during render.
    useEffect(() => {
      if (
        !noInitialValueWarnedRef.current &&
        !isControlled &&
        defaultValue === undefined &&
        !items &&
        activeValue === undefined
      ) {
        noInitialValueWarnedRef.current = true;
        devWarning(
          'Tabs: No initial value provided. When using the compound API, pass either `value` or `defaultValue` for better UX and accessibility.'
        );
      }
    }, [isControlled, defaultValue, items, activeValue]);

    useEffect(() => {
      if (isControlled && !onChange) {
        devWarning(
          'Tabs: You provided a `value` prop to a Tabs component without an `onChange` handler. This will render a read-only tabs element.'
        );
      }
    }, [isControlled, onChange]);

    // Track pending value change for controlled mode warning
    const pendingValueRef = useRef<TabValue | null>(null);

    // Clean up ref on unmount to prevent stale data warnings
    useEffect(() => {
      return () => {
        pendingValueRef.current = null;
      };
    }, []);

    useEffect(() => {
      if (
        isControlled &&
        pendingValueRef.current !== null &&
        value !== pendingValueRef.current
      ) {
        devWarning(
          `Tabs: The \`value\` prop did not update to "${pendingValueRef.current}" after \`onChange\` was called. ` +
          'This may cause the component to be in an inconsistent state. ' +
          'Make sure the parent component updates the controlled value in the onChange handler.'
        );
      }
      pendingValueRef.current = null;
    }, [value, isControlled]);

    const setActiveValue = useCallback(
      (val: TabValue) => {
        if (!isControlled) {
          setInternalValue(val);
        } else {
          // Track the expected value for controlled mode warning (dev only)
          pendingValueRef.current = val;
        }
        onChange?.(val);
      },
      [isControlled, onChange]
    );

    const isVertical = orientation === 'vertical';

    return (
      <TabsContext.Provider
        value={{
          activeValue,
          setActiveValue,
          variant,
          size,
          orientation,
          justify,
          fullWidth,
          baseId,
          activeTabClassName,
        }}
      >
        <div
          ref={ref}
          className={cn(
            
            isVertical ? 'flex flex-col md:flex-row gap-6' : 'flex flex-col',
            className
          )}
          {...props}
        >
          {items ? (
            <>
              <TabList className={cn(isVertical && 'md:w-64', tabListClassName)}>
                {items.map((item) => (
                  <Tab
                    key={item.value}
                    value={item.value}
                    icon={item.icon}
                    disabled={item.disabled}
                    className={item.className}
                  >
                    {item.label}
                  </Tab>
                ))}
              </TabList>
              <div className="flex-1">
                {items.map((item) => (
                  <TabPanel
                    key={item.value}
                    value={item.value}
                    className={cn(tabPanelClassName, item.panelClassName)}
                  >
                    {item.content}
                  </TabPanel>
                ))}
              </div>
            </>
          ) : (
            children
          )}
        </div>
      </TabsContext.Provider>
    );
  }
);

TabsRoot.displayName = 'Tabs';

/* ============================================================
   Tab List
 ============================================================ */

/**
 * Container for Tab triggers. Handles keyboard navigation between tabs.
 * Must be used inside a Tabs component.
 *
 * @example
 * <Tabs defaultValue="tab1">
 *   <TabList>
 *     <Tab value="tab1">Tab 1</Tab>
 *     <Tab value="tab2">Tab 2</Tab>
 *   </TabList>
 *   ...
 * </Tabs>
 */
export const TabList = React.forwardRef<HTMLDivElement, TabListProps>(
  ({ children, scrollable = true, className, ...props }, ref) => {
    const listRef = useRef<HTMLDivElement>(null);
    const { variant, orientation, justify } = useTabsContext();
    const isVertical = orientation === 'vertical';

    // Sync external ref if provided
    // Return listRef.current directly - it may be null before mount
    React.useImperativeHandle(ref, () => listRef.current as HTMLDivElement);

    const handleKeyDown = (e: React.KeyboardEvent) => {
      const tabs =
        listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]:not([disabled])') ?? [];

      if (!tabs.length) return;

      const currentIndex = Array.from(tabs).findIndex((tab) => tab === document.activeElement);

      let nextIndex: number;

      // WAI-ARIA: Use ArrowLeft/ArrowRight for horizontal tabs, ArrowUp/ArrowDown for vertical
      // Handle edge case when no tab has focus (currentIndex === -1)
      switch (e.key) {
        case 'ArrowRight':
          if (isVertical) return; // Only for horizontal tabs
          nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % tabs.length;
          break;
        case 'ArrowDown':
          if (!isVertical) return; // Only for vertical tabs
          nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % tabs.length;
          break;
        case 'ArrowLeft':
          if (isVertical) return; // Only for horizontal tabs
          nextIndex = currentIndex === -1 ? tabs.length - 1 : (currentIndex - 1 + tabs.length) % tabs.length;
          break;
        case 'ArrowUp':
          if (!isVertical) return; // Only for vertical tabs
          nextIndex = currentIndex === -1 ? tabs.length - 1 : (currentIndex - 1 + tabs.length) % tabs.length;
          break;
        case 'Home':
          nextIndex = 0;
          break;
        case 'End':
          nextIndex = tabs.length - 1;
          break;
        default:
          return;
      }

      if (tabs[nextIndex]) {
        e.preventDefault();
        // Automatically activate the newly focused tab for better keyboard UX
        tabs[nextIndex].focus();
        tabs[nextIndex].click();
      }
    };

    const justifyStyles = {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
    };

    const variantStyles = {
      line: isVertical ? 'border-r border-gray-200 pr-0' : 'border-b border-gray-200',
      pills: 'bg-gray-100 p-1 rounded-xl',
    };

    return (
      <div
        ref={listRef}
        role="tablist"
        aria-orientation={orientation}
        className={cn(
          'flex',
          isVertical ? 'flex-col w-full' : 'flex-row items-center',
          scrollable && !isVertical && 'overflow-x-auto',
          !isVertical && justifyStyles[justify],
          variantStyles[variant],
          className
        )}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {children}
      </div>
    );
  }
);

TabList.displayName = 'TabList';

/* ============================================================
   Tab (Trigger)
 ============================================================ */

/**
 * Individual tab trigger button. Activates the corresponding TabPanel when clicked.
 * Must be used inside a TabList component.
 *
 * @example
 * <Tab value="settings" icon={SettingsIcon} disabled={false}>
 *   Settings
 * </Tab>
 */
export const Tab = React.forwardRef<HTMLButtonElement, TabProps>(
  ({ value, icon: Icon, children, className, disabled, onClick, ...props }, ref) => {
    const { activeValue, setActiveValue, variant, size, orientation, fullWidth, baseId, activeTabClassName } =
      useTabsContext();
    const isActive = activeValue === value;
    const isVertical = orientation === 'vertical';

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-xs gap-1.5',
      md: 'px-4 py-2 text-sm gap-2',
      lg: 'px-6 py-3 text-base gap-2.5',
    };

    const iconSizes = {
      sm: 'w-3.5 h-3.5',
      md: 'w-4 h-4',
      lg: 'w-5 h-5',
    };

    const variantStyles = {
      line: cn(
        'relative font-medium transition-all duration-200',
        isVertical ? 'border-r-2 -mr-px text-left justify-start' : 'border-b-2 -mb-px',
        disabled
          ? 'cursor-not-allowed border-transparent text-gray-400 opacity-50'
          : isActive
            ? cn('border-blue-600 text-blue-600', isVertical && 'bg-blue-50/50')
            : cn(
              'border-transparent text-gray-500 hover:text-gray-700',
              isVertical ? 'hover:bg-gray-50' : 'hover:border-gray-300'
            )
      ),
      pills: cn(
        'rounded-lg font-medium transition-all duration-200',
        disabled
          ? 'cursor-not-allowed text-gray-400 opacity-50'
          : isActive
            ? cn('bg-white text-blue-600 shadow-sm', activeTabClassName)
            : 'text-gray-500 hover:bg-gray-200/50 hover:text-gray-700'
      ),
    };

    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        id={`${baseId}-tab-${value}`}
        aria-selected={isActive}
        data-state={isActive ? 'active' : 'inactive'}
        aria-controls={`${baseId}-panel-${value}`}
        tabIndex={disabled ? -1 : isActive ? 0 : -1}
        disabled={disabled}
        aria-disabled={disabled}
        className={cn(
          'inline-flex items-center whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-all',
          fullWidth && 'flex-1',
          sizeStyles[size],
          variantStyles[variant],
          className
        )}
        onClick={(e) => {
          if (!disabled) {
            setActiveValue(value);
            onClick?.(e);
          }
        }}
        {...props}
      >
        {Icon && <Icon className={cn('flex-shrink-0', iconSizes[size])} />}
        <span>{children}</span>
      </button>
    );
  }
);

Tab.displayName = 'Tab';

/* ============================================================
   Tab Panel
 ============================================================ */

/**
 * Content panel that is displayed when its corresponding Tab is active.
 * Must be used inside a Tabs component.
 *
 * @example
 * <TabPanel value="settings">
 *   <p>Settings content goes here</p>
 * </TabPanel>
 */
export const TabPanel = React.forwardRef<HTMLDivElement, TabPanelProps>(
  ({ value, children, className, ...props }, ref) => {
    const { activeValue, orientation, baseId } = useTabsContext();
    const isVertical = orientation === 'vertical';

    if (activeValue !== value) return null;

    return (
      <div
        ref={ref}
        role="tabpanel"
        id={`${baseId}-panel-${value}`}
        aria-labelledby={`${baseId}-tab-${value}`}
        className={cn('animate-in fade-in duration-300', !isVertical && 'mt-4', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

TabPanel.displayName = 'TabPanel';

/* ============================================================
   Compound Export
 ============================================================ */

const Tabs = TabsRoot as typeof TabsRoot & {
  TabList: typeof TabList;
  Tab: typeof Tab;
  TabPanel: typeof TabPanel;
};

Tabs.TabList = TabList;
Tabs.Tab = Tab;
Tabs.TabPanel = TabPanel;

export { Tabs };
