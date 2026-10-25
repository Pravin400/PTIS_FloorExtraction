import type { ClassicElement, ClassicReportDefinition } from './classic-adapter';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderElementHtml(element: ClassicElement): string {
  const styles = element.styles ?? {};
  const left = element.x;
  const top = element.y;
  const width = element.width;
  const height = element.height;
  const color = styles.color ? String(styles.color) : '#000000';
  const bg = styles.backgroundColor ?? styles.background ?? 'transparent';
  const fontSize = styles.fontSize ? String(styles.fontSize) : '12px';
  const fontWeight = styles.fontWeight ? String(styles.fontWeight) : 'normal';
  const textAlign = styles.textAlign ? String(styles.textAlign) : 'left';
  const border = styles.border ? String(styles.border) : 'none';
  const borderRadius = styles.borderRadius ? String(styles.borderRadius) : '0';

  if (element.designerType === 'table' || element.type === 'table') {
    const table = element.table;
    if (!table) return '';
    const colWidths = table.columnWidths ?? Array.from({ length: table.cols }, () => 80);
    const rowHeights = table.rowHeights ?? Array.from({ length: table.rows }, () => 28);
    let rowsHtml = '';
    for (let r = 0; r < table.rows; r += 1) {
      let cellsHtml = '';
      for (let c = 0; c < table.cols; c += 1) {
        const cell = table.cells[`${r}_${c}`] ?? { content: '' };
        const cellStyle = cell.style ?? {};
        const isHeader = r === 0;
        const cellAlign = cellStyle.textAlign ?? (isHeader ? 'center' : 'left');
        const cellWeight = cellStyle.fontWeight ?? (isHeader ? 'bold' : 'normal');
        const cellBg = cellStyle.backgroundColor ?? (isHeader ? '#f1f5f9' : '#ffffff');
        const cellBorder = `${cellStyle.borderWidth ?? 1}px solid ${cellStyle.borderColor ?? '#cbd5e1'}`;
        const cellColor = cellStyle.color ?? '#0f172a';
        cellsHtml += `<td style="border:${cellBorder}; background:${cellBg}; color:${cellColor}; font-weight:${cellWeight}; text-align:${cellAlign}; padding:4px 6px; font-size:11px; word-break:break-word;">${escapeHtml(cell.content)}</td>`;
      }
      rowsHtml += `<tr style="height:${rowHeights[r] ?? 28}px;">${cellsHtml}</tr>`;
    }

    const colGroup = colWidths.map((w) => `<col style="width:${w}px" />`).join('');
    return `<div style="position:absolute; left:${left}px; top:${top}px; width:${width}px; height:${height}px; overflow:hidden;">
      <table style="width:100%; border-collapse:collapse; table-layout:fixed; font-family:inherit;">
        <colgroup>${colGroup}</colgroup>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>`;
  }

  if (element.designerType === 'line' || element.type === 'line') {
    return `<div style="position:absolute; left:${left}px; top:${top}px; width:${width}px; height:${Math.max(1, height)}px; background:${color};"></div>`;
  }

  if (element.designerType === 'rectangle' || element.type === 'box') {
    return `<div style="position:absolute; left:${left}px; top:${top}px; width:${width}px; height:${height}px; border:${border === 'none' ? '1px solid #000' : border}; background:${bg}; border-radius:${borderRadius}; box-sizing:border-box;"></div>`;
  }

  if (element.designerType === 'image' || element.type === 'image') {
    const objectFit = (styles as Record<string, unknown>).objectFit ?? 'contain';
    const field = (element.fieldName || element.id || '').toLowerCase();
    let src = element.imageUrl || element.src;

    if (!src) {
      if (field.includes('councillogo') || field.includes('ulblogo') || field.includes('logo')) {
        src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='46' fill='%23f8fafc' stroke='%23cbd5e1' stroke-width='2'/%3E%3Ccircle cx='50' cy='50' r='38' fill='none' stroke='%2394a3b8' stroke-width='1.5' stroke-dasharray='3,3'/%3E%3Cpath d='M50 20 L68 44 L32 44 Z' fill='%232563eb'/%3E%3Crect x='42' y='44' width='16' height='22' fill='%231e40af'/%3E%3Ctext x='50' y='78' font-size='9' font-weight='bold' font-family='sans-serif' text-anchor='middle' fill='%23475569'%3ELOGO%3C/text%3E%3C/svg%3E`;
      } else if (field.includes('propertyphoto') || field.includes('photo')) {
        src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 100'%3E%3Crect width='120' height='100' fill='%23f1f5f9' stroke='%23cbd5e1'/%3E%3Cpath d='M40 32 L46 24 L74 24 L80 32 Z' fill='%2394a3b8'/%3E%3Crect x='25' y='32' width='70' height='46' rx='4' fill='%2394a3b8'/%3E%3Ccircle cx='60' cy='55' r='16' fill='%23f1f5f9'/%3E%3Ccircle cx='60' cy='55' r='11' fill='%2394a3b8'/%3E%3Ctext x='60' y='90' font-size='9' font-family='sans-serif' text-anchor='middle' fill='%2364748b'%3EPHOTO%3C/text%3E%3C/svg%3E`;
      } else if (field.includes('plan')) {
        src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 100'%3E%3Crect width='120' height='100' fill='%23eff6ff' stroke='%23bfdbfe'/%3E%3Cpath d='M20 20 H100 V80 H20 Z' fill='none' stroke='%233b82f6' stroke-width='2'/%3E%3Cline x1='20' y1='50' x2='100' y2='50' stroke='%2393c5fd'/%3Cline x1='60' y1='20' x2='60' y2='80' stroke='%2393c5fd'/%3E%3Ctext x='60' y='92' font-size='9' font-family='sans-serif' text-anchor='middle' fill='%231d4ed8'%3EPLAN%3C/text%3E%3C/svg%3E`;
      } else if (field.includes('picture3') || field.includes('picture4') || field.includes('sign')) {
        src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 40'%3E%3Cpath d='M10 28 Q 30 10, 50 25 T 90 18 T 110 22' fill='none' stroke='%23475569' stroke-width='2'/%3E%3Ctext x='60' y='36' font-size='8' font-family='sans-serif' text-anchor='middle' fill='%2394a3b8'%3ESIGNATURE%3C/text%3E%3C/svg%3E`;
      }
    }

    if (src) {
      return `<div style="position:absolute; left:${left}px; top:${top}px; width:${width}px; height:${height}px; box-sizing:border-box; overflow:hidden; display:flex; align-items:center; justify-content:center;">
        <img src="${escapeHtml(src)}" style="width:100%; height:100%; object-fit:${objectFit}; border:none; display:block;" alt="${escapeHtml(element.fieldName || 'Image')}" />
      </div>`;
    }

    return `<div style="position:absolute; left:${left}px; top:${top}px; width:${width}px; height:${height}px; border:1px dashed #94a3b8; background:#f8fafc; color:#64748b; font-size:10px; display:flex; align-items:center; justify-content:center; text-align:center; box-sizing:border-box; padding:2px;">
      <span>[${escapeHtml(element.fieldName || element.id || 'Image')}]</span>
    </div>`;
  }

  const text = element.text || (element.fieldName ? `{${element.fieldName}}` : '');
  return `<div style="position:absolute; left:${left}px; top:${top}px; width:${width}px; height:${height}px; color:${color}; background:${bg}; font-size:${fontSize}; font-weight:${fontWeight}; text-align:${textAlign}; border:${border}; border-radius:${borderRadius}; box-sizing:border-box; padding:2px 4px; overflow:hidden; display:flex; align-items:center;">
    <span style="width:100%;">${escapeHtml(text)}</span>
  </div>`;
}

