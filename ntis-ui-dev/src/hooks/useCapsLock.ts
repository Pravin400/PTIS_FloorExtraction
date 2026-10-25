'use client';

import { useState, useCallback, type KeyboardEvent, type MouseEvent } from 'react';

/**
 * Hook to detect Caps Lock state when interacting with an input field.
 * Supports KeyboardEvent and MouseEvent via `event.getModifierState('CapsLock')`.
 */
export function useCapsLock() {
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);

  const checkCapsLock = useCallback(
    (e: KeyboardEvent<HTMLElement> | MouseEvent<HTMLElement>) => {
      if (typeof e.getModifierState === 'function') {
        setIsCapsLockOn(e.getModifierState('CapsLock'));
      }
    },
    []
  );

  const handleBlur = useCallback(() => {
    setIsCapsLockOn(false);
  }, []);

  return {
    isCapsLockOn,
    setIsCapsLockOn,
    checkCapsLock,
    handleBlur,
  };
}
