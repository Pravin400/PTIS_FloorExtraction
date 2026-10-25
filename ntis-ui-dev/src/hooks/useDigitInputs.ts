import { useState, useRef, useCallback } from 'react';
import { translateDevanagariDigits } from '@/lib/utils/input-sanitization';

/**
 * Hook to manage multi-digit input fields (like Aadhar or Mobile numbers)
 * Handles state, focus management, and keyboard navigation.
 * 
 * Syncs with initialValue and length changes using render-phase comparison.
 * Only updates when initialValue or length actually changes, preserving user input otherwise.
 * This prevents out-of-bounds issues when length changes dynamically.
 * Uses the same pattern as useLinkWardPagination for prop-to-state sync.
 * 
 * @param length The number of digits/inputs
 * @param initialValue Initial string value
 * @returns State and handlers for the digit inputs
 */
export const useDigitInputs = (length: number, initialValue: string = '') => {
  const [digits, setDigits] = useState<string[]>(() => {
    const translated = translateDevanagariDigits(initialValue);
    const sanitized = translated.replace(/\D/g, '');
    return Array.from({ length }, (_, i) => sanitized[i] ?? '');
  });

  const [prevInitialValue, setPrevInitialValue] = useState(initialValue);
  const [prevLength, setPrevLength] = useState(length);
  const [lastTypedIndex, setLastTypedIndex] = useState<number>(-1);
  const [isFocused, setIsFocused] = useState(false);

  // Sync with initialValue or length changes in render phase
  const translatedInitial = translateDevanagariDigits(initialValue);
  const sanitizedInitialValue = translatedInitial.replace(/\D/g, '');
  const translatedPrev = translateDevanagariDigits(prevInitialValue);
  const prevSanitized = translatedPrev.replace(/\D/g, '');

  if (
    sanitizedInitialValue !== prevSanitized ||
    length !== prevLength ||
    digits.length !== length
  ) {
    setPrevInitialValue(initialValue);
    setPrevLength(length);
    const newDigits = Array.from({ length }, (_, i) => sanitizedInitialValue[i] ?? '');
    setDigits(newDigits);
  }

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = useCallback((index: number, value: string) => {
    const translated = translateDevanagariDigits(value);
    const val = translated.replace(/\D/g, '').slice(-1);

    setDigits((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });

    if (val) {
      setLastTypedIndex(index);
    } else {
      setLastTypedIndex(-1);
    }

    // Move focus forward if a digit is entered
    if (val && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }, [length]);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Reset typing index on backspace or editing keys
    setLastTypedIndex(-1);
    // Move focus backward on backspace if current field is empty
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }, [digits]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const nextActive = e.relatedTarget as HTMLElement;
    const isMovingWithin = inputRefs.current.some(ref => ref && ref === nextActive);
    if (!isMovingWithin) {
      setIsFocused(false);
    }
  }, []);

  const setRef = useCallback((index: number) => (el: HTMLInputElement | null) => {
    inputRefs.current[index] = el;
  }, []);

  return {
    digits,
    setDigits,
    handleChange,
    handleKeyDown,
    handleFocus,
    handleBlur,
    setRef,
    value: digits.join(''),
    lastTypedIndex,
    isFocused,
  };
};
