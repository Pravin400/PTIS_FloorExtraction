import { describe, it, expect } from 'vitest';
import {
  normalizeReportTextEntities,
  categorizeReportFields,
  formatFieldValue,
  toDevanagariDigits,
} from '@/lib/utils/reports/designer';

describe('Report Fields Utility', () => {
  it('normalizes HTML entities in report text', () => {
    expect(normalizeReportTextEntities('&lt;div&gt;&quot;&#39;')).toBe('<div>"\'');
    expect(normalizeReportTextEntities('Word&nbsp;Wrap')).toBe('Word Wrap');
  });

  it('categorizes raw database fields into formula, parameter, summary, and db categories', () => {
    const raw = [
      { name: 'MarathiOwnerName', displayName: 'Owner Name' },
      { name: '@NetTaxCalc', displayName: 'Calculated Tax' },
      { name: '?assessmentYear', displayName: 'Year' },
      { name: 'total_due_amount', displayName: 'Total Due' },
    ];

    const categories = categorizeReportFields(raw);
    expect(categories.length).toBe(4);

    const dbCategory = categories.find(c => c.id === 'database');
    expect(dbCategory?.fields.length).toBe(1);
    expect(dbCategory?.fields[0].expression).toBe('{MarathiOwnerName}');

    const formulaCategory = categories.find(c => c.id === 'formula');
    expect(formulaCategory?.fields.length).toBe(1);
    expect(formulaCategory?.fields[0].expression).toBe('{@NetTaxCalc}');

    const paramCategory = categories.find(c => c.id === 'parameter');
    expect(paramCategory?.fields.length).toBe(1);
    expect(paramCategory?.fields[0].expression).toBe('{?assessmentYear}');

    const summaryCategory = categories.find(c => c.id === 'summary');
    expect(summaryCategory?.fields.length).toBe(1);
    expect(summaryCategory?.fields[0].expression).toBe('{#total_due_amount}');
  });

  it('formats field values as currency and numbers', () => {
    expect(formatFieldValue(1500, 'currency')).toContain('1,500');
    expect(formatFieldValue(2500)).toBe('2,500');
    expect(formatFieldValue(null)).toBe('');
  });

  it('converts English digits to Devanagari numerals', () => {
    expect(toDevanagariDigits(12345)).toBe('१२३४५');
    expect(toDevanagariDigits('2026')).toBe('२०२६');
    expect(toDevanagariDigits('Notice 119')).toBe('Notice ११९');
  });
});
