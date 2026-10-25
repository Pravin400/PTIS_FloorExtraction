import type { BulkComputedResult, BulkPropertyRow } from "@/types/extended-area-assessment.types";

/**
 * Section 129A transition-tax calculations, ported from the reference
 * single-assessment and bulk-update calculators. The rule: a newly-included
 * property keeps its Old Gram Panchayat tax for its first two financial
 * years, then steps up through 20/40/60/80% of the full Municipal General
 * Tax before reaching 100% from the sixth year — unless the property itself
 * changed (area/use/other), in which case the full 100% tax applies from the
 * change's effective year.
 */

/** Financial year runs April–March; `fyStart` returns the starting calendar year. */
export function fyStart(dateStr: string): number {
  const d = new Date(dateStr);
  return d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
}

export function fyLabel(year: number): string {
  return `${year}-${String((year + 1) % 100).padStart(2, "0")}`;
}

/** Index 0-1 (first two years): Old GP tax protected. Then 20/40/60/80/100%. */
export function pctForIndex(i: number): number {
  if (i <= 1) return 0;
  if (i === 2) return 20;
  if (i === 3) return 40;
  if (i === 4) return 60;
  if (i === 5) return 80;
  return 100;
}

/** Bulk-update variant — each property carries its own policy (conditional
 *  vs. unconditional) and disqualification switches (area growth ratio,
 *  use change, other change) instead of the single form's shared toggles. */
export function calcBulkPropertyCurrent(row: BulkPropertyRow): BulkComputedResult {
  if (!row.inclusionDate || !row.assessmentDate) {
    return { fy: "—", stage: "Missing Date", tax: 0 };
  }

  const start = fyStart(row.inclusionDate);
  const current = fyStart(row.assessmentDate);
  const i = current - start;
  const old = row.oldTax || 0;
  const full = row.fullTax || 0;
  const pct = pctForIndex(i);

  const unconditional = row.policyMode === "unconditional";
  const oldA = row.oldArea || 0;
  const newA = row.newArea || 0;
  const ratio = oldA > 0 ? (newA / oldA) * 100 : 0;
  const threshold = row.areaThreshold || 200;

  const areaFail = !unconditional && row.areaRuleEnabled === "yes" && ratio >= threshold;
  const useFail = !unconditional && row.useDisqualify === "yes" && row.useChanged === "yes";
  const otherFail = !unconditional && row.otherDisqualify === "yes" && row.otherChanged === "yes";
  const disqualified = areaFail || useFail || otherFail;

  const changeFY = row.changeDate ? fyStart(row.changeDate) : start + 2;
  const effectiveChangeFY = Math.max(changeFY, start + 2);

  if (i <= 1) {
    return { fy: fyLabel(current), stage: "Old GP Protected", tax: old };
  }
  if (disqualified && current >= effectiveChangeFY) {
    return { fy: fyLabel(current), stage: "100% Full Tax", tax: full };
  }
  const stageTax = (full * pct) / 100;
  return { fy: fyLabel(current), stage: `${pct}% Transition`, tax: Math.max(old, stageTax) };
}

export const BULK_TEMPLATE_HEADERS = [
  "UPIC",
  "Old GP No",
  "Owner",
  "Inclusion Date",
  "Assessment Date",
  "Old GP Tax",
  "Municipal Tax 100%",
  "Policy Method",
  "Old Area",
  "New Area",
  "Area Threshold %",
  "Area Rule Enabled",
  "Use Changed",
  "Other Change",
  "Use Disqualify",
  "Other Disqualify",
  "Change Date",
] as const;

export function yn(value: string | undefined): "yes" | "no" {
  return String(value ?? "").trim().toLowerCase().startsWith("y") ? "yes" : "no";
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let quoted = false;
  let cur = "";
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (ch === "," && !quoted) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

/** Parses the bulk-update CSV template (header row + one row per property)
 *  into rows ready to append to the bulk table, ids assigned by the caller. */
export function parseBulkCsv(text: string): Array<Omit<BulkPropertyRow, "id" | "selected">> {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const header = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const col = (...names: string[]) => names.map((n) => header.indexOf(n)).find((idx) => idx >= 0);

  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const at = (idx: number | undefined) => (idx !== undefined ? cells[idx] ?? "" : "");
    return {
      upic: at(col("upic")),
      oldGpNo: at(col("old gp no")),
      owner: at(col("owner")),
      inclusionDate: at(col("inclusion date")),
      assessmentDate: at(col("assessment date")),
      oldTax: Number(at(col("old gp tax")) || 0),
      fullTax: Number(at(col("municipal tax 100%")) || 0),
      policyMode: (at(col("policy method")).toLowerCase() || "conditional") as BulkPropertyRow["policyMode"],
      oldArea: Number(at(col("old area")) || 0),
      newArea: Number(at(col("new area")) || 0),
      areaThreshold: Number(at(col("area threshold %")) || 200),
      areaRuleEnabled: yn(at(col("area rule enabled")) || "yes"),
      useChanged: yn(at(col("use changed"))),
      otherChanged: yn(at(col("other change"))),
      useDisqualify: yn(at(col("use disqualify")) || "yes"),
      otherDisqualify: yn(at(col("other disqualify")) || "yes"),
      changeDate: at(col("change date")),
    };
  });
}

export function toCsv(rows: (string | number)[][]): string {
  return rows
    .map((row) => row.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
