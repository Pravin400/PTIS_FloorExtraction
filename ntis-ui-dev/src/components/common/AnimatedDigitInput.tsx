'use client';

import React, { useId, useState } from 'react';
import { cn } from '@/lib/utils/cn';
import type { AnimatedDigitInputProps } from '@/types/asset/municipal-Asset/new-add-new-asset/common-ui.types';

export type { AnimatedDigitInputProps };

export const AnimatedDigitInput = React.forwardRef<HTMLInputElement, AnimatedDigitInputProps>(
    ({ value, onChange, maxLength, placeholder = '', allowedPattern = /^[0-9.]$/, className, disabled, label, error, helperText, fullWidth = true, required, charClassName, onFocus, ...props }, ref) => {
        const safeValue = value != null ? String(value) : '';
        const generatedId = useId();
        const inputId = props.id || `animated-digit-input-${generatedId}`;

        const [lastTypedIndex, setLastTypedIndex] = useState<number>(-1);

        React.useEffect(() => {
            if (lastTypedIndex !== -1) {
                const timer = setTimeout(() => {
                    setLastTypedIndex(-1);
                }, 300); // Clear animation state after it completes
                return () => clearTimeout(timer);
            }
        }, [lastTypedIndex]);

        const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const rawVal = e.target.value;
            const prevVal = safeValue;

            // Filter characters based on allowed pattern
            let filtered = '';
            for (const char of rawVal) {
                if (allowedPattern.test(char)) {
                    filtered += char;
                }
            }
            if (maxLength !== undefined) {
                filtered = filtered.slice(0, maxLength);
            }

            if (filtered.length > prevVal.length) {
                setLastTypedIndex(filtered.length - 1);
            } else {
                setLastTypedIndex(-1);
            }

            onChange(filtered);
        };

        const isCentered = className?.includes('text-center');

        return (
            <div className={cn('flex flex-col', fullWidth && 'w-full')}>
                {label && (
                    <label htmlFor={inputId} className="mb-1.5 text-sm font-medium text-gray-700">
                        {label}
                        {required && <span className="text-red-500"> *</span>}
                    </label>
                )}
                <div className={cn(
                    "relative w-full rounded-lg border overflow-hidden flex items-center transition-all duration-200 h-9",
                    error ? 'border-red-500 focus-within:ring-red-500 focus-within:ring-2 focus-within:border-transparent' : 'border-gray-300 hover:border-gray-400 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200',
                    disabled ? "bg-gray-100/80 cursor-not-allowed grayscale" : "bg-white",
                    className
                )}>
                    {/* Hidden but functional real input overlaying the whole field */}
                    <input
                        {...props}
                        id={inputId}
                        ref={ref}
                        type="text"
                        maxLength={maxLength}
                        value={safeValue}
                        placeholder={placeholder}
                        onChange={handleInputChange}
                        onFocus={(e) => {
                            e.target.select();
                            onFocus?.(e);
                        }}
                        onKeyDown={(e) => {
                            const controlKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'];
                            if (!allowedPattern.test(e.key) && !controlKeys.includes(e.key) && !e.ctrlKey && !e.metaKey) {
                                e.preventDefault();
                            }
                            props.onKeyDown?.(e);
                        }}
                        disabled={disabled}
                        required={required}
                        aria-describedby={
                            error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
                        }
                        className={cn(
                            "absolute inset-0 w-full h-full bg-transparent cursor-text z-10 focus:outline-none tabular-nums",
                            "font-semibold caret-blue-600",
                            className?.includes('text-xs') ? 'text-xs' : 'text-sm',
                            isCentered ? 'text-center px-1' : 'px-3 tracking-[1px]',
                            "placeholder:text-gray-400 placeholder:font-normal placeholder:tracking-normal",
                            lastTypedIndex !== -1 ? "text-transparent" : "text-gray-800",
                            disabled && "cursor-not-allowed",
                            charClassName
                        )}
                    />

                    {/* Visual representation of characters (only visible during animation) */}
                    <div className={cn(
                        "absolute inset-0 flex items-center pointer-events-none select-none overflow-hidden text-gray-800",
                        isCentered ? 'justify-center px-1' : 'px-3',
                        lastTypedIndex !== -1 ? "visible" : "invisible"
                    )}>
                        <div className={cn(
                            "font-semibold tabular-nums whitespace-pre w-full",
                            className?.includes('text-xs') ? 'text-xs' : 'text-sm',
                            isCentered ? 'text-center' : 'tracking-[1px]',
                            charClassName
                        )}>
                            {safeValue.length === 0 ? null : (
                                safeValue.split('').map((char, index) => {
                                    const shouldAnimate = index === lastTypedIndex;
                                    if (shouldAnimate) {
                                        return (
                                            <span
                                                key={`${index}-${char}`}
                                                className="inline-block animate-digit-pop"
                                            >
                                                {char}
                                            </span>
                                        );
                                    }
                                    return char;
                                })
                            )}
                        </div>
                    </div>
                </div>
                {error && (
                    <span id={`${inputId}-error`} className="mt-1 text-sm text-red-600">
                        {error}
                    </span>
                )}
                {helperText && !error && (
                    <span id={`${inputId}-helper`} className="mt-1 text-sm text-gray-500">
                        {helperText}
                    </span>
                )}
            </div>
        );
    }
);

AnimatedDigitInput.displayName = 'AnimatedDigitInput';
