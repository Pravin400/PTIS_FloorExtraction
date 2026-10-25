export interface ReportFieldCategory {
  id: string;
  name: string;
  icon: string;
  fields: ReportFieldItem[];
}

export interface ReportFieldItem {
  id: string;
  name: string;
  displayName: string;
  dataType?: string;
  category: 'database' | 'formula' | 'summary' | 'parameter' | 'static';
  expression?: string;
}

export function normalizeReportTextEntities(text: string): string {
  if (!text) return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

export function categorizeReportFields(
  rawFields: Array<{ name: string; type?: string; displayName?: string }>
): ReportFieldCategory[] {
  const dbFields: ReportFieldItem[] = [];
  const formulaFields: ReportFieldItem[] = [];
  const summaryFields: ReportFieldItem[] = [];
  const paramFields: ReportFieldItem[] = [];

  rawFields.forEach(f => {
    const rawName = f.name || '';
    if (rawName.startsWith('@')) {
      formulaFields.push({
        id: rawName,
        name: rawName,
        displayName: f.displayName || rawName,
        dataType: f.type || 'string',
        category: 'formula',
        expression: `{@${rawName.replace(/^@/, '')}}`,
      });
    } else if (rawName.startsWith('?') || rawName.toLowerCase().startsWith('param')) {
      paramFields.push({
        id: rawName,
        name: rawName,
        displayName: f.displayName || rawName,
        dataType: f.type || 'string',
        category: 'parameter',
        expression: `{?${rawName.replace(/^\?/, '')}}`,
      });
    } else if (rawName.startsWith('sum_') || rawName.startsWith('total_') || rawName.toLowerCase().includes('total')) {
      summaryFields.push({
        id: rawName,
        name: rawName,
        displayName: f.displayName || rawName,
        dataType: f.type || 'number',
        category: 'summary',
        expression: `{#${rawName}}`,
      });
    } else {
      dbFields.push({
        id: rawName,
        name: rawName,
        displayName: f.displayName || rawName,
        dataType: f.type || 'string',
        category: 'database',
        expression: `{${rawName}}`,
      });
    }
  });

  return [
    {
      id: 'database',
      name: 'DATA FIELDS (Database)',
      icon: '📁',
      fields: dbFields,
    },
    {
      id: 'formula',
      name: 'FORMULA FIELDS ({@})',
      icon: '📁',
      fields: formulaFields,
    },
    {
      id: 'summary',
      name: 'SUMMARY FIELDS (∑)',
      icon: '📁',
      fields: summaryFields,
    },
    {
      id: 'parameter',
      name: 'REPORT PARAMETERS ({?})',
      icon: '📁',
      fields: paramFields,
    },
  ];
}

export function formatFieldValue(value: unknown, format?: string): string {
  if (value === null || value === undefined) return '';

  if (typeof value === 'number') {
    if (format === 'currency') {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2,
      }).format(value);
    }
    if (format === 'integer') {
      return Math.round(value).toString();
    }
    return value.toLocaleString('en-IN');
  }

  return String(value);
}

export function toDevanagariDigits(numStr: string | number): string {
  const devanagariDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  return String(numStr).replace(/[0-9]/g, d => devanagariDigits[Number(d)]);
}
