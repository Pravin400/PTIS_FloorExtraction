import type {
  DesignerDataSource,
  DesignerReportSettingsOptions,
} from '@/types/report-designer.types';

export const REPORT_IMPORT_MAX_BYTES = 25 * 1024 * 1024;
export const REPORT_IMPORT_MAX_SUBREPORTS = 12;
export const REPORT_IMPORT_ID_PATTERN = /^[A-Za-z][A-Za-z0-9_]{2,99}$/;

export interface DetectedReportImportMetadata {
  reportId: string;
  reportName: string;
  moduleId: number | null;
  moduleName: string;
  dataProviderCode: string;
  dataSourceCode: string;
  paperSize: string;
  orientation: 'portrait' | 'landscape';
}

function normalized(value: string): string {
  return value
    .replace(/DataProvider$/i, '')
    .replace(/[^a-z0-9]/gi, '')
    .toLocaleLowerCase();
}

export function reportSourceBaseName(fileName: string): string {
  return fileName.replace(/\.(rpt|pdf)$/i, '').trim();
}

export function suggestedImportedReportId(fileName: string): string {
  const slug = reportSourceBaseName(fileName)
    .normalize('NFKD')
    .replace(/[^a-z0-9_]+/gi, '_')
    .replace(/^_+|_+$/g, '');
  return (/^[a-z]/i.test(slug) ? slug : `Report_${slug || 'Imported'}`).slice(0, 100);
}

function providerCandidates(
  options: DesignerReportSettingsOptions,
  dataSources: DesignerDataSource[]
): string[] {
  const values = new Set(options.dataProviderCodes.filter(Boolean));
  dataSources.forEach((source) => {
    if (source.executionReportCode) values.add(source.executionReportCode);
  });
  values.delete('UnassignedReportDataProvider');
  return [...values];
}

function matchScore(sourceName: string, candidate: string): number {
  const source = normalized(sourceName);
  const value = normalized(candidate);
  if (!source || !value) return 0;
  if (source === value) return 100;
  if (source.includes(value) || value.includes(source)) return 80;
  const tokens = sourceName
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(/[^a-z0-9]+/i)
    .map(normalized)
    .filter((token) => token.length >= 3);
  return tokens.reduce((score, token) => score + (value.includes(token) ? token.length : 0), 0);
}

function detectedProvider(
  sourceName: string,
  options: DesignerReportSettingsOptions,
  dataSources: DesignerDataSource[]
): string {
  const candidates = providerCandidates(options, dataSources);
  const ranked = candidates
    .map((value) => ({ value, score: matchScore(sourceName, value) }))
    .sort((left, right) => right.score - left.score);
  if (ranked[0]?.score > 0) return ranked[0].value;
  return (
    candidates.find((value) => /property.?tax/i.test(value)) ||
    candidates[0] ||
    'PropertyTaxReportDataProvider'
  );
}

export function dataSourceForProvider(
  providerCode: string,
  dataSources: DesignerDataSource[]
): string {
  const provider = normalized(providerCode);
  const exact = dataSources.find((source) =>
    [source.executionReportCode, source.code, source.name].some(
      (value) => normalized(String(value || '')) === provider
    )
  );
  if (exact) return exact.code;
  const partial = dataSources.find((source) =>
    [source.executionReportCode, source.code, source.name].some((value) => {
      const candidate = normalized(String(value || ''));
      return candidate && (provider.includes(candidate) || candidate.includes(provider));
    })
  );
  return (
    partial?.code ||
    providerCode
      .replace(/DataProvider$/i, '')
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[^a-z0-9_]/gi, '_')
      .toUpperCase()
  );
}

export function detectReportImportMetadata(
  fileName: string,
  options: DesignerReportSettingsOptions,
  dataSources: DesignerDataSource[]
): DetectedReportImportMetadata {
  const baseName = reportSourceBaseName(fileName);
  const lowerName = baseName.toLocaleLowerCase();
  const moduleMatch = options.modules
    .map((value) => ({ value, score: matchScore(baseName, value.name) }))
    .sort((left, right) => right.score - left.score)[0];
  const selectedModule =
    moduleMatch?.score > 0
      ? moduleMatch.value
      : options.modules.find((value) => /property.?tax|मालमत्ता/i.test(value.name)) ||
        options.modules[0];
  const dataProviderCode = detectedProvider(baseName, options, dataSources);
  const landscape = /a3|landscape|prarup|yadi|प्रारूप|यादी/i.test(lowerName);
  const paperSize =
    /a3/i.test(lowerName) || /prarup|yadi/i.test(lowerName)
      ? 'A3'
      : /legal/i.test(lowerName)
        ? 'Legal'
        : 'A4';

  return {
    reportId: suggestedImportedReportId(fileName),
    reportName: baseName
      .replace(/[_-]+/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .trim(),
    moduleId: selectedModule?.id ?? null,
    moduleName: selectedModule?.name ?? '',
    dataProviderCode,
    dataSourceCode: dataSourceForProvider(dataProviderCode, dataSources),
    paperSize,
    orientation: landscape ? 'landscape' : 'portrait',
  };
}

export function detectPdfPaper(
  widthMm: number,
  heightMm: number
): Pick<DetectedReportImportMetadata, 'paperSize' | 'orientation'> {
  const maxDimension = Math.max(widthMm, heightMm);
  const paperSize =
    Math.abs(maxDimension - 420) < 30
      ? 'A3'
      : Math.abs(maxDimension - 356) < 25
        ? 'Legal'
        : Math.abs(maxDimension - 297) < 25
          ? 'A4'
          : Math.abs(maxDimension - 279) < 25
            ? 'Letter'
            : 'Custom';
  return {
    paperSize,
    orientation: widthMm > heightMm ? 'landscape' : 'portrait',
  };
}
