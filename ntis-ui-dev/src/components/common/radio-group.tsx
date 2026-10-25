'use client';

import * as React from 'react';
import { Circle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
// local string literal type for data-state attribute
export type RadioState = 'checked' | 'unchecked';
import { RadioGroupProps, RadioGroupItemProps } from '@/types/common.types';

// internal context value shape, not exported publicly
interface RadioGroupContextValue {
    name: string;
    value: string;
    onValueChange: (value: string) => void;
    disabled: boolean;
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(null);

function useRadioGroupContext(): RadioGroupContextValue {
    const ctx = React.useContext(RadioGroupContext);
    if (!ctx) {
        throw new Error('RadioGroupItem must be used within a <RadioGroup>');
    }
    return ctx;
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
    (
        {
            className,
            value: controlledValue,
            defaultValue = '',
            onValueChange,
            disabled = false,
            name,
            children,
            ...restProps
        },
        ref
    ): React.ReactElement => {
        /* ---- generate a stable name if none provided ----------------- */
        const autoName: string = React.useId();
        const groupName: string = name ?? autoName;

        /* ---- controlled / uncontrolled state ------------------------- */
        const isControlled: boolean = controlledValue !== undefined;
        const [internalValue, setInternalValue] = React.useState<string>(defaultValue);
        // after the `isControlled` check we know controlledValue isn’t undefined
        const currentValue: string =
            isControlled && controlledValue != null ? controlledValue : internalValue;

        const handleValueChange = React.useCallback(
            (next: string): void => {
                if (!isControlled) {
                    setInternalValue(next);
                }
                onValueChange?.(next);
            },
            [isControlled, onValueChange]
        );

        /* ---- context value ------------------------------------------ */
        const ctx = React.useMemo<RadioGroupContextValue>(
            () => ({
                name: groupName,
                value: currentValue,
                onValueChange: handleValueChange,
                disabled,
            }),
            [groupName, currentValue, handleValueChange, disabled]
        );

        return (
            <RadioGroupContext.Provider value={ctx}>
                <div
                    ref={ref}
                    role="radiogroup"
                    aria-disabled={disabled || undefined}
                    className={cn('grid gap-2', className)}
                    {...restProps}
                >
                    {children}
                </div>
            </RadioGroupContext.Provider>
        );
    }
);

RadioGroup.displayName = 'RadioGroup';

const RadioGroupItem = React.forwardRef<HTMLButtonElement, RadioGroupItemProps>(
    (
        { className, value, disabled: itemDisabled, children, ...restProps },
        ref
    ): React.ReactElement => {
        const { onValueChange, value: groupValue, disabled: groupDisabled, name: groupName } = useRadioGroupContext();

        const isSelected = groupValue === value;
        const isDisabled = groupDisabled || itemDisabled || false;
        const dataState = isSelected ? 'checked' : 'unchecked';

        /* ---- detect if this is the first radio in the group ---------- */
        const btnRef = React.useRef<HTMLButtonElement | null>(null);
        const [isFirstItem, setIsFirstItem] = React.useState(false);

        const setRefs = React.useCallback(
            (node: HTMLButtonElement | null) => {
                btnRef.current = node;
                // forward the external ref
                if (typeof ref === 'function') {
                    ref(node);
                } else if (ref) {
                    (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
                }
                // check if this is the first radio button in the group
                if (node) {
                    const container = node.closest('[role="radiogroup"]');
                    if (container) {
                        const first = container.querySelector('button[role="radio"]');
                        setIsFirstItem(first === node);
                    }
                }
            },
            [ref]
        );

        const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
            if (!isDisabled && !isSelected) {
                onValueChange(value);
            }
            restProps.onClick?.(e);
        };

        const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
            if (isDisabled) return;

            if (e.key === ' ') {
                e.preventDefault();
                onValueChange(value);
            }

            const isArrowDown = e.key === 'ArrowDown' || e.key === 'ArrowRight';
            const isArrowUp = e.key === 'ArrowUp' || e.key === 'ArrowLeft';

            if (isArrowDown || isArrowUp) {
                e.preventDefault();
                const container = e.currentTarget.closest('[role="radiogroup"]');
                if (!container) return;

                const radios = Array.from(
                    container.querySelectorAll<HTMLButtonElement>('button[role="radio"]:not([disabled])')
                );
                const currentIndex = radios.indexOf(e.currentTarget);
                if (currentIndex === -1) return;

                const length = radios.length;
                let nextIndex = currentIndex;

                if (isArrowDown) {
                    nextIndex = (currentIndex + 1) % length;
                } else {
                    nextIndex = (currentIndex - 1 + length) % length;
                }

                const nextRadio = radios[nextIndex];
                nextRadio.focus();
                // Roving focus: usually also selects the item in radio groups
                // We use the value attribute from the DOM element since we don't have access to the react prop of the sibling
                const nextValue = nextRadio.dataset.value || '';
                onValueChange(nextValue);
            }

            restProps.onKeyDown?.(e);
        };

        return (
            <>
                <input
                    type="radio"
                    name={groupName}
                    value={value}
                    checked={isSelected}
                    readOnly
                    disabled={isDisabled}
                    tabIndex={-1}
                    aria-hidden="true"
                    className="sr-only"
                />
                <button
                    ref={setRefs}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    data-state={dataState}
                    disabled={isDisabled}
                    data-value={value}
                    tabIndex={isSelected || (!groupValue && isFirstItem) ? 0 : -1}
                    className={cn(
                        'aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow',
                        'inline-flex items-center justify-center',
                        'transition-colors duration-150 ease-in-out',
                        'focus:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        className
                    )}
                    {...restProps}
                    onClick={handleClick}
                    onKeyDown={handleKeyDown}
                >
                    {isSelected && <Circle className="h-2.5 w-2.5 fill-current text-current" />}
                    {children}
                </button>
            </>
        );
    }
);

RadioGroupItem.displayName = 'RadioGroupItem';

export { RadioGroup, RadioGroupItem };
