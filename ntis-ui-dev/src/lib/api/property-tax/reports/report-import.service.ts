import 'server-only';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { cookies } from 'next/headers';
import { reportResult } from '@/lib/api/property-tax/reports/report-service-result';
import {
  buildPdfReportDefinition,
  buildRptReportDefinition,
  fieldCatalogFromRptAnalysis,
  type PdfImportLayout,
  type RptImportAnalysis,
} from '@/lib/utils/reports/import/build-imported-report';
import {
  mergeFieldCatalogs,
} from '@/lib/utils/reports/designer/provider-schema';
import { resolveProviderSchema } from '@/lib/utils/reports/designer/provider-schema.server';
import { uploadReportSourceDocument } from '@/lib/utils/reports/designer/report-source-documents.server';
import rptParser from '@/lib/utils/reports/import/server/rpt-parser';
import nativeBridge from '@/lib/utils/reports/import/server/native-cr-bridge.server';
import { apiClient } from '@/services/api.service';
import type {
  DesignerDataSource,
  DesignerReportSettingsOptions,
} from '@/types/report-designer.types';


const MAX_SOURCE_BYTES = 25 * 1024 * 1024;
const MAX_SUBREPORTS = 12;
const REPORT_ID_PATTERN = /^[A-Za-z][A-Za-z0-9_]{2,99}$/;

