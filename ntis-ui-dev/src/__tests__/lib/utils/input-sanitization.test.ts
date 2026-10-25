import { describe, it, expect } from 'vitest';
import {
  sanitizeShopName,
  capitalizeEachWord,
  translateDevanagariDigits,
  sanitizeSurveyNo,
  sanitizeSubZoneNo,
  sanitizePositiveInteger,
  sanitizePlotArea,
  sanitizePositiveNumber,
} from '@/lib/utils/input-sanitization';

describe('sanitizeShopName', () => {
  it('allows letters, numbers, spaces, and basic punctuation safe for shop names', () => {
    expect(sanitizeShopName('John\'s Shop & Cafe (No. 1)')).toBe('John\'s Shop & Cafe (No. 1)');
  });

  it('removes HTML and script tags', () => {
    expect(sanitizeShopName('<script>alert("hack")</script>Shop')).toBe('alert(hack)Shop');
  });

  it('removes disallowed characters', () => {
    expect(sanitizeShopName('Shop *^* Name!')).toBe('Shop  Name');
  });
});

describe('capitalizeEachWord', () => {
  it('capitalizes the first letter of each word', () => {
    expect(capitalizeEachWord('john doe')).toBe('John Doe');
    expect(capitalizeEachWord('mcdonald')).toBe('Mcdonald');
    expect(capitalizeEachWord('shop no 5')).toBe('Shop No 5');
  });

  it('handles empty inputs and trailing spaces', () => {
    expect(capitalizeEachWord('')).toBe('');
    expect(capitalizeEachWord('john ')).toBe('John ');
  });
});

describe('translateDevanagariDigits', () => {
  it('translates Devanagari digits to standard English digits', () => {
    expect(translateDevanagariDigits('०१२३४५६७८९')).toBe('0123456789');
    expect(translateDevanagariDigits('१२३.४५')).toBe('123.45');
    expect(translateDevanagariDigits('abc १२३')).toBe('abc 123');
    expect(translateDevanagariDigits('')).toBe('');
  });
});

describe('sanitizeSurveyNo with Marathi support', () => {
  it('allows Marathi digits and standard alphanumeric characters', () => {
    expect(sanitizeSurveyNo('survey १२३-४५/SZ')).toBe('survey१२३-४५/SZ');
    expect(sanitizeSurveyNo('१२३//४५')).toBe('१२३/४५');
  });
});

describe('sanitizeSubZoneNo with Marathi support', () => {
  it('allows Marathi digits and standard alphanumeric characters', () => {
    expect(sanitizeSubZoneNo('SZ-१२')).toBe('SZ-१२');
    expect(sanitizeSubZoneNo('--१२--')).toBe('१२-');
  });
});

describe('sanitizePositiveInteger with Marathi support', () => {
  it('allows Marathi digits and standard integers', () => {
    expect(sanitizePositiveInteger('१२')).toBe('१२');
    expect(sanitizePositiveInteger('०९')).toBe('०९');
    expect(sanitizePositiveInteger('१२.३')).toBe('१२३'); // dots are removed in integer sanitization
  });
});

describe('sanitizePlotArea with Marathi support', () => {
  it('allows Marathi digits and sanitizes plot area format', () => {
    expect(sanitizePlotArea('१५००.२५')).toBe('१५००.२५');
    expect(sanitizePlotArea('१०.१२३४५')).toBe('१०.१२३४'); // limited to 4 decimals
    expect(sanitizePlotArea('१२३४५६७८९०१२३४५६')).toBe('१२३४५६७८९०१२३४५'); // max 15 digits
  });
});

describe('sanitizePositiveNumber with Marathi support', () => {
  it('allows Marathi digits and positive decimal numbers', () => {
    expect(sanitizePositiveNumber('१२.३४')).toBe('१२.३४');
    expect(sanitizePositiveNumber('-१.२')).toBe('१.२');
  });
});
