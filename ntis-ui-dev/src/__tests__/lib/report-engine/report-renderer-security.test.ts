import { describe, expect, it } from 'vitest';
import { renderElementHtml, renderReport } from '@/lib/utils/reports/engine';
import type { ReportDefinition, ReportElement } from '@/lib/utils/reports/engine';

const element: ReportElement = {
  id: 'owner',
  sectionId: 'detail',
  type: 'field',
  fieldName: 'ownerName',
  x: 10,
  y: 10,
  width: 300,
  height: 30,
};
const definition: ReportDefinition = {
  reportId: 'security-test',
  paperSize: 'A4',
  orientation: 'portrait',
  sections: [{ id: 'detail', type: 'detail', height: 100 }],
  elements: [element],
};
const payload = '<b onmouseover="alert(1)">Owner<img src=x onerror="alert(2)"></b>';
const parse = (html: string) => {
  const host = document.createElement('div');
  host.innerHTML = html;
  return host;
};

describe('report renderer HTML security', () => {
  it.each(['field', 'formula', 'text', 'text_box'] as const)(
    'treats bound %s values as text even when they contain rich HTML',
    (type) => {
      const html = renderElementHtml(
        { ...element, type, text: '{ownerName}' },
        { ownerName: payload }
      );
      const host = parse(html);
      expect(host.textContent).toBe(payload);
      expect(host.querySelector('b, img, [onmouseover], [onerror]')).toBeNull();
    }
  );

  it.each(['field', 'formula', 'text', 'text_box'] as const)(
    'escapes dynamic %s values even when the template explicitly enables HTML',
    (type) => {
      const html = renderElementHtml(
        { ...element, type, text: '{ownerName}', isHtml: true },
        { ownerName: payload }
      );
      const host = parse(html);
      expect(host.textContent).toBe(payload);
      expect(host.querySelector('b, img, [onmouseover], [onerror]')).toBeNull();
    }
  );

  it('preserves template formatting while escaping nested data and formula values', () => {
    const html = renderElementHtml(
      {
        ...element,
        type: 'text',
        fieldName: undefined,
        text: '<strong>{owner.name}</strong><span>{@remark}</span>',
        renderMode: 'html',
      },
      { owner: { name: 'A & B <img src=x onerror="alert(1)">' } },
      { remark: '<script>alert(2)</script>' }
    );
    const host = parse(html);
    expect(host.querySelector('strong')?.textContent).toBe('A & B <img src=x onerror="alert(1)">');
    expect(host.textContent).toContain('<script>alert(2)</script>');
    expect(host.querySelector('img, script')).toBeNull();
  });

  it('sanitizes unsafe template HTML while retaining harmless rich text', () => {
    const html = renderElementHtml({
      ...element,
      type: 'text_box',
      fieldName: undefined,
      text: '<b onclick="alert(1)">Notice</b><img src=x onerror="alert(2)"><script>alert(3)</script>',
      isHtml: true,
    });
    const host = parse(html);
    expect(host.querySelector('b')?.textContent).toBe('Notice');
    expect(host.querySelector('script, [onclick], [onerror]')).toBeNull();
  });

  it('sanitizes final report markup, including injected attributes and unsafe image URLs', () => {
    const rendered = renderReport(
      {
        ...definition,
        elements: [
          { ...element, styles: { color: 'red" onmouseover="alert(1)' } },
          { ...element, id: 'photo', type: 'image', fieldName: 'photo' },
        ],
      },
      [{ ownerName: payload, photo: 'javascript:alert(2)' }]
    );
    const host = parse(rendered.pagesHtml);
    expect(host.querySelector('[onmouseover], [onerror], script')).toBeNull();
    expect(host.querySelector('img')?.getAttribute('src')).toBeNull();
    expect(host.querySelector('.report-page')).not.toBeNull();
  });
});
