import { sanitizeInput, sanitizeDescription, MAX_SANITIZED_INPUT_LENGTH } from '@/lib/utils/security';

/**
 * NOTE: sanitizeInput is designed for basic sanitization only.
 * The sanitized output is safe ONLY when rendered through React/Next.js JSX,
 * which automatically escapes HTML entities. Do not use sanitized output
 * in dangerouslySetInnerHTML, raw HTML strings, or non-React contexts.
 */
describe('sanitizeInput', () => {
  it('should return empty string for null or undefined', () => {
    expect(sanitizeInput(null)).toBe('');
    expect(sanitizeInput(undefined)).toBe('');
  });

  it('should strip HTML tags', () => {
    expect(sanitizeInput('Hello <b>World</b>')).toBe('Hello World');
    // Note: Output 'alert("xss")' is safe when rendered via React JSX (auto-escaped)
    expect(sanitizeInput('<script>alert("xss")</script>')).toBe('alert("xss")');
  });

  it('should remove javascript: protocol', () => {
    expect(sanitizeInput('javascript:alert(1)')).toBe('alert(1)');
    expect(sanitizeInput('JAVASCRIPT:alert(1)')).toBe('alert(1)');
  });

  it('should remove data: protocol', () => {
    expect(sanitizeInput('data:text/html,<script>')).toBe('text/html,');
  });

  it('should remove event handlers', () => {
    expect(sanitizeInput('div onclick="alert(1)"')).toBe('div "alert(1)"');
    expect(sanitizeInput('img onerror=alert(1)')).toBe('img alert(1)');
  });

  it('should truncate input to MAX_SANITIZED_INPUT_LENGTH', () => {
    const longInput = 'a'.repeat(MAX_SANITIZED_INPUT_LENGTH + 10);
    expect(sanitizeInput(longInput).length).toBe(MAX_SANITIZED_INPUT_LENGTH);
  });

  it('should NOT encode HTML entities (React handles this)', () => {
    expect(sanitizeInput('B&W')).toBe('B&W');
    expect(sanitizeInput('John "Doe"')).toBe('John "Doe"');
  });

  // Additional edge case tests per review suggestions
  it('should handle whitespace correctly', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello');
    expect(sanitizeInput('hello   world')).toBe('hello   world');
    expect(sanitizeInput('line1\nline2')).toBe('line1\nline2');
  });

  it('should handle combined attack vectors', () => {
    expect(sanitizeInput('<script>javascript:alert(1)</script>')).toBe('alert(1)');
    expect(sanitizeInput('<img src="javascript:alert(1)" onerror=alert(2)>')).toBe('');
  });

  it('should preserve Unicode and international characters (Hindi/Marathi)', () => {
    expect(sanitizeInput('नमस्ते')).toBe('नमस्ते');
    expect(sanitizeInput('मराठी टेक्स्ट')).toBe('मराठी टेक्स्ट');
    expect(sanitizeInput('हिंदी में')).toBe('हिंदी में');
    expect(sanitizeInput('English मिक्स हिंदी')).toBe('English मिक्स हिंदी');
  });

  it('should return empty string when input becomes empty after sanitization', () => {
    expect(sanitizeInput('<script></script>')).toBe('');
    expect(sanitizeInput('<div></div>')).toBe('');
  });

  it('should handle mixed case protocol variations', () => {
    expect(sanitizeInput('JaVaScRiPt:alert(1)')).toBe('alert(1)');
    expect(sanitizeInput('DaTa:text/html')).toBe('text/html');
    expect(sanitizeInput('VbScRiPt:msgbox')).toBe('msgbox');
  });
});

describe('sanitizeDescription', () => {
  it('should return empty string for null or undefined', () => {
    expect(sanitizeDescription(null)).toBe('');
    expect(sanitizeDescription(undefined)).toBe('');
  });

  it('should strip HTML tags', () => {
    expect(sanitizeDescription('Hello <b>World</b>')).toBe('Hello World');
    expect(sanitizeDescription('<script>alert("xss")</script>')).toBe('alert("xss")');
  });

  it('should remove javascript/data/vbscript protocols', () => {
    expect(sanitizeDescription('javascript:alert(1)')).toBe('alert(1)');
    expect(sanitizeDescription('data:text/html,<script>')).toBe('text/html,');
    expect(sanitizeDescription('vbscript:msgbox')).toBe('msgbox');
  });

  it('should remove event handlers', () => {
    expect(sanitizeDescription('div onclick="alert(1)"')).toBe('div "alert(1)"');
  });

  it('should allow up to 1000 characters (does not truncate at 100)', () => {
    const longInput = 'a'.repeat(500);
    expect(sanitizeDescription(longInput).length).toBe(500);
    
    const tooLongInput = 'a'.repeat(1010);
    expect(sanitizeDescription(tooLongInput).length).toBe(1000);
  });
});
