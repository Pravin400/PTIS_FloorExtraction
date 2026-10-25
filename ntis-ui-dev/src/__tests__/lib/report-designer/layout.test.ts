import { describe, expect, it } from 'vitest';
import { getReportValue, paginateReportTemplate } from '@/lib/utils/reports/designer/layout';
import { safeParseTemplate } from '@/lib/utils/reports/designer/template';
import type { DesignerTemplate } from '@/types/report-designer.types';

const PAGINATED_TEMPLATE: DesignerTemplate = {
  schemaVersion: 3,
  reportCode: 'DynamicRows',
  page: { size: 'A4', orientation: 'portrait', widthMm: 210, heightMm: 60, background: '#fff' },
  elements: [],
  bands: [
    { id: 'page-header', type: 'pageHeader', heightMm: 5, elements: [] },
    {
      id: 'column-header',
      type: 'groupHeader',
      heightMm: 5,
      repeatOnPageBreak: true,
      elements: [],
    },
    {
      id: 'detail-row',
      type: 'detail',
      heightMm: 8,
      dataPath: 'rows',
      elements: [{ id: 'row-name', type: 'field', path: 'name', x: 0, y: 0, w: 50, h: 5 }],
    },
    { id: 'page-footer', type: 'pageFooter', heightMm: 5, elements: [] },
  ],
};

const PAGINATED_DATA = {
  rows: Array.from({ length: 30 }, (_, index) => ({ name: `Row ${index + 1}` })),
};

describe('report designer v2 layout', () => {
  it('loads backend v2 templates that omit the legacy elements array', () => {
    const parsed = safeParseTemplate(JSON.stringify({
      schemaVersion: 2,
      page: { size: 'A4', orientation: 'portrait', widthMm: 210, heightMm: 297, background: '#fff' },
      bands: [{ id: 'header', type: 'reportHeader', heightMm: 10, elements: [] }],
    }));

    expect(parsed?.elements).toEqual([]);
    expect(parsed?.bands).toHaveLength(1);
  });

  it('paginates every dynamic detail row without truncation', () => {
    const result = paginateReportTemplate(PAGINATED_TEMPLATE, PAGINATED_DATA);

    expect(result.pages.length).toBeGreaterThan(1);
    const bands = result.pages.flatMap((page) => page.bands);
    expect(bands.filter((band) => band.bandId === 'detail-row')).toHaveLength(30);
    expect(bands.filter((band) => band.bandId === 'page-footer')).toHaveLength(result.pages.length);
    expect(result.warnings).toEqual([]);
  });

  it('repeats the active column header after a detail page break', () => {
    const result = paginateReportTemplate(PAGINATED_TEMPLATE, PAGINATED_DATA);
    const columnHeaders = result.pages.flatMap((page) => page.bands).filter((band) => band.bandId === 'column-header');

    expect(columnHeaders).toHaveLength(result.pages.length);
    expect(result.pages.slice(1).every((page) => page.bands.some((band) => band.bandId === 'column-header'))).toBe(true);
  });

  it('resolves current and root bindings independently inside a detail row', () => {
    const root = { property: { propertyNo: 'P-101' } };
    const current = { taxName: 'General Tax' };

    expect(getReportValue(current, 'taxName', root)).toBe('General Tax');
    expect(getReportValue(current, '$current.taxName', root)).toBe('General Tax');
    expect(getReportValue(current, '$root.property.propertyNo', root)).toBe('P-101');
  });

  it('ignores circular fragments and reports a layout warning', () => {
    const circularTemplate: DesignerTemplate = {
      schemaVersion: 2,
      page: { size: 'A4', orientation: 'portrait', widthMm: 210, heightMm: 297, background: '#fff' },
      elements: [],
      bands: [{ id: 'root-subreport', type: 'subreport', heightMm: 1, fragmentCode: 'LOOP', elements: [] }],
      fragments: [{
        code: 'LOOP',
        name: 'Loop',
        bands: [{ id: 'nested-loop', type: 'subreport', heightMm: 1, fragmentCode: 'LOOP', elements: [] }],
      }],
    };

    const result = paginateReportTemplate(circularTemplate, {});
    expect(result.warnings).toEqual([expect.stringContaining('Circular subreport reference')]);
  });

  it('reports a missing fragment instead of failing the report runtime', () => {
    const template: DesignerTemplate = {
      schemaVersion: 2,
      page: { size: 'A4', orientation: 'portrait', widthMm: 210, heightMm: 297, background: '#fff' },
      elements: [],
      bands: [{ id: 'missing', type: 'subreport', heightMm: 1, fragmentCode: 'UNKNOWN', elements: [] }],
    };

    const result = paginateReportTemplate(template, {});
    expect(result.pages).toHaveLength(1);
    expect(result.warnings).toEqual([expect.stringContaining('missing fragment')]);
  });

  it('repeats an inline designer subreport for every dynamic child row', () => {
    const template: DesignerTemplate = {
      schemaVersion: 3,
      page: { size: 'A4', orientation: 'portrait', widthMm: 210, heightMm: 297, background: '#fff' },
      elements: [],
      bands: [{
        id: 'floor-subreport',
        type: 'subreport',
        heightMm: 8,
        dataPath: 'propertyDetails',
        elements: [{ id: 'floor-name', type: 'field', path: 'floorDescription', x: 5, y: 1, w: 60, h: 6 }],
      }],
    };

    const result = paginateReportTemplate(template, {
      propertyDetails: [
        { floorDescription: 'Ground' },
        { floorDescription: 'First' },
        { floorDescription: 'Second' },
      ],
    });
    const rows = result.pages.flatMap((page) => page.bands)
      .filter((band) => band.bandId === 'floor-subreport');

    expect(rows.map((row) => row.data.floorDescription)).toEqual(['Ground', 'First', 'Second']);
    expect(result.warnings).toEqual([]);
  });
});
