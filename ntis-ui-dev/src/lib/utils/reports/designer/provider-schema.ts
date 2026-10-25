import type {
  DesignerDataSource,
  DesignerDataSourceField,
  DesignerFieldCatalogEntry,
} from '@/types/report-designer.types';

export function normalizeProviderIdentity(value: string): string {
  return String(value || '')
    .replace(/data\s*provider$/i, '')
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase();
}

export function canonicalProviderCode(source: DesignerDataSource, fallback = ''): string {
  const candidate = String(source.executionReportCode || '').trim();
  if (candidate) {
    return /DataProvider$/i.test(candidate) ? candidate : `${candidate}DataProvider`;
  }

  const name = String(source.name || '').trim();
  if (name) return /DataProvider$/i.test(name) ? name : `${name}DataProvider`;
  return fallback.trim();
}

export function matchDesignerDataSource(
  sources: DesignerDataSource[],
  requestedCode: string,
): DesignerDataSource | undefined {
  const requested = normalizeProviderIdentity(requestedCode);
  if (!requested) return undefined;

  return sources.find((source) => [
    source.executionReportCode || '',
    source.code || '',
    source.name || '',
  ].some((candidate) => normalizeProviderIdentity(candidate) === requested));
}

export function matchRegisteredProviderCode(
  providerCodes: string[],
  requestedCode: string,
): string | undefined {
  const requested = normalizeProviderIdentity(requestedCode);
  if (!requested) return undefined;
  return providerCodes.find((code) => normalizeProviderIdentity(code) === requested);
}

export function flattenDesignerFields(
  fields: DesignerDataSourceField[],
): DesignerFieldCatalogEntry[] {
  const collectionPaths = new Set<string>();
  const discoverCollections = (items: DesignerDataSourceField[]) => {
    items.forEach((field) => {
      if (field.valueType === 'collection' && field.path) collectionPaths.add(field.path);
      discoverCollections(field.children ?? []);
    });
  };
  discoverCollections(fields);

  const result: DesignerFieldCatalogEntry[] = [];
  const seen = new Set<string>();
  const visit = (items: DesignerDataSourceField[], inheritedCollection?: string) => {
    items.forEach((field) => {
      const inferredCollection = inheritedCollection || [...collectionPaths]
        .filter((path) => field.path.startsWith(`${path}.`))
        .sort((left, right) => right.length - left.length)[0];
      const entry: DesignerFieldCatalogEntry = {
        name: field.path,
        label: field.label || field.path,
        type: field.valueType || 'string',
        elementType: field.elementType || (field.valueType === 'collection' ? 'table' : 'field'),
        group: field.group,
        ...(inferredCollection ? { collectionPath: inferredCollection } : {}),
      };
      const key = `${entry.collectionPath || ''}|${entry.name}`;
      if (entry.name && !seen.has(key)) {
        seen.add(key);
        result.push(entry);
      }

      const childCollection = field.valueType === 'collection'
        ? field.path
        : inferredCollection;
      visit(field.children ?? [], childCollection);
    });
  };
  visit(fields);
  return result;
}

export function mergeFieldCatalogs(
  ...catalogs: Array<DesignerFieldCatalogEntry[] | undefined>
): DesignerFieldCatalogEntry[] {
  const merged = new Map<string, DesignerFieldCatalogEntry>();
  catalogs.flatMap((catalog) => catalog ?? []).forEach((field) => {
    if (!field.name) return;
    const key = `${field.collectionPath || ''}|${field.name}`;
    if (!merged.has(key)) merged.set(key, field);
  });
  return [...merged.values()];
}
