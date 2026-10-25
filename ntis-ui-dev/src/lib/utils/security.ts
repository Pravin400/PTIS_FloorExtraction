export const MAX_SANITIZED_INPUT_LENGTH = 100;

/**
 * Performs basic sanitization of user-provided text for safer UI display.
 * Strips HTML tags and some hazardous patterns, but is not a full XSS or
 * injection sanitizer and should not be relied on as a security boundary.
 *
 * This helper is intentionally **not** a full XSS / injection sanitizer and must
 * never be treated as a security boundary.
 *
 * IMPORTANT USAGE NOTE:
 * - This function is only safe when its return value is rendered as plain text
 *   by React/Next.js JSX (e.g. `{sanitizeInput(value)}` inside JSX). In these
 *   cases React automatically escapes HTML entities, and we avoid double-encoding
 *   by not performing manual entity encoding here.
 * - Do NOT use this function when:
 *   - Constructing or concatenating raw HTML strings
 *   - Passing values into `dangerouslySetInnerHTML`
 *   - Rendering content with non-React renderers (e.g. email templates, PDFs,
 *     server-side string templates, or any system that does not perform its own
 *     robust HTML escaping)
 *
 * In those cases, use a dedicated, well-reviewed HTML escaping / sanitization
 * library appropriate for the target context instead.
 *
 * @param input The string to sanitize
 * @returns Sanitized string
 */
export function sanitizeInput(input: string | undefined | null): string {
  if (!input) return '';

  return input
    .trim() // Trim leading and trailing whitespace first
    .replace(/<[^>]*>/g, '') // Strip HTML tags (g flag only, m flag unnecessary)
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:/gi, '') // Remove data: protocol
    .replace(/vbscript:/gi, '') // Remove vbscript: protocol
    // Remove event handlers like onclick= while preserving leading whitespace
    // Known limitation: This pattern requires '=' sign, so edge cases like onclick(alert) are not caught
    .replace(/(^|\s)on\w+\s*=/gi, '$1')
    .slice(0, MAX_SANITIZED_INPUT_LENGTH);
}

/**
 * Safely sanitizes longer text fields like descriptions, ensuring no HTML/JS injection.
 * Truncates at the provided maximum length (defaults to 1000).
 */
export function sanitizeDescription(input: string | undefined | null, maxLength = 1000): string {
  if (!input) return '';

  return input
    .trim()
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:/gi, '') // Remove data: protocol
    .replace(/vbscript:/gi, '') // Remove vbscript: protocol
    .replace(/(^|\s)on\w+\s*=/gi, '$1') // Remove event handlers
    .slice(0, maxLength);
}

