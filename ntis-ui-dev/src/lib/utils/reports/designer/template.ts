import type {
  DesignerBand,
  DesignerElement,
  DesignerTemplate,
} from '@/types/report-designer.types';

export function getValueByPath(data: Record<string, unknown>, path?: string): unknown {
  if (!path) return undefined;
  return path.split('.').reduce<unknown>((value, key) => {
    if (!value || typeof value !== 'object') return undefined;
    return (value as Record<string, unknown>)[key];
  }, data);
}

export function formatDesignerValue(value: unknown, format?: DesignerElement['format']): string {
  if (value === null || value === undefined || value === '') return '—';
  if (format === 'date') {
    const date = new Date(String(value));
    if (!Number.isNaN(date.getTime())) return new Intl.DateTimeFormat('en-IN').format(date);
  }
  if (format === 'currency') {
    const amount = Number(value);
    if (Number.isFinite(amount))
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

export function safeParseTemplate(value?: string | null): DesignerTemplate | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as DesignerTemplate;
    const hasFlatElements = Array.isArray(parsed.elements);
    const hasBands = Array.isArray(parsed.bands);
    return parsed.page && (hasFlatElements || hasBands)
      ? migrateDesignerTemplate({ ...parsed, elements: hasFlatElements ? parsed.elements : [] })
      : null;
  } catch {
    return null;
  }
}

/** Migrates persisted v1/v2 documents into canonical v3 while retaining old coordinate aliases. */
export function migrateDesignerTemplate(template: DesignerTemplate): DesignerTemplate {
  const migrateElement = (element: DesignerElement): DesignerElement => ({
    ...element,
    width: element.width ?? element.w,
    height: element.height ?? element.h,
    binding: element.binding ?? element.path,
    children: element.children?.map(migrateElement),
  });
  const migrateBand = (band: DesignerBand): DesignerBand => ({
    ...band,
    elements: band.elements.map(migrateElement),
  });
  return {
    ...template,
    schemaVersion: 3,
    page: {
      ...template.page,
      margin: template.page.margin ?? { topMm: 0, rightMm: 0, bottomMm: 0, leftMm: 0 },
    },
    elements: template.elements.map(migrateElement),
    bands: template.bands?.map(migrateBand),
    fragments: template.fragments?.map((fragment) => ({
      ...fragment,
      version: fragment.version ?? 1,
      bands: fragment.bands.map(migrateBand),
    })),
  };
}

