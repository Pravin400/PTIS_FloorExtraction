import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import parser from '@/lib/utils/reports/import/server/rpt-parser';

// Keep the WaterCollection test on the portable fallback, regardless of optional files.
vi.mock('node:fs', async importOriginal => ({
  ...await importOriginal<typeof import('node:fs')>(),
  existsSync: () => false,
}));

function emptyCompoundDocument(): Buffer {
  const buffer = Buffer.alloc(512);
  Buffer.from('d0cf11e0a1b11ae1', 'hex').copy(buffer);
  buffer.writeUInt16LE(9, 30);
  buffer.writeUInt16LE(6, 32);
  buffer.writeUInt32LE(0xfffffffe, 48);
  buffer.writeUInt32LE(4096, 56);
  buffer.writeUInt32LE(0xfffffffe, 60);
  return buffer;
}

describe('typed Crystal Reports parser compatibility', () => {
  // These full-output hashes were captured from the original JavaScript parser.
  it.each([
    ['Report.rpt', '85b6ec2a90bfb00c13ee20df900a34451a0a1c11f42f81145b60e8ebcd943c7d'],
    ['BillReceipt.rpt', '552e3f0f68bb05a0c19816282482ad8582a4fe24ccb829056b48631523044c9a'],
    ['SHELApplication.rpt', 'f037ab7ecea083c0ac1c9d3f22812be0ccac5bd07499dcc80439afd005080242'],
    ['WaterCollection.rpt', '7739b15a4655a5e054f7d2ee7cbb622942889157ac61cde0e15f314b3759fb45'],
  ])('preserves the complete layout and diagnostics for %s', (name, expectedHash) => {
    const result = parser.parseRptBuffer(emptyCompoundDocument(), name);
    expect(result.isValidRpt).toBe(true);
    expect(createHash('sha256').update(JSON.stringify(result)).digest('hex')).toBe(expectedHash);
  });

  it.each([Buffer.alloc(0), Buffer.alloc(511), Buffer.alloc(512)])('preserves invalid-input fallback', buffer => {
    const result = parser.parseRptBuffer(buffer);
    expect(result.isValidRpt).toBe(false);
    expect(result.sections).toEqual([]);
    expect(result.elements).toEqual([]);
  });

  it('supports the legacy title-string overload and custom provider columns', () => {
    const buffer = emptyCompoundDocument();
    expect(parser.parseRptBuffer(buffer, 'Report.rpt', 'Custom title').suggestedTitle).toBe('Custom title');
    const result = parser.parseRptBuffer(buffer, 'Report.rpt', {
      title: 'मराठी Title', columns: [{ name: 'Amount', label: 'रक्कम' }],
    });
    expect(result.elements.find(element => element.id === 'col_amount')?.text).toBe('रक्कम');
    expect(result.elements.find(element => element.id === 'fld_amount')?.fieldName).toBe('Amount');
  });

  it('preserves embedded bitmap buffers and dimensions', () => {
    const bmp = Buffer.alloc(30);
    bmp.write('BM');
    bmp.writeInt32LE(40, 18);
    bmp.writeInt32LE(-20, 22);
    bmp.writeUInt16LE(24, 28);
    const images = parser.extractEmbeddedImages({
      entries: [{ name: 'CONTENTS', type: 'Stream', startSector: 0, size: bmp.length }],
      readStream: () => bmp,
    });
    expect(images[0]).toMatchObject({ name: 'logo_1.bmp', width: 40, height: 20, bpp: 24 });
    expect(images[0].buffer).toBe(bmp);
  });
});
