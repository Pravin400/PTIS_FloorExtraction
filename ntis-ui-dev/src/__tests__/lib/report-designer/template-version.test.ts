// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { latestDesignerTemplateVersion } from '@/lib/utils/reports/designer/template-version';
import type { DesignerTemplateVersion } from '@/types/report-designer.types';

const version = (versionNo: number, status: string): DesignerTemplateVersion => ({
  id: versionNo, versionNo, status, templateJson: '{}', createdDate: '', publishedDate: null,
});

describe('designer template version selection', () => {
  it('opens the published layout when a stale draft remains', () => {
    const published = version(56, 'Published');
    expect(latestDesignerTemplateVersion([version(50, 'Draft'), published])).toBe(published);
  });

  it('opens newer unpublished edits', () => {
    const draft = version(57, 'Draft');
    expect(latestDesignerTemplateVersion([version(56, 'Published'), draft])).toBe(draft);
  });

  it('ignores archived versions while active versions exist, regardless of ordering or case', () => {
    const published = version(56, 'PUBLISHED');
    const versions = [version(60, 'Archived'), version(50, 'draft'), published];
    expect(latestDesignerTemplateVersion(versions)).toBe(published);
    expect(versions.map((item) => item.versionNo)).toEqual([60, 50, 56]);
  });

  it('keeps the latest historical layout available when no active version exists', () => {
    expect(latestDesignerTemplateVersion([version(2, 'Archived'), version(3, 'Archived')])?.versionNo).toBe(3);
    expect(latestDesignerTemplateVersion([])).toBeUndefined();
  });
});
