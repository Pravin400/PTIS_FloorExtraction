import type { ReportElement } from './types';
import {
  escapeHtml,
  formatFieldValue,
  getValueByPath,
  toDevanagariDigits,
} from './formatting';

export interface InterpolationElement {
  id?: string;
  type?: string;
  text?: string;
  displayText?: string;
  fieldName?: string;
  binding?: string;
  format?: string;
  name?: string;
  [key: string]: unknown;
}

export function interpolateElementContent(
  elem: InterpolationElement | ReportElement,
  dataContext?: Record<string, unknown> | null,
  extraContext: Record<string, unknown> = {},
  escapeDynamicValues = false
): string {
  // Template markup and bound data have different trust levels.
  const formatValue = (value: unknown, format?: string): string => {
    const formatted = formatFieldValue(value, format);
    return escapeDynamicValues ? escapeHtml(formatted) : formatted;
  };
  const isDevanagari = (elem.format as string | undefined) === 'devanagari';
  let text =
    elem.text !== undefined && elem.text !== null
      ? elem.text
      : elem.displayText !== undefined && elem.displayText !== null
        ? elem.displayText
        : '';

  // Direct field binding
  if (elem.type === 'field' || elem.fieldName) {
    const fName = (elem.fieldName || '').replace(/^[@{}]/g, '');
    const pathValue = getValueByPath(dataContext, fName);
    if (pathValue !== undefined && pathValue !== null) {
      return formatValue(pathValue, isDevanagari ? 'devanagari' : '');
    }
    if (
      dataContext &&
      elem.fieldName &&
      dataContext[elem.fieldName] !== undefined &&
      dataContext[elem.fieldName] !== null
    ) {
      return formatValue(
        dataContext[elem.fieldName],
        isDevanagari ? 'devanagari' : ''
      );
    }
  }

  if (elem.type === 'formula') {
    const fName = (elem.fieldName || elem.name || '').replace(/^[@{}]/g, '');
    if (extraContext[fName] !== undefined && extraContext[fName] !== null) {
      return formatValue(
        extraContext[fName],
        isDevanagari ? 'devanagari' : ''
      );
    }
    if (
      dataContext &&
      dataContext[fName] !== undefined &&
      dataContext[fName] !== null
    ) {
      return formatValue(
        dataContext[fName],
        isDevanagari ? 'devanagari' : ''
      );
    }
  }

  if (text === undefined || text === null || text === '') {
    text = elem.fieldName ? `{${elem.fieldName}}` : '';
  }

  // Dynamic placeholders interpolation: {FieldName} and {@FormulaName}
  let rendered = String(text);
  if (rendered.includes('{')) {
    rendered = rendered.replace(
      /\{\{\s*([^{}]+?)\s*\}\}|\{\s*([^{}]+?)\s*\}/g,
      (_match, doubleName: string | undefined, singleName: string | undefined) => {
        const pName = String(doubleName || singleName || '').trim();

        // Special system variables
        if (pName === '#PageNumber' || pName === '@PageNum') {
          const pg = Number(extraContext.pageNum) || 1;
          const total = Number(extraContext.totalPages) || 1;
          const pgStr = `${pg} of ${total}`;
          return isDevanagari ? toDevanagariDigits(pgStr) : pgStr;
        }
        if (pName === '#TotalPages') {
          const tp = String(extraContext.totalPages || 1);
          return isDevanagari ? toDevanagariDigits(tp) : tp;
        }
        if (pName === '#PrintDate' || pName === '@PrintDate') {
          const now = new Date();
          const d = String(now.getDate()).padStart(2, '0');
          const m = String(now.getMonth() + 1).padStart(2, '0');
          const y = now.getFullYear();
          const dt = `${d}/${m}/${y}`;
          return isDevanagari ? toDevanagariDigits(dt) : dt;
        }

        const clean = pName.replace(/^[@]/, '');
        const nestedValue = getValueByPath(dataContext, clean);
        if (nestedValue !== undefined && nestedValue !== null) {
          return formatValue(nestedValue, isDevanagari ? 'devanagari' : '');
        }
        if (
          dataContext &&
          dataContext[pName] !== undefined &&
          dataContext[pName] !== null
        ) {
          return formatValue(
            dataContext[pName],
            isDevanagari ? 'devanagari' : ''
          );
        }
        if (
          dataContext &&
          dataContext[clean] !== undefined &&
          dataContext[clean] !== null
        ) {
          return formatValue(
            dataContext[clean],
            isDevanagari ? 'devanagari' : ''
          );
        }

        // Council / ULB Header helpers
        if (clean === 'CouncilHeader' || clean === 'CouncilNameWithDistrict') {
          const cName = String(
            dataContext?.CouncilHeader ||
              dataContext?.CouncilName ||
              dataContext?.ulbNameLocal ||
              dataContext?.ulbName ||
              ''
          );
          const cDist = String(
            dataContext?.CouncilDistrict || dataContext?.district || ''
          );
          if (cName) {
            const h =
              cDist && !cName.includes(cDist)
                ? cDist.startsWith('जि')
                  ? `${cName} ${cDist}`
                  : `${cName}, जि. ${cDist}`
                : cName;
            return formatValue(h, isDevanagari ? 'devanagari' : '');
          }
        }
        if (clean === 'CouncilName' || clean === 'AuthorityCouncil') {
          const cName = String(
            dataContext?.CouncilName ||
              dataContext?.ulbNameLocal ||
              dataContext?.ulbName ||
              ''
          );
          if (cName) {
            return formatValue(cName, isDevanagari ? 'devanagari' : '');
          }
        }

        if (
          extraContext &&
          extraContext[clean] !== undefined &&
          extraContext[clean] !== null
        ) {
          return formatValue(
            extraContext[clean],
            isDevanagari ? 'devanagari' : ''
          );
        }

        return '';
      }
    );
  }

  return rendered;
}
