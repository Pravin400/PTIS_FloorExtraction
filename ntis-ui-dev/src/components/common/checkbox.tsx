'use client';

import * as React from 'react';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { CheckboxProps } from '@/types/common.types';

// internal state type for aria/data-state values
export type CheckboxState = 'checked' | 'unchecked';

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
    (
        {
            className,
            checked: controlledChecked,
            defaultChecked = false,
            onCheckedChange,
            disabled = false,
            name,
            value,
            label,
            onClick,
            onKeyDown,
            id: providedId,
            indeterminate = false,
            ...restProps
        },
        ref
    ): React.ReactNode => {
        /* ---- state --------------------------------------------------- */
        const generatedId = React.useId();
        const id = providedId || generatedId;
        const isControlled: boolean = controlledChecked !== undefined;
        const [internalChecked, setInternalChecked] = React.useState<boolean>(defaultChecked);
        const isChecked: boolean = (isControlled ? controlledChecked : internalChecked) ?? false;
        const dataState: CheckboxState | 'indeterminate' = indeterminate
            ? 'indeterminate'
            : isChecked
            ? 'checked'
            : 'unchecked';

        const inputRef = React.useRef<HTMLInputElement>(null);
        React.useEffect(() => {
            if (inputRef.current) {
                inputRef.current.indeterminate = !!indeterminate;
            }
        }, [indeterminate]);

        /* ---- handlers ------------------------------------------------ */
        const toggle = React.useCallback((): void => {
            if (disabled) return;
            const next = !isChecked;

            if (!isControlled) {
                setInternalChecked(next);
            }

            onCheckedChange?.(next);
        }, [disabled, isChecked, isControlled, onCheckedChange]);

        const handleClick = React.useCallback(
            (e: React.MouseEvent<HTMLButtonElement>): void => {
                onClick?.(e);
                if (!e.defaultPrevented) toggle();
            },
            [onClick, toggle]
        );

        const handleKeyDown = React.useCallback(
            (e: React.KeyboardEvent<HTMLButtonElement>): void => {
                onKeyDown?.(e);
                if (!e.defaultPrevented) {
                    if (e.key === ' ') {
                        e.preventDefault();
                        toggle();
                    } else if (e.key === 'Enter') {
                        // Prevent button's native Enter-to-click behavior
                        // per ARIA spec: only Space should toggle checkboxes
                        e.preventDefault();
                    }
                }
            },
            [onKeyDown, toggle]
        );

        /* ---- render -------------------------------------------------- */
        const checkboxContent = (
            <div className="relative inline-flex items-center justify-center shrink-0">
                <input
                    ref={inputRef}
                    type="checkbox"
                    name={name}
                    value={value}
                    checked={isChecked}
                    readOnly
                    disabled={disabled}
                    tabIndex={-1}
                    aria-hidden="true"
                    className="absolute opacity-0 w-0 h-0 pointer-events-none"
                />
                <button
                    ref={ref}
                    id={id}
                    type="button"
                    role="checkbox"
                    aria-checked={indeterminate ? 'mixed' : isChecked}
                    data-state={dataState}
                    disabled={disabled}
                    className={cn(
                        'peer inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-primary shadow',
                        'transition-colors duration-150 ease-in-out',
                        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        (isChecked || indeterminate) && 'bg-primary text-primary-foreground',
                        className
                    )}
                    onClick={handleClick}
                    onKeyDown={handleKeyDown}
                    {...restProps}
                >
                    {indeterminate ? (
                        <Minus className="h-3.5 w-3.5" />
                    ) : isChecked ? (
                        <Check className="h-3.5 w-3.5" />
                    ) : null}
                </button>
            </div>
        );

        if (label) {
            return (
                <div className="flex items-center gap-2">
                    {checkboxContent}
                    <label
                        htmlFor={id}
                        className={cn(
                            "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer",
                            disabled && "cursor-not-allowed opacity-50"
                        )}
                    >
                        {label}
                    </label>
                </div>
            );
        }

        return checkboxContent;
    }
);

Checkbox.displayName = 'Checkbox';

export { Checkbox };
