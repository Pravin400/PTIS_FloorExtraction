"use client";

import { useState, ChangeEvent } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  BulkTaxZoningRangeRow,
  CreateTaxZoningRangePayload,
  TaxZone,
  TaxZoningRange,
  Ward,
} from "@/types/taxZoningRange.types";

function comparePropertyNo(a: string, b: string): number {
  const re = /(\d+)|(\D+)/g;
  const aChunks = a.match(re) ?? [];
  const bChunks = b.match(re) ?? [];
  for (let i = 0; i < Math.max(aChunks.length, bChunks.length); i++) {
    const ac = aChunks[i] ?? "";
    const bc = bChunks[i] ?? "";
    const an = parseInt(ac, 10);
    const bn = parseInt(bc, 10);
    if (!isNaN(an) && !isNaN(bn)) {
      if (an !== bn) return an - bn;
    } else {
      const cmp = ac.localeCompare(bc);
      if (cmp !== 0) return cmp;
    }
  }
  return 0;
}

function rangesOverlap(aFrom: string, aTo: string, bFrom: string, bTo: string): boolean {
  return comparePropertyNo(aFrom, bTo) <= 0 && comparePropertyNo(bFrom, aTo) <= 0;
}

export function useTaxZoningRangeFile(
  t: (key: string, values?: Record<string, string | number>) => string,
  wards: Ward[],
  taxZones: TaxZone[],
  _existingRanges: TaxZoningRange[]
) {
  const [rows, setRows] = useState<BulkTaxZoningRangeRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [importing] = useState(false);

  const handleDownloadTemplate = () => {
    const a = document.createElement("a");
    a.href = "/api/tax-zoning-ranges/bulk-template";
    a.download = "Tax_Zoning_Bulk_Update_Template.xlsx";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleImportFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.toLowerCase().split(".").pop();
    if (!["csv", "xlsx", "xls"].includes(fileExt || "")) {
      toast.error(t("messages.invalidFileType"));
      e.target.value = "";
      return;
    }

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = ev.target?.result;
        const wb = XLSX.read(data, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rawRows: string[][] = XLSX.utils.sheet_to_json(ws, {
          header: 1,
          defval: "",
        });

        if (rawRows.length < 2) {
          toast.warning(t("messages.fileHasNoData"));
          setFileName(null);
          return;
        }

        const wardMap = Object.fromEntries(
          wards.map((w) => [w.wardNo?.trim().toLowerCase(), w])
        );
        const zoneMap = Object.fromEntries(
          taxZones.map((z) => [z.taxZoneNo?.trim().toLowerCase(), z])
        );

        const parsed: BulkTaxZoningRangeRow[] = rawRows
          .slice(1)
          .filter((row) => row.some((cell) => String(cell).trim()))
          .map((row) => {
            const [wardNoRaw, fromP, toP, taxZoneRaw, desc] = row.map((c) =>
              String(c).trim()
            );
            const errors: string[] = [];

            const ward = wardMap[wardNoRaw?.toLowerCase()];
            const taxZone = zoneMap[taxZoneRaw?.toLowerCase()];

            if (!wardNoRaw || !ward) errors.push(t("messages.wardNotFound"));
            if (!taxZoneRaw || !taxZone) errors.push(t("messages.taxZoneNotFound"));
            if (!fromP || !toP) errors.push(t("messages.propertyRequired"));
            else if (!/^\d+$/.test(fromP)) errors.push(t("messages.propertyFromMustBeNumber"));
            else if (!/^\d+$/.test(toP)) errors.push(t("messages.propertyToMustBeNumber"));
            else if (comparePropertyNo(fromP, toP) > 0) errors.push(t("messages.fromPropertyMustBeSmallerThanToProperty"));
            if (!desc || desc.length < 15)
              errors.push(t("messages.descriptionTooShort"));
            else if (desc.length > 200)
              errors.push(t("messages.descriptionTooLong"));

            return {
              wardNo: wardNoRaw,
              wardId: ward?.id,
              fromPropertyNo: fromP,
              toPropertyNo: toP,
              taxZoneNo: taxZoneRaw,
              taxZoneId: taxZone?.id,
              zoneDescription: desc,
              status: errors.length === 0 ? "New" : "Invalid",
              errors: errors.length > 0 ? errors : undefined,
            } satisfies BulkTaxZoningRangeRow;
          });

        // Cross-row overlap check within the same ward
        for (let i = 0; i < parsed.length; i++) {
          const a = parsed[i];
          if (!a.wardId || !a.fromPropertyNo || !a.toPropertyNo) continue;
          for (let j = i + 1; j < parsed.length; j++) {
            const b = parsed[j];
            if (!b.wardId || !b.fromPropertyNo || !b.toPropertyNo) continue;
            if (a.wardId !== b.wardId) continue;
            if (rangesOverlap(a.fromPropertyNo, a.toPropertyNo, b.fromPropertyNo, b.toPropertyNo)) {
              const msgA = t("messages.overlapsWithRow", { row: j + 2, from: b.fromPropertyNo, to: b.toPropertyNo });
              const msgB = t("messages.overlapsWithRow", { row: i + 2, from: a.fromPropertyNo, to: a.toPropertyNo });
              parsed[i] = { ...a, status: "Invalid", errors: [...(a.errors ?? []), msgA] };
              parsed[j] = { ...b, status: "Invalid", errors: [...(b.errors ?? []), msgB] };
            }
          }
        }

        setRows(parsed);

        const invalidCount = parsed.filter((r) => r.status === "Invalid").length;
        if (invalidCount > 0) {
          toast.warning(
            `${parsed.length - invalidCount} ${t("messages.rowsValid")}, ${invalidCount} ${t("messages.rowsInvalid")}`
          );
        } else {
          toast.success(`${parsed.length} ${t("messages.rowsReadyToImport")}`);
        }
      } catch {
        toast.error(t("messages.fileProcessingError"));
        setFileName(null);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const clearRows = () => {
    setRows([]);
    setFileName(null);
  };

  const toCreatePayloads = (): CreateTaxZoningRangePayload[] =>
    rows
      .filter((r) => r.status !== "Invalid" && r.wardId && r.taxZoneId)
      .map((r) => ({
        wardIds: [r.wardId!],
        taxZoneId: r.taxZoneId!,
        assignEntireWard: false,
        fromPropertyNo: r.fromPropertyNo,
        toPropertyNo: r.toPropertyNo,
        zoneDescription: r.zoneDescription,
      }));

  const hasValidRows = rows.some((r) => r.status !== "Invalid");
  const hasInvalidRows = rows.some((r) => r.status === "Invalid");

  return {
    rows,
    fileName,
    importing,
    hasValidRows,
    hasInvalidRows,
    handleDownloadTemplate,
    handleImportFile,
    clearRows,
    toCreatePayloads,
  };
}
