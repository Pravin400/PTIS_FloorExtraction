import { describe, expect, it } from 'vitest';
import parser from '@/lib/utils/reports/import/server/rpt-parser';

describe('Crystal parameter detection', () => {
  it('ignores binary @ words, formula references and SQL variables', () => {
    const content = Buffer.from('@ItFNvOS @KqJIqhN {@TotalAmount} SELECT @ownerId @222');
    expect(parser.detectCrystalParameters(content)).toEqual([]);
  });

  it('extracts complete parameter references in both encodings and deduplicates names', () => {
    const content = Buffer.concat([
      Buffer.from('{?propertyId} {?PropertyId} {?Financial Year} {@formula} {?broken'),
      Buffer.from('{?wardId} {?propertyId}', 'utf16le'),
    ]);
    expect(parser.detectCrystalParameters(content)).toEqual(['propertyId', 'Financial Year', 'wardId']);
  });
});
