// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const io = vi.hoisted(() => ({
  existsSync: vi.fn(), readFileSync: vi.fn(), readdirSync: vi.fn(), unlinkSync: vi.fn(), execFile: vi.fn(), execFileAsync: vi.fn(),
}));
vi.mock('node:fs', () => ({
  existsSync: io.existsSync, readFileSync: io.readFileSync, readdirSync: io.readdirSync, unlinkSync: io.unlinkSync,
}));
vi.mock('node:child_process', async () => {
  const { promisify } = await import('node:util');
  return { execFile: Object.assign(io.execFile, { [promisify.custom]: io.execFileAsync }) };
});

import bridge, { extractNativeRptDefinition, convertBmpToPngIfPossible } from '@/lib/utils/reports/import/server/native-cr-bridge.server';

describe('typed native Crystal Reports bridge', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    io.existsSync.mockReturnValue(true);
    io.readdirSync.mockReturnValue([]);
    io.execFileAsync.mockResolvedValue({ stdout: Buffer.from('Extracted'), stderr: Buffer.alloc(0) });
  });

  it('preserves extractor arguments, BOM cleanup, field normalization and subreport ordering', async () => {
    io.readFileSync.mockReturnValue('\uFEFF' + JSON.stringify({
      reportId: 'Notice', orientation: 'portrait', pageWidth: 794, customExtension: 'preserved',
      sections: [
        { id: 'tax', isSubreport: true, subreportName: 'Tax' },
        { id: 'header' }, { id: 'footer' },
      ],
      elements: [
        { id: 'title', sectionId: 'header', type: 'text', text: 'Notice', x: 780, y: 0, width: 100, height: 20, styles: { fontSize: '6pt' } },
        { id: 'anchor', sectionId: 'header', type: 'subreport', text: '[Subreport: Tax]', x: 0, y: 20, width: 100, height: 20 },
        { id: 'tax-value', sectionId: 'tax', type: 'field', text: '{{Proc;1.Tax}}', fieldName: '{Proc;1.Tax}', x: 0, y: 0, width: 100, height: 20 },
      ],
    }));
    const result = await bridge.extractNativeRptDefinition('notice.rpt', 'bundle');
    expect(result?.customExtension).toBe('preserved');
    expect(result?.sections.map((section) => section.id)).toEqual(['header', 'tax', 'footer']);
    expect(result?.elements[0]).toMatchObject({ x: 618, width: 100, styles: { fontSize: '8.5pt' } });
    expect(result?.elements[1]).toMatchObject({ visible: false, properties: { importRole: 'embeddedSubreportAnchor', sourceSubreport: 'Tax' } });
    expect(result?.elements[2]).toMatchObject({ text: '{Tax}', fieldName: 'Tax' });
    expect(result?.embeddedSubreports).toEqual([{ name: 'tax', sections: 1, elements: 1 }]);
    expect(io.execFileAsync).toHaveBeenCalledWith(
      expect.stringMatching(/cscript\.exe$/),
      ['//Nologo', expect.stringMatching(/native-cr-extractor\.vbs$/), 'notice.rpt', expect.stringMatching(/_native_cr_extracted\.json$/)],
      { timeout: 15000, windowsHide: true, encoding: 'buffer' },
    );
    expect(io.unlinkSync).toHaveBeenCalledWith(expect.stringMatching(/_native_cr_extracted\.json$/));
  });

  it('returns null without launching scripts when the source or runtime is missing', async () => {
    io.existsSync.mockReturnValue(false);
    expect(await extractNativeRptDefinition('missing.rpt')).toBeNull();
    io.existsSync.mockImplementation((file: string) => !file.endsWith('cscript.exe'));
    expect(await extractNativeRptDefinition('notice.rpt')).toBeNull();
    expect(io.execFileAsync).not.toHaveBeenCalled();
  });

  it('retains the null fallback after extraction or JSON parsing fails', async () => {
    io.execFileAsync.mockRejectedValueOnce(new Error('Crystal runtime failure'));
    expect(await extractNativeRptDefinition('notice.rpt')).toBeNull();
    io.readFileSync.mockReturnValue('Invalid JSON');
    expect(await extractNativeRptDefinition('notice.rpt')).toBeNull();
  });

  it('preserves BMP conversion arguments and path escaping, with false on failure', async () => {
    expect(await convertBmpToPngIfPossible("logo's.bmp", 'logo.png')).toBe(true);
    expect(io.execFileAsync).toHaveBeenCalledWith(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', expect.stringContaining("logo''s.bmp")],
      { windowsHide: true },
    );
    io.execFileAsync.mockRejectedValue(new Error('Conversion failed'));
    expect(await convertBmpToPngIfPossible('logo.bmp', 'logo.png')).toBe(false);
  });

  it('allows the event loop to run while extraction is pending', async () => {
    let complete!: (value: { stdout: Buffer; stderr: Buffer }) => void;
    io.execFileAsync.mockImplementationOnce(() => new Promise(resolve => { complete = resolve; }));
    io.readFileSync.mockReturnValue(JSON.stringify({ reportId: 'Notice', sections: [], elements: [] }));
    const extraction = extractNativeRptDefinition('notice.rpt');
    await new Promise<void>(resolve => setImmediate(resolve));
    expect(io.readFileSync).not.toHaveBeenCalled();
    complete({ stdout: Buffer.from('Extracted'), stderr: Buffer.alloc(0) });
    expect(await extraction).toMatchObject({ reportId: 'Notice' });
  });

  it('waits for BMP conversion before linking the PNG and returning the report', async () => {
    let complete!: (value: { stdout: Buffer; stderr: Buffer }) => void;
    let converted = false;
    io.execFileAsync.mockImplementationOnce(async () => ({ stdout: Buffer.from('Extracted'), stderr: Buffer.alloc(0) }))
      .mockImplementationOnce(() => new Promise(resolve => { complete = resolve; }));
    io.existsSync.mockImplementation((file: string) => !file.endsWith('.png') || converted);
    io.readdirSync.mockReturnValue(['logo_1.bmp']);
    io.readFileSync.mockReturnValue(JSON.stringify({
      reportId: 'Notice', pageWidth: 794, orientation: 'portrait', sections: [],
      elements: [{ id: 'logo', type: 'image', x: 0, width: 20, height: 20, text: '' }],
    }));
    const extraction = extractNativeRptDefinition('notice.rpt', 'bundle');
    await new Promise<void>(resolve => setImmediate(resolve));
    expect(io.execFileAsync).toHaveBeenCalledTimes(2);
    converted = true;
    io.readdirSync.mockReturnValue(['logo_1.bmp', 'logo_1.png']);
    complete({ stdout: Buffer.alloc(0), stderr: Buffer.alloc(0) });
    expect((await extraction)?.elements[0].imageUrl).toBe('/reports/Notice/assets/logo_1.png');
  });
});
