import { describe, expect, it } from 'vitest';
import {
  PX_PER_MM,
  mmToPx,
  pxToMm,
  resolvePageGeometry,
  toDevanagariDigits,
  formatFieldValue,
  decodeHtmlEntities,
  escapeHtml,
  getValueByPath,
  interpolateElementContent,
  renderElementHtml,
  renderReport,
  ReportLayoutValidator,
  autoResolveCollisions,
} from '@/lib/utils/reports/engine';
import type { ReportDefinition, ReportElement } from '@/lib/utils/reports/engine';

describe('Report Engine (Next.js TypeScript port)', () => {
  describe('Geometry and Units', () => {
    it('correctly converts mm to px and px to mm using standard 96 DPI', () => {
      expect(PX_PER_MM).toBeCloseTo(3.7795, 3);
      expect(mmToPx(210)).toBe(794); // A4 width
      expect(mmToPx(297)).toBe(1123); // A4 height
      expect(pxToMm(794)).toBeCloseTo(210.1, 1);
    });

    it('resolves standard A4 portrait and landscape geometry', () => {
      const portrait = resolvePageGeometry({
        paperSize: 'A4',
        orientation: 'portrait',
      });
      expect(portrait.paperSize).toBe('A4');
      expect(portrait.orientation).toBe('portrait');
      expect(portrait.widthMm).toBe(210);
      expect(portrait.heightMm).toBe(297);
      expect(portrait.pageWidth).toBe(794);
      expect(portrait.pageHeight).toBe(1123);
      expect(portrait.printableWidth).toBeGreaterThan(700);

      const landscape = resolvePageGeometry({
        paperSize: 'A4',
        orientation: 'landscape',
      });
      expect(landscape.orientation).toBe('landscape');
      expect(landscape.widthMm).toBe(297);
      expect(landscape.heightMm).toBe(210);
      expect(landscape.pageWidth).toBe(1123);
      expect(landscape.pageHeight).toBe(794);
    });

    it('supports custom paper sizes', () => {
      const custom = resolvePageGeometry({
        paperSize: 'Custom',
        customWidthMm: 150,
        customHeightMm: 250,
        orientation: 'portrait',
      });
      expect(custom.widthMm).toBe(150);
      expect(custom.heightMm).toBe(250);
      expect(custom.pageWidth).toBe(mmToPx(150));
      expect(custom.pageHeight).toBe(mmToPx(250));
    });
  });

  describe('Marathi & Unicode Formatting', () => {
    it('converts ASCII digits to Marathi Devanagari digits', () => {
      expect(toDevanagariDigits('0123456789')).toBe('०१२३४५६७८९');
      expect(toDevanagariDigits('Bill No: 2026-99')).toBe('Bill No: २०२६-९९');
    });

    it('formats dates and booleans correctly', () => {
      expect(formatFieldValue(true)).toBe('होय');
      expect(formatFieldValue(false)).toBe('नाही');
      expect(formatFieldValue('2026-10-03')).toBe('03/10/2026');
      expect(formatFieldValue('2026-10-03', 'devanagari')).toBe('०३/१०/२०२६');
    });

    it('decodes entities and escapes HTML for XSS prevention', () => {
      expect(decodeHtmlEntities('&lt;b&gt;Hello&lt;/b&gt;')).toBe('<b>Hello</b>');
      expect(escapeHtml('<script>alert(1)</script>')).toBe(
        '&lt;script&gt;alert(1)&lt;/script&gt;'
      );
    });

    it('extracts nested values by path case-insensitively', () => {
      const data = {
        owner: {
          fullName: 'राम पाटील',
          address: { city: 'पुणे' },
        },
      };
      expect(getValueByPath(data, 'owner.fullName')).toBe('राम पाटील');
      expect(getValueByPath(data, 'owner.address.city')).toBe('पुणे');
      expect(getValueByPath(data, 'OWNER.FULLNAME')).toBe('राम पाटील');
    });
  });

  describe('Interpolation', () => {
    it('interpolates placeholders from dataContext and extraContext', () => {
      const elem = { text: 'मालमत्ता क्र. {{propertyNo}} - {{ownerName}}' };
      const data = { propertyNo: '101', ownerName: 'सचिन सावंत' };
      expect(interpolateElementContent(elem, data)).toBe(
        'मालमत्ता क्र. 101 - सचिन सावंत'
      );
    });

    it('replaces page numbers with Devanagari digits when requested', () => {
      const elem = { text: 'पान {{#PageNumber}}', format: 'devanagari' as const };
      const extra = { pageNum: 2, totalPages: 5 };
      expect(interpolateElementContent(elem, {}, extra)).toBe('पान २ of ५');
    });
  });

  describe('Report and Element Rendering', () => {
    const mockDef: ReportDefinition = {
      reportId: 'Notice119',
      reportCode: 'Notice119',
      reportName: 'कराकारणी नोटीस ११९',
      paperSize: 'A4',
      orientation: 'portrait',
      pageWidth: 794,
      pageHeight: 1123,
      sections: [
        {
          id: 'sec_header',
          name: 'Page Header',
          type: 'pageHeader',
          height: 80,
          visible: true,
        },
        {
          id: 'sec_detail',
          name: 'Detail',
          type: 'detail',
          height: 120,
          visible: true,
        },
      ],
      elements: [
        {
          id: 'el_title',
          name: 'ReportTitle',
          sectionId: 'sec_header',
          type: 'text',
          x: 20,
          y: 10,
          width: 750,
          height: 35,
          text: 'महाराष्ट्र नगरपरिषद मालमत्ता कर नोटीस',
          styles: { fontSize: '14pt', fontWeight: 'bold', textAlign: 'center' },
        },
        {
          id: 'el_owner',
          name: 'OwnerField',
          sectionId: 'sec_detail',
          type: 'field',
          fieldName: 'ownerName',
          x: 40,
          y: 20,
          width: 300,
          height: 25,
          styles: { fontSize: '10pt', color: '#1e293b' },
        },
        {
          id: 'el_box',
          name: 'FrameBox',
          sectionId: 'sec_detail',
          type: 'box',
          x: 30,
          y: 10,
          width: 350,
          height: 60,
          styles: { border: '1px solid #000' },
        },
      ],
    };

    it('renders single element HTML with absolute styles', () => {
      const html = renderElementHtml(mockDef.elements![0]);
      expect(html).toContain('id="el_el_title"');
      expect(html).toContain('left: 20px');
      expect(html).toContain('top: 10px');
      expect(html).toContain('महाराष्ट्र नगरपरिषद मालमत्ता कर नोटीस');
    });

    it('renders full multi-section report pages with correct page structure', () => {
      const data = [{ ownerName: 'गोपाळ गणेश आगरकर' }];
      const result = renderReport(mockDef, data);

      expect(result.totalPages).toBe(1);
      expect(result.pagesHtml).toContain('class="report-page"');
      expect(result.pagesHtml).toContain('data-page="1"');
      expect(result.pagesHtml).toContain('गोपाळ गणेश आगरकर');
      expect(result.stylesHtml).toContain('@page');
    });

    it('renders tables with rowSpan and colSpan', () => {
      const tableElem = {
        id: 'tbl_1',
        name: 'SummaryTable',
        sectionId: 'sec_detail',
        type: 'table' as const,
        x: 10,
        y: 10,
        width: 500,
        height: 80,
        cols: 2,
        rows: 2,
        table: {
          cols: 2,
          rows: 2,
          cells: {
            '0_0': { content: 'शीर्षक', style: { fontWeight: 'bold' } },
            '0_1': { content: 'रक्कम' },
            '1_0': { content: 'एकूण कर' },
            '1_1': { content: '५०००' },
          },
        },
      } as unknown as ReportElement;

      const html = renderElementHtml(tableElem);
      expect(html).toContain('<table');
      expect(html).toContain('शीर्षक');
      expect(html).toContain('५०००');
    });
  });

  describe('Layout Validator & Collision Resolver', () => {
    it('validates report and flags negative coordinates or overflow', () => {
      const invalidDef: ReportDefinition = {
        reportId: 'InvalidReport',
        reportCode: 'InvalidReport',
        paperSize: 'A4',
        pageWidth: 794,
        pageHeight: 1123,
        sections: [{ id: 'sec1', height: 50 }],
        elements: [
          {
            id: 'bad_el',
            sectionId: 'sec1',
            type: 'text',
            x: -10,
            y: 0,
            width: 100,
            height: 20,
          },
          {
            id: 'overflow_el',
            sectionId: 'sec1',
            type: 'text',
            x: 0,
            y: 40,
            width: 100,
            height: 30, // 40 + 30 = 70 > section height 50
          },
        ],
      };

      const res = ReportLayoutValidator.validateReport(invalidDef);
      expect(res.isValid).toBe(false);
      expect(res.errors.some((e) => e.includes('Negative X coordinate'))).toBe(true);
      expect(res.errors.some((e) => e.includes('Exceeds section'))).toBe(true);
    });

    it('auto-resolves collisions and increases section height to fit elements', () => {
      const def: ReportDefinition = {
        reportId: 'OverlapReport',
        reportCode: 'OverlapReport',
        paperSize: 'A4',
        pageWidth: 794,
        pageHeight: 1123,
        sections: [{ id: 'sec1', height: 40 }],
        elements: [
          {
            id: 'el_bottom',
            sectionId: 'sec1',
            type: 'text',
            x: 10,
            y: 35,
            width: 100,
            height: 25, // Bottom: 60 > section height 40
          },
        ],
      };

      const resolved = autoResolveCollisions(def);
      expect((resolved.sections || [])[0].height).toBeGreaterThanOrEqual(64);
    });
  });
});
