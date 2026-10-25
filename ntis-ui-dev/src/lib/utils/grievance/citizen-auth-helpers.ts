/**
 * Citizen Authentication Helper Utilities
 * Path: src/lib/utils/grievance/citizen-auth-helpers.ts
 */

export interface RateLimitInfo {
  isRateLimited: boolean;
  seconds: number;
  cleanMsg: string;
}

export function validateMobile(digits: string): string {
  if (digits.length === 0) return '';
  if (digits.length < 10) return 'Mobile number must be exactly 10 digits';
  if (!/^[6-9]/.test(digits)) return 'Must start with 6, 7, 8, or 9';
  return '';
}

export function validateName(val: string): string {
  const trimmed = val.trim();
  if (trimmed.length === 0) return '';
  if (trimmed.length < 2) return 'Name must be at least 2 characters';
  if (/\d/.test(trimmed)) return 'Name cannot contain numbers';
  if (!/^[a-zA-Z\u0900-\u097F\s'.,-]+$/.test(trimmed)) return 'Name contains invalid characters';
  return '';
}

/**
 * Parse rate limit wait seconds from backend exception or error payload
 */
export function parseRateLimitInfo(rawInput: unknown): RateLimitInfo {
  if (!rawInput) return { isRateLimited: false, seconds: 0, cleanMsg: '' };

  let message = '';
  if (typeof rawInput === 'string') {
    message = rawInput;
  } else if (typeof rawInput === 'object') {
    const obj = rawInput as Record<string, unknown>;
    message =
      (typeof obj.message === 'string' && obj.message) ||
      (typeof obj.error === 'string' && obj.error) ||
      (typeof obj.errorMessage === 'string' && obj.errorMessage) ||
      (typeof obj.detail === 'string' && obj.detail) ||
      (typeof obj.title === 'string' && obj.title) ||
      (Array.isArray(obj.errors) && typeof obj.errors[0] === 'string' && obj.errors[0]) ||
      '';
  }

  if (!message) return { isRateLimited: false, seconds: 0, cleanMsg: '' };

  // 1. Parse hours, minutes, seconds from message
  let totalSeconds = 0;

  const hourMatch = message.match(/(\d+)\s*(?:hours?|hrs?)\b/i);
  if (hourMatch && hourMatch[1]) {
    totalSeconds += parseInt(hourMatch[1], 10) * 3600;
  }

  const minMatch = message.match(/(\d+)\s*(?:minutes?|mins?)\b/i);
  if (minMatch && minMatch[1]) {
    totalSeconds += parseInt(minMatch[1], 10) * 60;
  }

  const secMatch = message.match(/(\d+)\s*(?:seconds?|secs?)\b/i);
  if (secMatch && secMatch[1]) {
    totalSeconds += parseInt(secMatch[1], 10);
  }

  // Fallback: If no unit matched, but there is "wait <number>"
  if (totalSeconds === 0) {
    const fallbackMatch = message.match(/wait\s*(\d+)/i);
    if (fallbackMatch && fallbackMatch[1]) {
      totalSeconds = parseInt(fallbackMatch[1], 10);
    }
  }

  // 2. Clean message for UI display
  const clean = message
    .replace(/^[A-Za-z0-9_.]+(Exception|Error):\s*'?/i, '')
    .replace(/'?$/, '')
    .replace(/^Validation failed for [A-Za-z0-9_]+:\s*/i, '')
    .replace(/^'|'$/g, '')
    .trim();

  const isRateLimited = totalSeconds > 0 || /too many|rate\s*limit|cooldown|temporarily locked|locked out/i.test(message);

  if (isRateLimited && totalSeconds === 0) {
    totalSeconds = 60;
  }

  return {
    isRateLimited,
    seconds: totalSeconds,
    cleanMsg: clean || message,
  };
}

/**
 * Format total seconds into human-readable words (e.g., "3 hrs 56 mins 23 sec")
 */
export function formatHumanDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return '';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (hours > 0) {
    parts.push(`${hours} hr${hours > 1 ? 's' : ''}`);
  }
  if (minutes > 0) {
    parts.push(`${minutes} min${minutes > 1 ? 's' : ''}`);
  }
  if (seconds > 0 || parts.length === 0) {
    parts.push(`${seconds} sec`);
  }
  return parts.join(' ');
}

/**
 * Format total seconds into digital clock badge (e.g., "03:56:23" or "00:28")
 */
export function formatDigitalTimer(totalSeconds: number): string {
  if (totalSeconds <= 0) return '00:00';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
