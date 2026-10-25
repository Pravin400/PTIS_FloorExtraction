import DOMPurify from 'isomorphic-dompurify';
import type {
  PageBorderConfig,
  RenderedReport,
  ReportDefinition,
  ReportElement,
  ReportSection,
  WatermarkConfig,
} from './types';
import { PX_PER_MM, PAPER_SIZES, mmToPx, pxToMm, resolvePageGeometry } from './geometry';
import {
  escapeHtml,
  getValueByPath,
  resolveDataCollection,
  toDevanagariDigits,
  formatFieldValue,
  decodeHtmlEntities,
} from './formatting';
import { interpolateElementContent } from './interpolation';
import { ReportLayoutValidator, autoResolveCollisions } from './validator';

function renderTextContent(
  elem: ReportElement,
  dataContext?: Record<string, unknown> | null,
  extraContext: Record<string, unknown> = {}
): string {
  // Only the template can opt into rich text; database values cannot enable HTML.
  const templateText = String(elem.text ?? elem.displayText ?? '');
  const isHtml = Boolean(
    elem.isHtml ||
    elem.renderMode === 'html' ||
    /<span\b|<b\b|<strong\b|<font\b/i.test(templateText)
  );
  const content = interpolateElementContent(elem, dataContext, extraContext, isHtml);
  return isHtml
    ? DOMPurify.sanitize(content, { USE_PROFILES: { html: true } })
    : escapeHtml(content);
}