async function optionalWithin<T>(
  operation: Promise<T>,
  timeoutMs: number,
  label: string,
): Promise<T | undefined> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const guarded = operation.catch((error) => {
    console.warn(`${label} was unavailable; continuing without it.`, error);
    return undefined;
  });
  const timeout = new Promise<undefined>((resolve) => {
    timeoutId = setTimeout(() => {
      console.warn(`${label} exceeded ${timeoutMs}ms; continuing without it.`);
      resolve(undefined);
    }, timeoutMs);
  });
  try {
    return await Promise.race([guarded, timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

const parser = rptParser;

const textEntry = (form: FormData, name: string): string => {
  const value = form.get(name);
  return typeof value === 'string' ? value.trim() : '';
};

const fileEntry = (form: FormData, name: string): File | null => {
  const value = form.get(name);
  return value instanceof File && value.size > 0 ? value : null;
};

function validFile(file: File, extension: string, contentType?: string): boolean {
  const nameMatches = file.name.toLowerCase().endsWith(extension);
  return nameMatches && (!contentType || !file.type || file.type === contentType);
}

async function providerSampleData(providerCode: string): Promise<Record<string, unknown> | undefined> {
  if (!providerCode || providerCode === 'UnassignedReportDataProvider') return undefined;
  const result = await apiClient.get<Record<string, unknown>[]>(
    `/designer-report-templates/preview-data/${encodeURIComponent(providerCode)}`,
  );
  return result.success && Array.isArray(result.data) && result.data.length > 0
    ? result.data[0]
    : undefined;
}

async function tryNativeCrystalExtraction(buffer: Buffer): Promise<Record<string, unknown> | null> {
  if (process.platform !== 'win32') return null;
  const workingDirectory = await mkdtemp(path.join(tmpdir(), 'ntis-rpt-import-'));
  const rptPath = path.join(workingDirectory, 'source.rpt');
  try {
    await writeFile(rptPath, buffer);
    return await nativeBridge.extractNativeRptDefinition(rptPath, workingDirectory);
  } catch (error) {
    console.warn('Native Crystal extraction was unavailable; using the portable parser.', error);
    return null;
  } finally {
    await rm(workingDirectory, { recursive: true, force: true });
  }
}

function readPdfLayout(raw: string): PdfImportLayout | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PdfImportLayout;
    if (!Number.isFinite(parsed.pageWidth) || !Number.isFinite(parsed.pageHeight)) return null;
    parsed.items = Array.isArray(parsed.items) ? parsed.items : [];
    return parsed;
  } catch {
    return null;
  }
}

function prefixExternalSubreportDefinition(
  nativeDefinition: Record<string, unknown> | null,
  id: string,
  name: string,
): { sections: Record<string, unknown>[]; elements: Record<string, unknown>[] } | null {
  const sourceSections = Array.isArray(nativeDefinition?.sections)
    ? nativeDefinition.sections as Record<string, unknown>[]
    : [];
  const sourceElements = Array.isArray(nativeDefinition?.elements)
    ? nativeDefinition.elements as Record<string, unknown>[]
    : [];
  if (sourceSections.length === 0 || sourceElements.length === 0) return null;

  const prefix = `external_${id}`;
  const sectionIds = new Map<string, string>();
  const sections = sourceSections.map((section, index) => {
    const sourceId = String(section.id || `section_${index + 1}`);
    const nextId = `${prefix}_${sourceId}`;
    sectionIds.set(sourceId, nextId);
    return {
      ...section,
      id: nextId,
      name: `Subreport: ${name} / ${String(section.name || sourceId)}`,
      isSubreport: true,
      subreportName: name,
    };
  });
  const elements = sourceElements.map((element, index) => ({
    ...element,
    id: `${prefix}_${String(element.id || `element_${index + 1}`)}`,
    sectionId: sectionIds.get(String(element.sectionId || '')) || sections[0].id,
    properties: {
      ...(element.properties && typeof element.properties === 'object'
        ? element.properties as Record<string, unknown>
        : {}),
      importRole: 'externalSubreportObject',
      sourceSubreport: name,
    },
  }));
  return { sections, elements };
}

export async function getDesignerImportOptionsServer() {
  const hasTenantSession = Boolean((await cookies()).get('auth_token')?.value);
  if (!hasTenantSession) {
    return reportResult({ error: 'A tenant login is required.' }, { status: 401 });
  }

  const [options, dataSources] = await Promise.all([
    apiClient.get<DesignerReportSettingsOptions>('/designer-report-templates/settings/options'),
    apiClient.get<DesignerDataSource[]>('/designer-report-templates/data-sources'),
  ]);
  if (!options.success || !options.data) {
    return reportResult(
      { error: options.error || 'Report import options could not be loaded.' },
      { status: options.statusCode || 502 },
    );
  }

  return reportResult({
    options: options.data,
    dataSources: dataSources.success && Array.isArray(dataSources.data) ? dataSources.data : [],
  });
}

export async function importDesignerReportServer(form: FormData) {
  const hasTenantSession = Boolean((await cookies()).get('auth_token')?.value);
  if (!hasTenantSession) {
    return reportResult({ error: 'A tenant login is required.' }, { status: 401 });
  }

  try {
    const reportId = textEntry(form, 'reportId');
    const reportName = textEntry(form, 'reportName');
    const moduleIdValue = Number(textEntry(form, 'moduleId'));
    const moduleId = Number.isInteger(moduleIdValue) && moduleIdValue > 0 ? moduleIdValue : null;
    const moduleName = textEntry(form, 'moduleName');
    const dataProviderCode = textEntry(form, 'dataProviderCode');
    const dataSourceCode = textEntry(form, 'dataSourceCode') || dataProviderCode;
    const paperSize = textEntry(form, 'paperSize') || 'A4';
    const orientation: 'portrait' | 'landscape' = textEntry(form, 'orientation') === 'landscape'
      ? 'landscape'
      : 'portrait';
    const currentTenantIdValue = Number(textEntry(form, 'currentTenantId'));
    const currentTenantId = Number.isInteger(currentTenantIdValue) && currentTenantIdValue > 0
      ? currentTenantIdValue
      : undefined;
    const rptFile = fileEntry(form, 'rptFile');
    const pdfFile = fileEntry(form, 'pdfFile');
    const subreportFiles = form.getAll('subreports')
      .filter((value): value is File => value instanceof File && value.size > 0)
      .slice(0, MAX_SUBREPORTS);

    if (!REPORT_ID_PATTERN.test(reportId)) {
      return reportResult(
        { error: 'Report ID must start with a letter and contain only letters, numbers, or underscores.' },
        { status: 400 },
      );
    }
    if (!reportName || reportName.length > 200) {
      return reportResult({ error: 'A report title of up to 200 characters is required.' }, { status: 400 });
    }
    if (!dataProviderCode) {
      return reportResult({ error: 'A data provider is required.' }, { status: 400 });
    }
    if (!rptFile && !pdfFile) {
      return reportResult({ error: 'Select a Crystal .rpt file or a reference PDF.' }, { status: 400 });
    }
    if (rptFile && (!validFile(rptFile, '.rpt') || rptFile.size > MAX_SOURCE_BYTES)) {
      return reportResult({ error: 'The Crystal report must be a valid .rpt file up to 25 MB.' }, { status: 400 });
    }
    if (pdfFile && (!validFile(pdfFile, '.pdf', 'application/pdf') || pdfFile.size > MAX_SOURCE_BYTES)) {
      return reportResult({ error: 'The reference file must be a valid PDF up to 25 MB.' }, { status: 400 });
    }
    if (subreportFiles.some((file) => !validFile(file, '.rpt') || file.size > MAX_SOURCE_BYTES)) {
      return reportResult({ error: 'Every subreport must be a valid .rpt file up to 25 MB.' }, { status: 400 });
    }

    const [providerResolution, referencePdf] = await Promise.all([
      optionalWithin(
        resolveProviderSchema(dataProviderCode, dataSourceCode),
        8_000,
        'Provider schema',
      ),
      pdfFile
        ? optionalWithin(
            uploadReportSourceDocument(pdfFile, 'HtmlReportReferencePdf'),
            15_000,
            'Reference PDF storage',
          )
        : Promise.resolve(undefined),
    ]);
    if (!providerResolution?.matched) {
      return reportResult(
        { error: `Data provider '${dataProviderCode}' is not registered in the report API.` },
        { status: 400 },
      );
    }

    const resolvedProviderCode = providerResolution.dataProviderCode;
    const resolvedDataSourceCode = providerResolution.dataSourceCode;
    const sampleData = !rptFile
      ? await optionalWithin(
          providerSampleData(resolvedProviderCode),
          2_500,
          'Provider sample data',
        )
      : undefined;
    const sharedOptions = {
      reportId,
      reportName,
      paperSize,
      orientation,
      moduleId,
      moduleName,
      dataProviderCode: resolvedProviderCode,
      dataSourceCode: resolvedDataSourceCode,
      tenantId: currentTenantId ?? null,
      currentTenantId,
      sampleData,
      referencePdf,
    };

    let definition;
    let analysisSummary: Record<string, unknown>;
    if (rptFile) {
      const rptBuffer = Buffer.from(await rptFile.arrayBuffer());
      const parserColumns = providerResolution.fields.map((field) => ({
        name: field.name,
        label: field.label,
      }));
      const analysis: RptImportAnalysis = parser.parseRptBuffer(rptBuffer, rptFile.name, {
        title: reportName,
        columns: parserColumns,
      });
      if (!analysis.isValidRpt) {
        return reportResult(
          { error: 'The selected file is not a valid Crystal Reports OLE/CFBF document.' },
          { status: 400 },
        );
      }

      const nativeDefinition = await tryNativeCrystalExtraction(rptBuffer);
      const nativeElements = Array.isArray(nativeDefinition?.elements)
        ? nativeDefinition.elements as Record<string, unknown>[]
        : [];
      const nativeSections = Array.isArray(nativeDefinition?.sections)
        ? nativeDefinition.sections as Record<string, unknown>[]
        : [];
      if (nativeElements.length > 0 && nativeSections.length > 0) {
        analysis.sections = nativeSections;
        analysis.elements = nativeElements;
        analysis.metadata = {
          ...(analysis.metadata ?? {}),
          paperSize: nativeDefinition?.paperSize,
          orientation: nativeDefinition?.orientation,
          pageWidth: nativeDefinition?.pageWidth,
          pageHeight: nativeDefinition?.pageHeight,
          widthMm: nativeDefinition?.widthMm,
          heightMm: nativeDefinition?.heightMm,
          margins: nativeDefinition?.margins,
        };
      }

      const externalSubreports: Array<{ id: string; name: string }> = [];
      const exactExternalSections: Record<string, unknown>[] = [];
      const exactExternalElements: Record<string, unknown>[] = [];
      const fallbackExternalSubreports: Array<{ id: string; name: string }> = [];
      for (const [index, file] of subreportFiles.entries()) {
        const subBuffer = Buffer.from(await file.arrayBuffer());
        const subAnalysis = parser.parseRptBuffer(subBuffer, file.name, { title: file.name.replace(/\.rpt$/i, '') });
        if (!subAnalysis.isValidRpt) continue;
        const name = file.name.replace(/\.rpt$/i, '');
        const id = name.replace(/[^a-z0-9_]/gi, '_').toLowerCase() || `subreport_${index + 1}`;
        const descriptor = { id, name };
        externalSubreports.push(descriptor);
        const nativeSubreport = await tryNativeCrystalExtraction(subBuffer);
        const exactDefinition = prefixExternalSubreportDefinition(nativeSubreport, id, name);
        if (exactDefinition) {
          exactExternalSections.push(...exactDefinition.sections);
          exactExternalElements.push(...exactDefinition.elements);
        } else {
          fallbackExternalSubreports.push(descriptor);
        }
      }
      if (exactExternalSections.length > 0) {
        analysis.sections = [...(analysis.sections ?? []), ...exactExternalSections];
        analysis.elements = [...(analysis.elements ?? []), ...exactExternalElements];
      }
      if (fallbackExternalSubreports.length > 0) {
        const generated = parser.generateSubreportSections(
          fallbackExternalSubreports,
          Number(analysis.metadata?.pageWidth || 794),
        );
        analysis.sections = [...(analysis.sections ?? []), ...(generated.sections ?? [])];
        analysis.elements = [...(analysis.elements ?? []), ...(generated.elements ?? [])];
      }

      const fieldCatalog = mergeFieldCatalogs(
        providerResolution.fields,
        fieldCatalogFromRptAnalysis(analysis),
      );
      definition = buildRptReportDefinition(analysis, { ...sharedOptions, fieldCatalog });
      analysisSummary = {
        sourceType: 'rpt',
        fileName: rptFile.name,
        sections: analysis.sections?.length ?? 0,
        elements: analysis.elements?.length ?? 0,
        embeddedImages: analysis.images?.length ?? 0,
        embeddedSubreports: analysis.subreports?.length ?? 0,
        externalSubreports: externalSubreports.length,
        exactExternalSubreports: externalSubreports.length - fallbackExternalSubreports.length,
        parameters: analysis.parametersDetected?.length ?? 0,
        nativeCrystalExtraction: nativeElements.length > 0,
        dataProviderCode: resolvedProviderCode,
        databaseFields: fieldCatalog.length,
      };
    } else {
      const pdfLayout = readPdfLayout(textEntry(form, 'pdfLayout'));
      if (!pdfLayout) {
        return reportResult(
          { error: 'The PDF layout could not be read. Please select the PDF again.' },
          { status: 400 },
        );
      }
      definition = buildPdfReportDefinition(pdfLayout, {
        ...sharedOptions,
        fieldCatalog: providerResolution.fields,
      });
      analysisSummary = {
        sourceType: 'pdf',
        fileName: pdfFile?.name,
        pages: pdfLayout.pageCount ?? 1,
        importedPage: 1,
        editableTextElements: definition.elements.filter((element) =>
          element.type === 'text' || element.type === 'field').length,
        editableVisualElements: definition.elements.filter((element) =>
          element.type === 'line' || element.type === 'box' || element.type === 'image').length,
        dynamicFieldElements: definition.elements.filter((element) => element.type === 'field').length,
        dataProviderCode: resolvedProviderCode,
        databaseFields: providerResolution.fields.length,
      };
    }

    return reportResult({
      success: true,
      definition,
      analysis: analysisSummary,
    });
  } catch (error) {
    console.error('Report import failed:', error);
    return reportResult(
      { error: error instanceof Error ? error.message : 'The report could not be imported.' },
      { status: 500 },
    );
  }
}
