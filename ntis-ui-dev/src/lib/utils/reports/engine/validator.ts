import type {
  ElementDiagnostic,
  PageGeometry,
  ReportDefinition,
  ReportElement,
  ReportSection,
  TableDiagnostic,
  ValidationIssue,
  ValidationResult,
} from './types';
import { pxToMm, resolvePageGeometry } from './geometry';

export const ReportLayoutValidator = {
  validatePage(reportDef: ReportDefinition | Partial<ReportDefinition>): {
    geom: PageGeometry;
    errors: string[];
    warnings: string[];
  } {
    const geom = resolvePageGeometry(reportDef || {});
    const errors: string[] = [];
    const warnings: string[] = [];

    if (
      !geom.widthMm ||
      geom.widthMm <= 0 ||
      !geom.heightMm ||
      geom.heightMm <= 0
    ) {
      errors.push(
        `Invalid page dimensions: ${geom.widthMm}mm x ${geom.heightMm}mm.`
      );
    }
    if (geom.printableWidthMm <= 0 || geom.printableHeightMm <= 0) {
      errors.push(
        `Margins exceed paper dimensions (Printable Area: ${geom.printableWidthMm.toFixed(1)}mm x ${geom.printableHeightMm.toFixed(1)}mm).`
      );
    }

    return { geom, errors, warnings };
  },

  validateSections(reportDef: ReportDefinition | Partial<ReportDefinition>): {
    sectionMap: Map<string, ReportSection>;
    errors: string[];
    warnings: string[];
  } {
    const sections = (reportDef && reportDef.sections) || [];
    const errors: string[] = [];
    const warnings: string[] = [];
    const sectionMap = new Map<string, ReportSection>();

    sections.forEach((sec, idx) => {
      if (!sec.id) {
        errors.push(`Section #${idx + 1} is missing a required unique ID.`);
      } else if (sectionMap.has(sec.id)) {
        errors.push(`Duplicate section ID detected: "${sec.id}".`);
      } else {
        sectionMap.set(sec.id, sec);
      }

      if (sec.height < 0) {
        errors.push(
          `Section "${sec.name || sec.id}" has negative height (${sec.height}px).`
        );
      }
    });

    return { sectionMap, errors, warnings };
  },

  validateElements(
    reportDef: ReportDefinition | Partial<ReportDefinition>,
    _options: Record<string, unknown> = {}
  ): {
    isValid: boolean;
    errors: string[];
    warnings: Array<{
      code: string;
      elements: string[];
      sectionId: string;
      message: string;
    }>;
    elementDiagnostics: Record<string, ElementDiagnostic>;
    tableDiagnostics: TableDiagnostic[];
    geometry: PageGeometry;
  } {
    const geom = resolvePageGeometry(reportDef || {});
    const sections = (reportDef && reportDef.sections) || [];
    const secMap = new Map(sections.map((s) => [s.id, s]));

    const elements: ReportElement[] = [
      ...((reportDef && reportDef.elements) || []),
    ];
    if (Array.isArray(sections)) {
      sections.forEach((sec) => {
        if (Array.isArray(sec.elements)) {
          sec.elements.forEach((el) => {
            if (!elements.some((e) => e.id === el.id)) {
              elements.push({ ...el, sectionId: el.sectionId || sec.id });
            }
          });
        }
      });
    }

    const errors: string[] = [];
    const warnings: Array<{
      code: string;
      elements: string[];
      sectionId: string;
      message: string;
    }> = [];
    const elementDiagnostics: Record<string, ElementDiagnostic> = {};

    elements.forEach((elem) => {
      const xPx = Number(elem.x) || 0;
      const yPx = Number(elem.y) || 0;
      const wPx = Number(elem.width) || 0;
      const hPx = Number(elem.height) || 0;

      const diag: ElementDiagnostic = {
        id: elem.id,
        name: elem.name || elem.id,
        sectionId: elem.sectionId,
        type: elem.type || 'text',
        x: xPx,
        y: yPx,
        width: wPx,
        height: hPx,
        xMm: elem.xMm !== undefined ? Number(elem.xMm) : pxToMm(xPx),
        yMm: elem.yMm !== undefined ? Number(elem.yMm) : pxToMm(yPx),
        widthMm: elem.widthMm !== undefined ? Number(elem.widthMm) : pxToMm(wPx),
        heightMm:
          elem.heightMm !== undefined ? Number(elem.heightMm) : pxToMm(hPx),
        rightMm: 0,
        bottomMm: 0,
        insidePage: true,
        insideSection: true,
        overflowRightMm: 0,
        overflowBottomMm: 0,
        isOverlapping: false,
        allowOverlap: elem.allowOverlap === true,
        overlappingWith: [],
        issueCodes: [],
        errors: [],
        warnings: [],
      };

      diag.rightMm = parseFloat((diag.xMm + diag.widthMm).toFixed(1));
      diag.bottomMm = parseFloat((diag.yMm + diag.heightMm).toFixed(1));

      if (elem.type === 'line') {
        if (wPx <= 0 && hPx <= 0) {
          diag.errors.push(
            `Line (${wPx}x${hPx}px) must have length greater than 0.`
          );
          diag.issueCodes.push('INVALID_DIMENSION');
          errors.push(`[${elem.id}] Line must have length greater than 0.`);
        }
      } else {
        if (wPx <= 0) {
          diag.errors.push(`Width (${wPx}px) must be greater than 0.`);
          diag.issueCodes.push('INVALID_DIMENSION');
          errors.push(`[${elem.id}] Width must be greater than 0.`);
        }
        if (hPx <= 0) {
          diag.errors.push(`Height (${hPx}px) must be greater than 0.`);
          diag.issueCodes.push('INVALID_DIMENSION');
          errors.push(`[${elem.id}] Height must be greater than 0.`);
        }
      }

      if (xPx < 0) {
        diag.errors.push(
          `Negative X coordinate (${xPx}px / ${diag.xMm}mm). Element outside left page boundary.`
        );
        diag.issueCodes.push('INVALID_COORDINATE');
        errors.push(`[${elem.id}] Negative X coordinate (${diag.xMm}mm).`);
        diag.insidePage = false;
      }
      if (yPx < 0) {
        diag.errors.push(
          `Negative Y coordinate (${yPx}px / ${diag.yMm}mm). Element outside section top boundary.`
        );
        diag.issueCodes.push('INVALID_COORDINATE');
        errors.push(`[${elem.id}] Negative Y coordinate (${diag.yMm}mm).`);
        diag.insideSection = false;
      }

      const sec = secMap.get(elem.sectionId);
      if (!sec) {
        diag.errors.push(`Invalid or missing section ID "${elem.sectionId}".`);
        diag.issueCodes.push('MISSING_SECTION');
        errors.push(`[${elem.id}] Missing valid section "${elem.sectionId}".`);
        diag.insideSection = false;
      } else {
        const secHeight = sec.height || 0;
        if (yPx + hPx > secHeight + 2) {
          const overflowPx = yPx + hPx - secHeight;
          const overflowMm = pxToMm(overflowPx);
          diag.insideSection = false;
          diag.overflowBottomMm = overflowMm;
          diag.issueCodes.push('SECTION_OVERFLOW_BOTTOM');
          diag.errors.push(
            `Exceeds section "${sec.name || sec.id}" bottom by ${overflowMm}mm (${overflowPx}px).`
          );
          errors.push(
            `[${elem.id}] Exceeds section "${sec.name || sec.id}" bottom by ${overflowMm}mm.`
          );
        }
      }

      const printableW = geom.designWidth;
      if (xPx + wPx > printableW + 4) {
        const overflowPx = xPx + wPx - printableW;
        const overflowMm = pxToMm(overflowPx);
        diag.insidePage = false;
        diag.overflowRightMm = overflowMm;
        diag.issueCodes.push('PAGE_OVERFLOW_RIGHT');
        diag.errors.push(
          `Exceeds printable page width by ${overflowMm}mm (${overflowPx}px).`
        );
        errors.push(
          `[${elem.id}] Exceeds printable width by ${overflowMm}mm.`
        );
      }

      elementDiagnostics[elem.id] = diag;
    });

    // Pairwise overlap detection per section
    const secElements = new Map<string, ReportElement[]>();
    elements.forEach((el) => {
      if (!secElements.has(el.sectionId)) secElements.set(el.sectionId, []);
      secElements.get(el.sectionId)!.push(el);
    });

    secElements.forEach((secEls, sId) => {
      for (let i = 0; i < secEls.length; i++) {
        const a = secEls[i];
        if (a.visible === false) continue;
        const diagA = elementDiagnostics[a.id];

        for (let j = i + 1; j < secEls.length; j++) {
          const b = secEls[j];
          if (b.visible === false) continue;
          const diagB = elementDiagnostics[b.id];

          const aX = Number(a.x) || 0;
          const aY = Number(a.y) || 0;
          const aW = Number(a.width) || 0;
          const aH = Number(a.height) || 0;

          const bX = Number(b.x) || 0;
          const bY = Number(b.y) || 0;
          const bW = Number(b.width) || 0;
          const bH = Number(b.height) || 0;

          const intersectX = aX < bX + bW && aX + aW > bX;
          const intersectY = aY < bY + bH && aY + aH > bY;

          if (intersectX && intersectY) {
            const aAllowed = a.allowOverlap === true;
            const bAllowed = b.allowOverlap === true;
            if (aAllowed || bAllowed) continue;

            const getBoxBg = (el: ReportElement) =>
              (el.styles as Record<string, unknown> | undefined)
                ?.backgroundColor || 'transparent';
            const aIsFramingBox =
              a.type === 'box' &&
              (!getBoxBg(a) ||
                getBoxBg(a) === 'transparent' ||
                getBoxBg(a) === 'rgba(0, 0, 0, 0)');
            const bIsFramingBox =
              b.type === 'box' &&
              (!getBoxBg(b) ||
                getBoxBg(b) === 'transparent' ||
                getBoxBg(b) === 'rgba(0, 0, 0, 0)');
            if (aIsFramingBox || bIsFramingBox) continue;

            if (a.type === 'line' || b.type === 'line') continue;

            const aContainsB =
              a.type === 'box' &&
              bX >= aX - 2 &&
              bY >= aY - 2 &&
              bX + bW <= aX + aW + 2 &&
              bY + bH <= aY + aH + 2;
            const bContainsA =
              b.type === 'box' &&
              aX >= bX - 2 &&
              aY >= bY - 2 &&
              aX + aW <= bX + bW + 2 &&
              aY + aH <= bY + bH + 2;
            if (aContainsB || bContainsA) continue;

            const overlapW = pxToMm(
              Math.min(aX + aW, bX + bW) - Math.max(aX, bX)
            );
            const overlapH = pxToMm(
              Math.min(aY + aH, bY + bH) - Math.max(aY, bY)
            );

            if (diagA) {
              diagA.isOverlapping = true;
              diagA.overlappingWith.push(b.id);
              diagA.issueCodes.push('ELEMENT_OVERLAP');
              diagA.warnings.push(
                `Overlaps with "${b.name || b.id}" (${overlapW}mm x ${overlapH}mm).`
              );
            }
            if (diagB) {
              diagB.isOverlapping = true;
              diagB.overlappingWith.push(a.id);
              diagB.issueCodes.push('ELEMENT_OVERLAP');
              diagB.warnings.push(
                `Overlaps with "${a.name || a.id}" (${overlapW}mm x ${overlapH}mm).`
              );
            }

            warnings.push({
              code: 'ELEMENT_OVERLAP',
              elements: [a.id, b.id],
              sectionId: sId,
              message: `[Section ${sId}] "${a.name || a.id}" overlaps with "${b.name || b.id}".`,
            });
          }
        }
      }
    });

    const tableDiagnostics: TableDiagnostic[] = [];
    const tables = elements.filter(
      (el) =>
        el.type === 'table' ||
        (Array.isArray((el as unknown as { columns?: unknown[] }).columns) &&
          (el as unknown as { columns: unknown[] }).columns.length > 0)
    );
    tables.forEach((tbl) => {
      const columns = (tbl as unknown as { columns?: { width?: number }[] })
        .columns;
      if (columns && columns.length > 0) {
        const totalColWidth = columns.reduce(
          (sum, c) => sum + (Number(c.width) || 0),
          0
        );
        const totalColWidthMm = pxToMm(totalColWidth);
        const availWidth = tbl.width || geom.designWidth;
        const availWidthMm = pxToMm(availWidth);
        if (totalColWidth > availWidth + 2) {
          const diffMm = (totalColWidthMm - availWidthMm).toFixed(1);
          const msg = `Table "${tbl.name || tbl.id}" columns exceed width by ${diffMm}mm (Total: ${totalColWidthMm}mm, Avail: ${availWidthMm}mm).`;
          errors.push(msg);
          tableDiagnostics.push({
            tableId: tbl.id,
            totalWidthMm: totalColWidthMm,
            availableWidthMm: availWidthMm,
            overflowMm: diffMm,
          });
          if (elementDiagnostics[tbl.id]) {
            elementDiagnostics[tbl.id].issueCodes.push('TABLE_COLUMNS_OVERFLOW');
            elementDiagnostics[tbl.id].errors.push(msg);
          }
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      elementDiagnostics,
      tableDiagnostics,
      geometry: geom,
    };
  },

  validateReport(
    reportDef: ReportDefinition | Partial<ReportDefinition>,
    options: Record<string, unknown> = {}
  ): ValidationResult {
    const pageRes = this.validatePage(reportDef);
    const secRes = this.validateSections(reportDef);
    const elemRes = this.validateElements(reportDef, options);

    const allErrors = [
      ...pageRes.errors,
      ...secRes.errors,
      ...elemRes.errors,
    ];
    const allWarnings = [
      ...pageRes.warnings,
      ...secRes.warnings,
      ...elemRes.warnings.map((w) => (typeof w === 'string' ? w : w.message)),
    ];

    const issues: ValidationIssue[] = [];
    Object.values(elemRes.elementDiagnostics).forEach((d) => {
      d.issueCodes.forEach((code) => {
        if (!issues.some((iss) => iss.code === code && iss.elementId === d.id)) {
          issues.push({
            code,
            elementId: d.id,
            sectionId: d.sectionId,
            severity: code === 'ELEMENT_OVERLAP' ? 'warning' : 'error',
          });
        }
      });
    });

    const overlaps = elemRes.warnings.filter(
      (w) => w && w.code === 'ELEMENT_OVERLAP'
    );

    return {
      isValid: allErrors.length === 0,
      valid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
      issues,
      overlaps,
      elementDiagnostics: elemRes.elementDiagnostics,
      tableDiagnostics: elemRes.tableDiagnostics,
      geometry: elemRes.geometry || pageRes.geom,
    };
  },

  autoResolveCollisions(
    reportDef: ReportDefinition,
    options: { inPlace?: boolean } = {}
  ): ReportDefinition {
    return autoResolveCollisions(reportDef, options);
  },
};

export function autoResolveCollisions(
  reportDef: ReportDefinition,
  options: { inPlace?: boolean } = {}
): ReportDefinition {
  if (!reportDef) return reportDef;
  const def: ReportDefinition = options.inPlace
    ? reportDef
    : JSON.parse(JSON.stringify(reportDef));
  const geom = resolvePageGeometry(def);
  const printableW = geom.designWidth;

  const sections = def.sections || [];
  const elements = def.elements ? [...def.elements] : [];
  sections.forEach((sec) => {
    if (Array.isArray(sec.elements)) {
      sec.elements.forEach((el) => {
        if (!el.sectionId) el.sectionId = sec.id;
        const existing = elements.find((e) => e.id === el.id);
        if (!existing) {
          elements.push(el);
        }
      });
    }
  });

  const secElements = new Map<string, ReportElement[]>();
  sections.forEach((s) => secElements.set(s.id, []));
  elements.forEach((el) => {
    const arr = secElements.get(el.sectionId);
    if (arr) arr.push(el);
  });

  sections.forEach((sec) => {
    const els = secElements.get(sec.id) || [];
    if (els.length === 0) return;

    // Framing boxes
    els
      .filter(
        (e) =>
          e.type === 'box' || e.type === 'box_rounded' || e.type === 'circle'
      )
      .forEach((box) => {
        const bg =
          (box.styles as Record<string, unknown> | undefined)?.backgroundColor ||
          'transparent';
        if (!bg || bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)') {
          box.allowOverlap = true;
        }
      });

    // Line dividers
    els
      .filter((e) => e.type === 'line')
      .forEach((l) => {
        l.allowOverlap = true;
      });

    // Content elements
    const contentEls = els.filter((e) => !e.allowOverlap && e.type !== 'line');
    contentEls.forEach((el) => {
      if (el.x + el.width > printableW) {
        if (el.width <= printableW) {
          el.x = Math.max(0, printableW - el.width);
        } else {
          el.x = 0;
          el.width = printableW;
        }
      }
    });

    // Vertical stack clearance
    const sortedByY = [...contentEls].sort((a, b) => a.y - b.y);
    for (let i = 0; i < sortedByY.length; i++) {
      const a = sortedByY[i];
      for (let j = i + 1; j < sortedByY.length; j++) {
        const b = sortedByY[j];
        const hOverlap = a.x < b.x + b.width && a.x + a.width > b.x;
        if (
          hOverlap &&
          b.y < a.y + a.height &&
          a.allowOverlap !== true &&
          b.allowOverlap !== true
        ) {
          if (a.height > 32 && (a.text || '').length < 120) {
            a.height = 32;
          }
          if (b.y < a.y + a.height) {
            b.y = a.y + a.height + 4;
          }
          if (b.y + b.height > sec.height) {
            sec.height = b.y + b.height + 20;
          }
        }
      }
    }

    // Small boxed values
    const smallBoxes = els.filter(
      (e) => e.type === 'box' && e.width <= 120 && e.height <= 40
    );
    smallBoxes.forEach((box) => {
      box.allowOverlap = true;
      const nested = contentEls.find(
        (c) =>
          c.x >= box.x - 6 &&
          c.x + c.width <= box.x + box.width + 12 &&
          Math.abs(c.y - box.y) <= 8
      );
      if (nested) {
        nested.allowOverlap = true;
        if (!nested.styles) nested.styles = {};
        (nested.styles as Record<string, unknown>).textAlign = 'center';
      }
      const labelAbove = contentEls.find(
        (c) =>
          c.type === 'text' &&
          c.y < box.y &&
          box.y - (c.y + c.height) <= 20 &&
          c.x < box.x + box.width &&
          c.x + c.width > box.x
      );
      if (labelAbove) {
        if (!labelAbove.styles) labelAbove.styles = {};
        (labelAbove.styles as Record<string, unknown>).textAlign = 'center';
      }
    });

    const maxBottom = Math.max(
      0,
      ...els.map((e) => (Number(e.y) || 0) + (Number(e.height) || 0))
    );
    if (maxBottom > (sec.height || 0)) {
      sec.height = maxBottom + 4;
    }
  });

  return def;
}