function isLegacyDesignerChrome(
  elem: ReportElement,
  styles: Record<string, unknown>
): boolean {
  const border = String(styles.border || '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  const background = String(styles.backgroundColor || '')
    .trim()
    .toLowerCase();
  const padding = Number.parseFloat(String(styles.padding || '0')) || 0;
  const whiteBackground =
    background === '#fff' || background === '#ffffff' || background === 'white';
  const type = elem.type || 'text';

  if (
    (type === 'field' || type === 'formula') &&
    ['1px solid #000', '1px solid #000000', '1px solid black'].includes(border)
  ) {
    return whiteBackground && padding >= 1.9 && padding <= 2.1;
  }
  return (
    (type === 'text' || type === 'text_box') &&
    border === '1px solid #1e293b' &&
    whiteBackground &&
    padding >= 3.9 &&
    padding <= 4.1
  );
}

export function serializeElementStyles(elem: ReportElement): string {
  const s = (elem.styles || {}) as Record<string, unknown>;
  const styles: string[] = [];

  styles.push(`position: absolute;`);
  styles.push(`left: ${elem.x}px;`);
  styles.push(`top: ${elem.y}px;`);
  styles.push(`width: ${elem.width}px;`);
  styles.push(`height: ${elem.height}px;`);
  styles.push(`box-sizing: border-box;`);
  styles.push(`line-height: 1.25;`);

  // Typography
  const fontFamily =
    (s.fontFamily as string) || "'Noto Sans Devanagari', Arial, sans-serif";
  styles.push(`font-family: ${fontFamily};`);
  styles.push(`font-size: ${(s.fontSize as string) || '9.5pt'};`);
  styles.push(`font-weight: ${(s.fontWeight as string) || '400'};`);
  if (s.fontStyle) styles.push(`font-style: ${s.fontStyle};`);
  if (s.textDecoration) styles.push(`text-decoration: ${s.textDecoration};`);
  styles.push(`color: ${(s.color as string) || '#000000'};`);
  styles.push(`text-align: ${(s.textAlign as string) || 'left'};`);

  // Word wrapping & bounds containment
  styles.push(`overflow-wrap: break-word;`);
  styles.push(`word-break: break-word;`);

  // Z-Index
  const zIndex =
    elem.zIndex !== undefined
      ? elem.zIndex
      : s.zIndex !== undefined
        ? s.zIndex
        : elem.type === 'box'
          ? 1
          : elem.type === 'line'
            ? 2
            : 3;
  styles.push(`z-index: ${zIndex};`);

  // Borders & Background
  if (elem.type === 'box') {
    styles.push(`border: ${(s.border as string) || '1.5px solid #000000'};`);
    styles.push(
      `background-color: ${(s.backgroundColor as string) || 'transparent'};`
    );
  } else if (elem.type === 'line') {
    const isVertical =
      elem.height > elem.width || (elem.width <= 2 && elem.height > 2);
    const color =
      (s.backgroundColor as string) || (s.color as string) || '#000000';
    if (isVertical) {
      const bLeft =
        s.borderLeft ||
        (s.border && s.border !== 'none'
          ? s.border
          : `${elem.width || 1}px solid ${color}`);
      styles.push(`border-left: ${bLeft};`);
      styles.push(`background-color: transparent;`);
    } else {
      const bTop =
        s.borderTop ||
        (s.border && s.border !== 'none'
          ? s.border
          : `${elem.height || 1}px solid ${color}`);
      styles.push(`border-top: ${bTop};`);
      styles.push(`background-color: transparent;`);
    }
  } else {
    if (s.border && s.border !== 'none' && !isLegacyDesignerChrome(elem, s)) {
      styles.push(`border: ${s.border};`);
    }
    if (s.backgroundColor && s.backgroundColor !== 'transparent') {
      styles.push(`background-color: ${s.backgroundColor};`);
    }
  }

  if (s.padding) styles.push(`padding: ${s.padding};`);

  return styles.join(' ');
}

export function renderElementHtml(
  elem: ReportElement,
  dataContext?: Record<string, unknown> | null,
  extraContext: Record<string, unknown> = {}
): string {
  if (elem.visible === false) return '';

  const styleStr = serializeElementStyles(elem);
  const styles = (elem.styles || {}) as Record<string, unknown>;
  const verticalAlign = styles.verticalAlign;
  const textVerticalStyle = `display:flex; align-items:${verticalAlign === 'top' ? 'flex-start' : verticalAlign === 'bottom' ? 'flex-end' : 'center'};`;
  const wrap =
    elem.height >= 24 || elem.textWrapping !== false
      ? 'white-space: pre-wrap; overflow-wrap: anywhere; word-break: break-word;'
      : 'white-space: pre; overflow: hidden; text-overflow: clip;';

  if (elem.type === 'box') {
    return `<div id="el_${elem.id}" class="report-element report-box" style="${styleStr}"></div>`;
  }

  if (elem.type === 'box_rounded') {
    const radius = (styles.borderRadius as string) || '10px';
    return `<div id="el_${elem.id}" class="report-element report-box-rounded" style="${styleStr} border-radius:${radius};"></div>`;
  }

  if (elem.type === 'circle') {
    return `<div id="el_${elem.id}" class="report-element report-circle" style="${styleStr} border-radius:50%;"></div>`;
  }

  if (elem.type === 'arrow_right') {
    const fill =
      styles.backgroundColor && styles.backgroundColor !== '#dbeafe'
        ? (styles.backgroundColor as string)
        : 'transparent';
    const stroke =
      (styles.borderColor as string) || (styles.color as string) || '#000000';
    const strokeWidth = (styles.borderWidth as number) || 1.5;
    return `<div id="el_${elem.id}" class="report-element report-arrow-right" style="${styleStr} border:none; background:transparent;"><svg viewBox="0 0 100 60" preserveAspectRatio="none" style="width:100%; height:100%; display:block;"><polygon points="0,20 60,20 60,0 100,30 60,60 60,40 0,40" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round"/></svg></div>`;
  }

  if (elem.type === 'arrow_down') {
    const fill =
      styles.backgroundColor && styles.backgroundColor !== '#dbeafe'
        ? (styles.backgroundColor as string)
        : 'transparent';
    const stroke =
      (styles.borderColor as string) || (styles.color as string) || '#000000';
    const strokeWidth = (styles.borderWidth as number) || 1.5;
    return `<div id="el_${elem.id}" class="report-element report-arrow-down" style="${styleStr} border:none; background:transparent;"><svg viewBox="0 0 60 100" preserveAspectRatio="none" style="width:100%; height:100%; display:block;"><polygon points="20,0 40,0 40,60 60,60 30,100 0,60 20,60" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round"/></svg></div>`;
  }

  if (elem.type === 'arrow_line') {
    const stroke =
      (styles.backgroundColor as string) ||
      (styles.color as string) ||
      '#000000';
    const w = elem.width || 100;
    const h = elem.height || 40;
    const angle = Math.atan2(h - 4, w - 10) * (180 / Math.PI);
    return `<div id="el_${elem.id}" class="report-element report-arrow-line" style="${styleStr}">
      <svg viewBox="0 0 ${w} ${h}" style="width:100%; height:100%; overflow:visible;">
        <polygon points="0,0 12,6 0,12" fill="${stroke}"
                 transform="translate(${w - 2},${h - 2}) rotate(${angle}) translate(-12,-6)" />
      </svg>
    </div>`;
  }

  if (elem.type === 'text_box') {
    const txt = renderTextContent(elem, dataContext, extraContext);
    const lineHeight = (styles.lineHeight as string) || '1.6';
    const tbWrap = `white-space: pre-wrap; overflow-wrap: break-word; word-break: normal; line-height: ${lineHeight};`;
    return `<div id="el_${elem.id}" class="report-element report-textbox" style="${styleStr} ${textVerticalStyle}"><span style="${tbWrap} width:100%; display:block;">${txt}</span></div>`;
  }

  if (elem.type === 'line') {
    return `<div id="el_${elem.id}" class="report-element report-line" style="${styleStr}"></div>`;
  }

  if (elem.type === 'image') {
    const imageFieldName =
      elem.fieldName ||
      elem.binding ||
      elem.path ||
      (elem.id === 'picture10'
        ? 'propertyPhoto'
        : elem.id === 'picture9'
          ? 'buildingPlanPhoto'
          : '');
    let fieldVal =
      imageFieldName && dataContext
        ? getValueByPath(dataContext, imageFieldName) ||
          dataContext[imageFieldName]
        : '';
    if (
      !fieldVal &&
      (elem.id === 'picture10' || imageFieldName === 'propertyPhoto')
    ) {
      fieldVal =
        dataContext?.propertyPhoto ||
        dataContext?.photo ||
        dataContext?.PropertyPhoto ||
        '';
    }
    if (
      !fieldVal &&
      (elem.id === 'picture9' || imageFieldName === 'buildingPlanPhoto')
    ) {
      fieldVal =
        dataContext?.buildingPlanPhoto ||
        dataContext?.planPhoto ||
        dataContext?.BuildingPlanPhoto ||
        '';
    }

    const normalizedImageField = String(imageFieldName || '').toLowerCase();
    const isLogoField =
      ['councillogo', 'ulblogo', 'logourl', 'logo'].includes(
        normalizedImageField
      ) ||
      (!imageFieldName &&
        (elem.id?.toLowerCase().includes('logo') ||
          elem.name?.toLowerCase().includes('logo') ||
          elem.id === 'picture1' ||
          elem.id === 'picture2'));
    const isPhotoField =
      normalizedImageField.includes('photo') ||
      normalizedImageField.includes('plan') ||
      (elem.id && elem.id.toLowerCase().includes('photo')) ||
      (elem.name && elem.name.toLowerCase().includes('photo')) ||
      elem.id === 'picture9' ||
      elem.id === 'picture10';
    const isSignField =
      elem.id?.toLowerCase().includes('sign') ||
      elem.name?.toLowerCase().includes('sign') ||
      elem.id === 'picture3' ||
      elem.id === 'picture4';

    const src =
      String(fieldVal || '') ||
      (isLogoField && dataContext
        ? String(
            getValueByPath(dataContext, 'CouncilLogo') ||
              getValueByPath(dataContext, 'ulbLogo') ||
              getValueByPath(dataContext, 'LogoUrl') ||
              ''
          )
        : '') ||
      elem.imageUrl ||
      elem.src ||
      '';

    if (src) {
      const objectFit = ['contain', 'cover', 'fill'].includes(
        styles.objectFit as string
      )
        ? (styles.objectFit as string)
        : 'contain';
      return `<div id="el_${elem.id}" class="report-element report-image" style="${styleStr}"><img src="${escapeHtml(src)}" style="width:100%; height:100%; object-fit:${objectFit}; display:block;" alt="${escapeHtml(elem.name || (isPhotoField ? 'Property Photo' : 'Logo'))}"></div>`;
    }
    if (isPhotoField) {
      return `<div id="el_${elem.id}" class="report-element report-image" style="${styleStr} border:1px solid #94a3b8; background:#ffffff; display:flex; flex-direction:row; align-items:center; justify-content:center; gap:6px; color:#475569; font-size:11px; padding:4px; box-sizing:border-box;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg><span style="font-size:11px; font-weight:500;">${escapeHtml(elem.name || 'Property Photo')}</span></div>`;
    }
    if (isSignField) {
      return `<div id="el_${elem.id}" class="report-element report-image report-signature" style="${styleStr} background:transparent;"></div>`;
    }
    return `<div id="el_${elem.id}" class="report-element report-image" style="${styleStr} border:1px solid #cbd5e1; background:#ffffff; display:flex; align-items:center; justify-content:center; gap:4px; color:#0284c7; font-size:10px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg><span>Logo</span></div>`;
  }

  if (elem.type === 'subreport') {
    return `<div id="el_${elem.id}" class="report-element report-subreport" style="${styleStr} background: repeating-linear-gradient(45deg, #f8fafc, #f8fafc 10px, #f1f5f9 10px, #f1f5f9 20px); border: 1px solid #94a3b8; display:flex; align-items:center; justify-content:center; font-weight:700; color:#475569; font-size:11px;">[Subreport: ${escapeHtml(elem.name || elem.text || 'Details')}]</div>`;
  }

  if (elem.type === 'table') {
    const table = elem.table || null;
    const cols = table?.cols || elem.cols || 4;
    const rows = table?.rows || elem.rows || 3;
    const cellData = (elem.cellData || {}) as Record<string, unknown>;
    const cells =
      table?.cells || (elem.tableCells as Record<string, unknown>) || {};
    const columnWidths =
      table?.columnWidths ||
      elem.columnWidths ||
      Array.from({ length: cols }, () => 1);
    const rowHeights = table?.rowHeights || elem.rowHeights || [];
    const bColor =
      elem.borderColor || (styles.borderColor as string) || '#000000';
    const bWidth = elem.borderWidth !== undefined ? elem.borderWidth : 1;
    const headerBg = elem.headerBg || '#f1f5f9';
    const totalWidth = columnWidths.reduce(
      (sum, width) => sum + Math.max(1, Number(width) || 1),
      0
    );
    const colGroup = Array.from({ length: cols }, (_, c) => {
      const width = Math.max(1, Number(columnWidths[c]) || 1);
      return `<col style="width:${(width / totalWidth) * 100}%">`;
    }).join('');

    let tableRowsHtml = '';
    for (let r = 0; r < rows; r++) {
      let trHtml = '';
      for (let c = 0; c < cols; c++) {
        const cellKey = `${r}_${c}`;
        const cell = (cells[cellKey] || {}) as {
          hidden?: boolean;
          content?: string;
          style?: Record<string, unknown>;
          rowSpan?: number;
          colSpan?: number;
        };
        if (cell.hidden) continue;
        let val =
          cell.content !== undefined
            ? cell.content
            : cellData[cellKey] !== undefined
              ? cellData[cellKey]
              : '';
        val = interpolateElementContent(
          { text: String(val || ''), format: elem.format },
          dataContext,
          extraContext
        );
        const isHeader = r === 0;
        const cellStyle = cell.style || {};
        const rowSpan = Math.max(1, Number(cell.rowSpan) || 1);
        const colSpan = Math.max(1, Number(cell.colSpan) || 1);
        const background =
          (cellStyle.backgroundColor as string) ||
          (isHeader ? headerBg : '#ffffff');
        const fontWeight =
          (cellStyle.fontWeight as string | number) ||
          (isHeader ? 700 : (styles.fontWeight as string | number) || 400);
        const cellWrap =
          cellStyle.wrap === false
            ? 'white-space:nowrap;overflow:hidden;text-overflow:clip;'
            : 'white-space:pre-wrap;overflow-wrap:anywhere;word-break:normal;';
        trHtml += `<td${rowSpan > 1 ? ` rowspan="${rowSpan}"` : ''}${colSpan > 1 ? ` colspan="${colSpan}"` : ''} style="border:${cellStyle.borderWidth ?? bWidth}px solid ${(cellStyle.borderColor as string) || bColor}; padding:${cellStyle.padding ?? 4}px; background:${background}; color:${(cellStyle.color as string) || (styles.color as string) || '#000000'}; font-size:${cellStyle.fontSize || 9}pt; font-weight:${fontWeight}; line-height:1.15; ${cellWrap} vertical-align:${(cellStyle.verticalAlign as string) || 'middle'}; text-align:${(cellStyle.textAlign as string) || (styles.textAlign as string) || 'left'};">${escapeHtml(String(val || ''))}</td>`;
      }
      tableRowsHtml += `<tr${rowHeights[r] ? ` style="height:${Number(rowHeights[r]) || 24}px"` : ''}>${trHtml}</tr>`;
    }
    return `<div id="el_${elem.id}" class="report-element report-table" style="${styleStr}"><table style="width:100%; height:100%; border-collapse:collapse; table-layout:fixed; font-size:inherit; font-family:inherit; color:inherit;"><colgroup>${colGroup}</colgroup><tbody>${tableRowsHtml}</tbody></table></div>`;
  }

  const formattedContent = renderTextContent(elem, dataContext, extraContext);

  return `<div id="el_${elem.id}" class="report-element report-${elem.type || 'text'}" style="${styleStr} ${textVerticalStyle}"><span style="${wrap} width:100%; display:block;">${formattedContent}</span></div>`;
}

export function renderSectionHtml(
  section: ReportSection,
  elements: ReportElement[],
  dataContext?: Record<string, unknown> | null,
  extraContext: Record<string, unknown> = {}
): string {
  if (section.visible === false) return '';
  const secElements = (elements || []).filter(
    (e) => e.sectionId === section.id && e.visible !== false
  );
  let secHeight = section.height || 0;
  if (secHeight <= 0 && secElements.length > 0) {
    secHeight = Math.max(...secElements.map((e) => (e.y || 0) + (e.height || 0)), 30);
  }

  let html = `<div id="sec_${section.id}" class="report-section" data-section-type="${section.type || ''}" style="position: relative; width: 100%; height: ${secHeight}px; min-height: ${secHeight}px; box-sizing: border-box; overflow: visible;">\n`;
  secElements.forEach((elem) => {
    html += '  ' + renderElementHtml(elem, dataContext, extraContext) + '\n';
  });
  html += `</div>\n`;
  return html;
}

export function renderReport(
  reportDef: ReportDefinition,
  dataRows: Record<string, unknown>[] = [],
  parameters: Record<string, unknown> = {},
  _options: { inPlace?: boolean } = {}
): RenderedReport {
  if (!reportDef) {
    return {
      pagesHtml:
        '<div class="report-error">No report definition provided.</div>',
      totalPages: 0,
      stylesHtml: '',
      geometry: resolvePageGeometry({}),
    };
  }

  const geom = resolvePageGeometry(reportDef);
  const rows = Array.isArray(dataRows)
    ? dataRows
    : dataRows
      ? [dataRows]
      : [];
  const firstRow = rows.length > 0 ? rows[0] : {};
  const elements = reportDef.elements || [];
  const sections = reportDef.sections || [];

  const dataContext: Record<string, unknown> = { ...parameters, ...firstRow };
  const extraContext: Record<string, unknown> = { ...parameters };

  const sectionInstances = sections.flatMap((section) => {
    if (section.bandType !== 'subreport') {
      return [{ ...section, __dataContext: dataContext, __instanceIndex: 0 }];
    }
    const subreportRows = section.dataPath
      ? resolveDataCollection(dataContext, section.dataPath)
      : [dataContext];
    return subreportRows.map((row, index) => ({
      ...section,
      __dataContext: { ...dataContext, ...row },
      __instanceIndex: index,
    }));
  });

  const isTabular =
    reportDef.reportType === 'tabular' ||
    reportDef.hasTable === true ||
    elements.some((e) => e.type === 'table');

  const pages: (typeof sectionInstances)[] = [];

  if (!isTabular || rows.length <= 1) {
    let currentPageSections: typeof sectionInstances = [];
    let currentAccumHeight = 0;
    const maxPageContentHeight = geom.designHeight;

    sectionInstances.forEach((sec) => {
      if (sec.visible === false) return;
      const secElements = (elements || []).filter(
        (e) => e.sectionId === sec.id && e.visible !== false
      );
      let secHeight = sec.height || 0;
      if (secHeight <= 0 && secElements.length > 0) {
        secHeight = Math.max(...secElements.map((e) => (e.y || 0) + (e.height || 0)), 30);
      }
      if (secHeight <= 0) return;
      if (secElements.length === 0 && secHeight > 20) return;

      const shouldBreak =
        sec.pageBreakBefore === true ||
        (!geom.usesPageCoordinates &&
          reportDef.recordsPerPage !== 1 &&
          currentAccumHeight + secHeight > maxPageContentHeight + 40 &&
          currentPageSections.length > 0);

      if (shouldBreak) {
        pages.push(currentPageSections);
        currentPageSections = [sec];
        currentAccumHeight = secHeight;
      } else {
        currentPageSections.push(sec);
        currentAccumHeight += secHeight;
      }

      if (sec.pageBreakAfter === true && currentPageSections.length > 0) {
        pages.push(currentPageSections);
        currentPageSections = [];
        currentAccumHeight = 0;
      }
    });

    if (currentPageSections.length > 0) {
      pages.push(currentPageSections);
    }
  } else {
    pages.push(sectionInstances);
  }

  if (pages.length === 0) pages.push([]);
  const totalPages = Math.max(1, pages.length);

  let pagesHtml = '';
  pages.forEach((pageSecs, pIdx) => {
    const pageNum = pIdx + 1;
    const pageContext = { ...extraContext, pageNum, totalPages };

    const topPx = geom.usesPageCoordinates ? 0 : mmToPx(geom.margins.top);
    const rightPx = geom.usesPageCoordinates ? 0 : mmToPx(geom.margins.right);
    const bottomPx = geom.usesPageCoordinates
      ? 0
      : mmToPx(geom.margins.bottom);
    const leftPx = geom.usesPageCoordinates ? 0 : mmToPx(geom.margins.left);

    const pageBg = reportDef.pageColor || '#ffffff';
    let pageBorderStyles = '';
    let pageBorderHtml = '';

    const pageBorder = reportDef.pageBorder as PageBorderConfig | undefined;
    if (pageBorder) {
      const inset = pageBorder.inset || {};
      const borderInset = {
        top: Math.max(0, Number(inset.top) || 0),
        right: Math.max(0, Number(inset.right) || 0),
        bottom: Math.max(0, Number(inset.bottom) || 0),
        left: Math.max(0, Number(inset.left) || 0),
      };
      const borderCss = [
        pageBorder.top && pageBorder.top !== 'none'
          ? `border-top: ${pageBorder.top};`
          : '',
        pageBorder.bottom && pageBorder.bottom !== 'none'
          ? `border-bottom: ${pageBorder.bottom};`
          : '',
        pageBorder.left && pageBorder.left !== 'none'
          ? `border-left: ${pageBorder.left};`
          : '',
        pageBorder.right && pageBorder.right !== 'none'
          ? `border-right: ${pageBorder.right};`
          : '',
      ].join(' ');

      if (Object.values(borderInset).some((value) => value > 0)) {
        pageBorderHtml = `<div class="report-page-border" style="position:absolute; pointer-events:none; box-sizing:border-box; z-index:1000; top:${mmToPx(borderInset.top)}px; right:${mmToPx(borderInset.right)}px; bottom:${mmToPx(borderInset.bottom)}px; left:${mmToPx(borderInset.left)}px; ${borderCss}"></div>`;
      } else {
        pageBorderStyles = borderCss;
      }
    }

    let watermarkHtml = '';
    const watermark = reportDef.watermark as WatermarkConfig | undefined;
    if (watermark) {
      if (watermark.type === 'image' || watermark.imageUrl) {
        const scale = watermark.scale || 'auto';
        const opacity =
          watermark.opacity !== undefined
            ? watermark.opacity
            : watermark.washout !== false
              ? 0.18
              : 0.85;
        const imgStyle =
          scale === 'auto'
            ? 'max-width: 75%; max-height: 75%; object-fit: contain;'
            : `width: ${scale}; max-width: 95%; height: auto;`;
        watermarkHtml = `
          <div class="report-watermark" style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; z-index: 0; overflow: hidden;">
            <img src="${escapeHtml(watermark.imageUrl || '')}" style="${imgStyle} opacity: ${opacity}; user-select: none; display: block;" alt="Watermark">
          </div>
        `;
      } else if (watermark.text) {
        const rot =
          watermark.rotation !== undefined ? watermark.rotation : -45;
        const color = watermark.color || 'rgba(148, 163, 184, 0.35)';
        const size = watermark.fontSize || 64;
        const fontFamily =
          watermark.fontFamily ||
          "'Noto Sans Devanagari', 'Segoe UI', Arial, sans-serif";
        watermarkHtml = `
          <div class="report-watermark" style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; z-index: 0; overflow: hidden;">
            <div style="font-family: ${fontFamily}; font-size: ${size}px; font-weight: 900; color: ${color}; letter-spacing: 6px; transform: rotate(${rot}deg); user-select: none; white-space: nowrap;">
              ${escapeHtml(watermark.text)}
            </div>
          </div>
        `;
      }
    }

    pagesHtml += `
      <div class="report-page" data-page="${pageNum}" style="
        position: relative;
        width: ${geom.pageWidth}px;
        min-height: ${geom.pageHeight}px;
        box-sizing: border-box;
        background: ${pageBg};
        ${pageBorderStyles}
        padding: ${topPx}px ${rightPx}px ${bottomPx}px ${leftPx}px;
        margin: 0 auto 20px auto;
        box-shadow: 0 4px 16px rgba(0,0,0,0.35);
        overflow: visible;
      ">
        ${watermarkHtml}
        ${pageBorderHtml}
    `;

    pageSecs.forEach((sec) => {
      pagesHtml += renderSectionHtml(
        sec,
        elements,
        sec.__dataContext || dataContext,
        {
          ...pageContext,
          subreportRow: (sec.__instanceIndex || 0) + 1,
        }
      );
    });

    pagesHtml += `</div>\n`;
  });

  const stylesHtml = `
    <style id="reportPrintStyles">
      @page {
        size: ${geom.widthMm}mm ${geom.heightMm}mm;
        margin: ${geom.usesPageCoordinates ? '0' : `${geom.margins.top}mm ${geom.margins.right}mm ${geom.margins.bottom}mm ${geom.margins.left}mm`};
      }
      @media print {
        body {
          background: #ffffff !important;
          padding: 0 !important;
          margin: 0 !important;
        }
        .screen-toolbar, .cr-menubar, .cr-toolbars, .cr-sidebar-left, .cr-sidebar-right, .cr-statusbar {
          display: none !important;
        }
        .report-page {
          box-shadow: none !important;
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          min-height: auto !important;
          page-break-after: always;
          break-after: page;
        }
        .report-page:last-child {
          page-break-after: avoid;
          break-after: avoid;
        }
      }
    </style>
  `;

  return {
    // Sanitize the final document before preview, printing, or HTML download.
    pagesHtml: DOMPurify.sanitize(pagesHtml, {
      USE_PROFILES: { html: true, svg: true },
      FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed', 'form'],
    }),
    totalPages,
    stylesHtml,
    geometry: geom,
  };
}

// Keep the original renderer API available alongside the named TypeScript exports.
export const Validator = ReportLayoutValidator;
export const decollideReport = autoResolveCollisions;
export function validateReport(
  reportDef: ReportDefinition | Partial<ReportDefinition>,
  options: Record<string, unknown> = {},
) {
  return ReportLayoutValidator.validateReport(reportDef, options);
}

export const ReportRenderer = {
  PX_PER_MM,
  PAPER_SIZES,
  mmToPx,
  pxToMm,
  toDevanagariDigits,
  formatFieldValue,
  decodeHtmlEntities,
  resolvePageGeometry,
  interpolateElementContent,
  serializeElementStyles,
  renderElementHtml,
  renderSectionHtml,
  renderReport,
  Validator,
  validateReport,
  autoResolveCollisions,
  decollideReport,
};

export default ReportRenderer;
