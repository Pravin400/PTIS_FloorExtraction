import type {
  DesignerBand,
  DesignerElement,
  DesignerFragment,
  DesignerTemplate,
} from '@/types/report-designer.types';

export interface ReportBandInstance {
  instanceId: string;
  bandId: string;
  type: DesignerBand['type'];
  yMm: number;
  heightMm: number;
  elements: DesignerElement[];
  data: Record<string, unknown>;
  rootData: Record<string, unknown>;
}

export interface ReportLayoutPage {
  index: number;
  bands: ReportBandInstance[];
}

export interface ReportLayoutResult {
  pages: ReportLayoutPage[];
  warnings: string[];
}

interface ExpandedBand {
  band: DesignerBand;
  data: Record<string, unknown>;
  rootData: Record<string, unknown>;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

export function getReportValue(
  currentData: Record<string, unknown>,
  path?: string,
  rootData: Record<string, unknown> = currentData,
): unknown {
  if (!path) return undefined;

  let source: unknown = currentData;
  let normalizedPath = path;
  if (path === '$root') return rootData;
  if (path.startsWith('$root.')) {
    source = rootData;
    normalizedPath = path.slice('$root.'.length);
  } else if (path === '$current') {
    return currentData;
  } else if (path.startsWith('$current.')) {
    normalizedPath = path.slice('$current.'.length);
  }

  return normalizedPath.split('.').reduce<unknown>((value, key) => {
    if (value === null || value === undefined || typeof value !== 'object') return undefined;
    return (value as Record<string, unknown>)[key];
  }, source);
}

function resolveBandRows(
  band: DesignerBand,
  currentData: Record<string, unknown>,
  rootData: Record<string, unknown>,
): Record<string, unknown>[] {
  if (!band.dataPath) return [currentData];
  const value = getReportValue(currentData, band.dataPath, rootData);
  if (Array.isArray(value)) return value.map(asRecord).filter((item): item is Record<string, unknown> => Boolean(item));
  const record = asRecord(value);
  return record ? [record] : [];
}

function findFragment(fragments: DesignerFragment[] | undefined, code?: string): DesignerFragment | undefined {
  if (!code) return undefined;
  return fragments?.find((fragment) => fragment.code === code);
}

function expandBands(
  bands: DesignerBand[],
  currentData: Record<string, unknown>,
  rootData: Record<string, unknown>,
  fragments: DesignerFragment[] | undefined,
  warnings: string[],
  fragmentStack: string[] = [],
): ExpandedBand[] {
  const expanded: ExpandedBand[] = [];

  for (const band of bands) {
    if (band.type === 'subreport') {
      const fragment = findFragment(fragments, band.fragmentCode);
      if (!fragment) {
        const rows = resolveBandRows(band, currentData, rootData);
        if (band.elements.length) {
          for (const row of rows) expanded.push({ band, data: row, rootData });
        } else {
          warnings.push(`Subreport band "${band.id}" references missing fragment "${band.fragmentCode ?? ''}".`);
        }
        continue;
      }
      if (fragmentStack.includes(fragment.code)) {
        warnings.push(`Circular subreport reference ignored: ${[...fragmentStack, fragment.code].join(' -> ')}.`);
        continue;
      }
      if (fragmentStack.length >= 8) {
        warnings.push(`Subreport nesting limit reached at fragment "${fragment.code}".`);
        continue;
      }

      const rows = resolveBandRows(band, currentData, rootData);
      for (const row of rows) {
        expanded.push(...expandBands(
          fragment.bands,
          row,
          rootData,
          fragments,
          warnings,
          [...fragmentStack, fragment.code],
        ));
      }
      continue;
    }

    const rows = resolveBandRows(band, currentData, rootData);
    for (const row of rows) expanded.push({ band, data: row, rootData });
  }

  return expanded;
}

function positiveHeight(band: DesignerBand, warnings: string[]): number {
  if (Number.isFinite(band.heightMm) && band.heightMm > 0) return band.heightMm;
  warnings.push(`Band "${band.id}" has an invalid height and was rendered at 1mm.`);
  return 1;
}

/**
 * Converts a v2 band template into physical A4 pages. The function is pure so
 * the browser preview and the PDF worker use exactly the same pagination.
 */
export function paginateReportTemplate(
  template: DesignerTemplate,
  data: Record<string, unknown>,
): ReportLayoutResult {
  const warnings: string[] = [];
  const sourceBands = template.bands ?? [];
  if (!sourceBands.length) return { pages: [], warnings };

  const pageHeaders = expandBands(
    sourceBands.filter((band) => band.type === 'pageHeader'),
    data,
    data,
    template.fragments,
    warnings,
  );
  const pageFooters = expandBands(
    sourceBands.filter((band) => band.type === 'pageFooter'),
    data,
    data,
    template.fragments,
    warnings,
  );
  const flowBands = expandBands(
    sourceBands.filter((band) => band.type !== 'pageHeader' && band.type !== 'pageFooter'),
    data,
    data,
    template.fragments,
    warnings,
  );

  const headerHeight = pageHeaders.reduce((sum, item) => sum + positiveHeight(item.band, warnings), 0);
  const footerHeight = pageFooters.reduce((sum, item) => sum + positiveHeight(item.band, warnings), 0);
  const contentBottom = template.page.heightMm - footerHeight;
  const pages: ReportLayoutPage[] = [];
  let page: ReportLayoutPage = { index: -1, bands: [] };
  let cursorY = headerHeight;
  let instanceCounter = 0;
  let continuationBands: ExpandedBand[] = [];

  const append = (target: ReportLayoutPage, item: ExpandedBand, yMm: number) => {
    target.bands.push({
      instanceId: `${item.band.id}-${instanceCounter++}`,
      bandId: item.band.id,
      type: item.band.type,
      yMm,
      heightMm: positiveHeight(item.band, warnings),
      elements: item.band.elements,
      data: item.data,
      rootData: item.rootData,
    });
  };

  const createPage = (includeContinuation: boolean) => {
    page = { index: pages.length, bands: [] };
    pages.push(page);
    let headerY = 0;
    for (const item of pageHeaders) {
      append(page, item, headerY);
      headerY += positiveHeight(item.band, warnings);
    }
    cursorY = headerHeight;
    if (includeContinuation) {
      for (const item of continuationBands) {
        append(page, item, cursorY);
        cursorY += positiveHeight(item.band, warnings);
      }
    }
  };

  createPage(false);

  for (const item of flowBands) {
    const height = positiveHeight(item.band, warnings);
    if (item.band.pageBreakBefore && page.bands.length > pageHeaders.length) createPage(true);

    if (cursorY + height > contentBottom && cursorY > headerHeight) createPage(true);
    if (cursorY + height > contentBottom) {
      warnings.push(`Band "${item.band.id}" is taller than the available page area and may be clipped.`);
    }

    append(page, item, cursorY);
    cursorY += height;

    if (item.band.type === 'groupHeader' && item.band.repeatOnPageBreak) {
      continuationBands = [item];
    } else if (item.band.type === 'groupFooter' || item.band.type === 'reportFooter') {
      continuationBands = [];
    }

    if (item.band.pageBreakAfter) createPage(true);
  }

  for (const targetPage of pages) {
    let footerY = template.page.heightMm - footerHeight;
    for (const item of pageFooters) {
      append(targetPage, item, footerY);
      footerY += positiveHeight(item.band, warnings);
    }
  }

  return { pages, warnings: [...new Set(warnings)] };
}