export function openReportPreview(definition: ClassicReportDefinition): boolean {
  if (typeof window === 'undefined') return false;

  const previewWindow = window.open('about:blank', '_blank');
  if (!previewWindow) return false;

  const pageWidth = definition.pageWidth || 794;
  const pageHeight = definition.pageHeight || 1123;
  const pageBg = definition.pageColor || '#ffffff';
  const safeTitle = escapeHtml(definition.reportName || definition.reportCode || 'Report Preview');

  let sectionsHtml = '';
  for (const section of definition.sections.filter((s) => s.visible !== false)) {
    const elements = definition.elements.filter(
      (el) => el.sectionId === section.id && el.visible !== false
    );
    const elementsHtml = elements.map(renderElementHtml).join('\n');
    sectionsHtml += `<div class="report-section" style="position:relative; width:100%; height:${section.height}px;">
      ${elementsHtml}
    </div>`;
  }

  const html = `<!doctype html>
<html lang="mr">
<head>
  <meta charset="utf-8">
  <title>${safeTitle} - अहवाल पूर्वावलोकन</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Mukta:wght@400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 56px 20px 24px;
      background: #475569;
      font-family: 'Noto Sans Devanagari', 'Mukta', Arial, sans-serif;
    }
    .preview-header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 44px;
      background: #0f172a;
      color: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 20px;
      z-index: 9999;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    }
    .preview-title {
      font-size: 14px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .preview-actions {
      display: flex;
      gap: 10px;
    }
    .btn-print {
      background: #0f766e;
      color: #ffffff;
      border: 1px solid #14b8a6;
      border-radius: 6px;
      padding: 6px 14px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn-print:hover {
      background: #0d9488;
    }
    .page-container {
      width: ${pageWidth}px;
      min-height: ${pageHeight}px;
      background: ${pageBg};
      margin: 0 auto;
      box-shadow: 0 4px 20px rgba(0,0,0,0.35);
      position: relative;
      overflow: hidden;
    }
    @media print {
      body {
        margin: 0;
        padding: 0;
        background: transparent;
      }
      .preview-header {
        display: none !important;
      }
      .page-container {
        box-shadow: none;
        margin: 0;
        width: 100%;
        min-height: auto;
      }
    }
  </style>
</head>
<body>
  <header class="preview-header">
    <div class="preview-title">
      <span>📄 ${safeTitle}</span>
      <span style="font-size:11px; font-weight:400; color:#94a3b8;">(${definition.paperSize || 'A4'}, ${definition.orientation || 'portrait'})</span>
    </div>
    <div class="preview-actions">
      <button class="btn-print" onclick="window.print()">🖨️ मुद्रित करा / PDF जतन करा (Print)</button>
    </div>
  </header>
  <main class="page-container">
    ${sectionsHtml}
  </main>
</body>
</html>`;

  previewWindow.document.open();
  previewWindow.document.write(html);
  previewWindow.document.close();
  return true;
}
