'use client';

/**
 * Hook for Resend & Rate Limit Cooldown Timers
 * Path: src/hooks/grievance/citizen/useAuthTimers.ts
 */

import { useState, useEffect } from 'react';

export function useAuthTimers(onCooldownEnd?: () => void) {
  const [resendTimer, setResendTimer] = useState(0);
  const [rateLimitSeconds, setRateLimitSeconds] = useState(0);
  const [initialTotalSeconds, setInitialTotalSeconds] = useState(0);

  // Resend OTP Countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendTimer]);

  // Security Rate-limit Cooldown Countdown
  useEffect(() => {
    if (rateLimitSeconds <= 0) return;
    const timer = setInterval(() => {
      setRateLimitSeconds((prev) => {
        if (prev <= 1) {
          onCooldownEnd?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [rateLimitSeconds, onCooldownEnd]);

  const setCooldown = (seconds: number) => {
    setRateLimitSeconds(seconds);
    setInitialTotalSeconds(seconds);
  };

  const resetCooldown = () => {
    setRateLimitSeconds(0);
    setInitialTotalSeconds(0);
  };

  return {
    resendTimer,
    setResendTimer,
    rateLimitSeconds,
    initialTotalSeconds,
    setCooldown,
    resetCooldown,
  };
}
