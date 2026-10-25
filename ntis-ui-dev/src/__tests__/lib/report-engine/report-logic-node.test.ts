// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';

vi.mock('react', () => {
  throw new Error('Shared report logic must run without React.');
});

import { renderReport, resolvePageGeometry, ReportLayoutValidator } from '@/lib/utils/reports/engine';
import { createBlankReportDefinition, createDefaultTableStructure } from '@/lib/utils/reports/designer/editor-defaults';
import { safeImageUrl } from '@/lib/utils/reports/designer/image-url';
import { englishFieldLabel } from '@/lib/utils/reports/designer/field-label';

describe('shared report logic in Node.js without React', () => {
  it('renders and validates bound report data using physical page geometry', () => {
    const definition = {
      paperSize: 'A4',
      sections: [{ id: 'details', type: 'detail', height: 40 }],
      elements: [{
        id: 'owner', sectionId: 'details', type: 'field', fieldName: 'ownerName',
        x: 0, y: 0, width: 200, height: 20,
      }],
    };
    expect(resolvePageGeometry(definition).widthMm).toBe(210);
    expect(ReportLayoutValidator.validateReport(definition).isValid).toBe(true);
    const rendered = renderReport(definition, [{ ownerName: 'Report Owner' }]);
    expect(rendered.totalPages).toBe(1);
    expect(rendered.pagesHtml).toContain('Report Owner');
  });

  it('creates editor models and formats field labels and image URLs without UI imports', () => {
    const definition = createBlankReportDefinition('Notice', 'NOTICE');
    expect(definition.reportName).toBe('Notice');
    expect(definition.orientation).toBe('landscape');
    expect(definition.sections).toHaveLength(3);
    const table = createDefaultTableStructure(2, 3, 300);
    expect(table.columnWidths).toEqual([100, 100, 100]);
    expect(table.cells['1_2'].content).toBe('R2C3');
    expect(englishFieldLabel('property.ownerId', '')).toBe('Owner ID');
    expect(safeImageUrl('/api/document/image')).toBe('/api/document/image');
    expect(safeImageUrl('javascript:alert(1)')).toBeUndefined();
  });
});