export function createElementId(type: string): string {
  return `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function findTemplateElement(
  template: DesignerTemplate,
  id: string | null
): DesignerElement | null {
  if (!id) return null;
  const flatElement = template.elements.find((element) => element.id === id);
  if (flatElement) return flatElement;
  for (const band of template.bands ?? []) {
    const element = band.elements.find((item) => item.id === id);
    if (element) return element;
  }
  for (const fragment of template.fragments ?? []) {
    for (const band of fragment.bands) {
      const element = band.elements.find((item) => item.id === id);
      if (element) return element;
    }
  }
  return null;
}

export function updateTemplateElement(
  template: DesignerTemplate,
  id: string,
  patch: Partial<DesignerElement>
): DesignerTemplate {
  // v3 uses width/height/binding, while the existing canvas still edits the
  // w/h/path aliases. Keep both representations in lockstep so a resize or
  // binding edit cannot render differently in the browser and the worker.
  const synchronizedPatch: Partial<DesignerElement> = {
    ...patch,
    ...(patch.w !== undefined ? { width: patch.w } : {}),
    ...(patch.width !== undefined ? { w: patch.width } : {}),
    ...(patch.h !== undefined ? { height: patch.h } : {}),
    ...(patch.height !== undefined ? { h: patch.height } : {}),
    ...(patch.path !== undefined ? { binding: patch.path } : {}),
    ...(patch.binding !== undefined ? { path: patch.binding } : {}),
  };
  const updateElement = (element: DesignerElement): DesignerElement => ({
    ...(element.id === id ? { ...element, ...synchronizedPatch } : element),
    children: element.children?.map(updateElement),
  });
  const update = (elements: DesignerElement[]) => elements.map(updateElement);
  return {
    ...template,
    elements: update(template.elements),
    bands: template.bands?.map((band) => ({ ...band, elements: update(band.elements) })),
    fragments: template.fragments?.map((fragment) => ({
      ...fragment,
      bands: fragment.bands.map((band) => ({ ...band, elements: update(band.elements) })),
    })),
  };
}

export function removeTemplateElement(template: DesignerTemplate, id: string): DesignerTemplate {
  const remove = (elements: DesignerElement[]): DesignerElement[] =>
    elements
      .filter((element) => element.id !== id)
      .map((element) => ({
        ...element,
        children: element.children ? remove(element.children) : undefined,
      }));
  return {
    ...template,
    elements: remove(template.elements),
    bands: template.bands?.map((band) => ({ ...band, elements: remove(band.elements) })),
    fragments: template.fragments?.map((fragment) => ({
      ...fragment,
      bands: fragment.bands.map((band) => ({ ...band, elements: remove(band.elements) })),
    })),
  };
}

export function appendTemplateElement(
  template: DesignerTemplate,
  element: DesignerElement,
  selectedElementId?: string | null,
  selectedBandId?: string | null
): DesignerTemplate {
  element = migrateElementAliases(element);
  if (!template.bands?.length) {
    return { ...template, elements: [...template.elements, element] };
  }

  let targetBandId = selectedBandId ?? null;
  if (!targetBandId && selectedElementId) {
    targetBandId = findElementBandId(template, selectedElementId);
  }

  let added = false;
  const appendToBand = (elements: DesignerElement[]) => {
    if (added) return elements;
    if (selectedElementId && elements.some((item) => item.id === selectedElementId)) {
      added = true;
      return [...elements, element];
    }
    return elements;
  };
  const appendToSelectedBand = (band: DesignerBand) => {
    if (!added && targetBandId && band.id === targetBandId) {
      added = true;
      return { ...band, elements: [...band.elements, element] };
    }
    return { ...band, elements: appendToBand(band.elements) };
  };
  const bands = template.bands.map(appendToSelectedBand);
  const fragments = template.fragments?.map((fragment) => ({
    ...fragment,
    bands: fragment.bands.map(appendToSelectedBand),
  }));

  if (!added) {
    const targetIndex = bands.findIndex((band) => !['pageFooter', 'subreport'].includes(band.type));
    if (targetIndex >= 0) {
      bands[targetIndex] = {
        ...bands[targetIndex],
        elements: [...bands[targetIndex].elements, element],
      };
      added = true;
    }
  }

  return {
    ...template,
    bands,
    fragments,
    elements: added ? template.elements : [...template.elements, element],
  };
}

function migrateElementAliases(element: DesignerElement): DesignerElement {
  const width = element.width ?? element.w;
  const height = element.height ?? element.h;
  const binding = element.binding ?? element.path;
  return {
    ...element,
    w: width,
    h: height,
    width,
    height,
    path: binding,
    binding,
    children: element.children?.map(migrateElementAliases),
  };
}

export function findTemplateBand(
  template: DesignerTemplate,
  id: string | null
): DesignerBand | null {
  if (!id) return null;
  const rootBand = template.bands?.find((band) => band.id === id);
  if (rootBand) return rootBand;
  for (const fragment of template.fragments ?? []) {
    const band = fragment.bands.find((item) => item.id === id);
    if (band) return band;
  }
  return null;
}

export function findElementBandId(template: DesignerTemplate, elementId: string): string | null {
  for (const band of template.bands ?? []) {
    if (band.elements.some((element) => element.id === elementId)) return band.id;
  }
  for (const fragment of template.fragments ?? []) {
    for (const band of fragment.bands) {
      if (band.elements.some((element) => element.id === elementId)) return band.id;
    }
  }
  return null;
}

export function updateTemplateBand(
  template: DesignerTemplate,
  id: string,
  patch: Partial<DesignerBand>
): DesignerTemplate {
  const update = (bands: DesignerBand[]) =>
    bands.map((band) => (band.id === id ? { ...band, ...patch } : band));
  return {
    ...template,
    bands: template.bands ? update(template.bands) : template.bands,
    fragments: template.fragments?.map((fragment) => ({
      ...fragment,
      bands: update(fragment.bands),
    })),
  };
}

export function removeTemplateBand(template: DesignerTemplate, id: string): DesignerTemplate {
  const remove = (bands: DesignerBand[]) => bands.filter((band) => band.id !== id);
  return {
    ...template,
    bands: template.bands ? remove(template.bands) : template.bands,
    fragments: template.fragments?.map((fragment) => ({
      ...fragment,
      bands: remove(fragment.bands),
    })),
  };
}
