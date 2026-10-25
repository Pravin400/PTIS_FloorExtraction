"use client";

import { useState, ChangeEvent } from "react";
import { toast } from "sonner";
import * as XLSX from 'xlsx';
import { ZoningRecord, TaxZone, Ward } from "@/types/taxzoning.types";
import { PagedResponse } from "@/types/common.types";
import { getTaxZoningPagedAction } from "@/app/[locale]/property-tax/taxzone-master/taxzoning/actions";

export const useTaxZoningFile = (
  t: (key: string, values?: Record<string, string | number>) => string,
  REQUIRED_HEADERS: string[],
  _records: ZoningRecord[],
  wardsData: PagedResponse<Ward>,
  taxZones: PagedResponse<TaxZone>,
  wardLabel?: string,
  taxZoneLabel?: string
) => {
  const [importedChanges, setImportedChanges] = useState<ZoningRecord[]>([]);
  const [hasImportedData, setHasImportedData] = useState(false);

  const handleExportCSV = (tableRecords: ZoningRecord[]) => {
    if (!tableRecords.length) {
      toast.error(t('messages.noRecordsToExport'));
      return;
    }

    const headers = [t('columns.wardNo', { ward: wardLabel ?? '' }), t('columns.fromProperty'), t('columns.toProperty'), t('columns.taxZoneNo', { taxZone: taxZoneLabel ?? '' })];
    const rows = tableRecords.map(r => [r.wardNo, r.fromProperty, r.toProperty, r.taxZoneNo]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    try {
      link.href = url;
      link.download = "tax-zoning-records.csv";
      link.click();
      toast.success(t('messages.csvExportSuccess'));
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  const handleImportFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.toLowerCase().split('.').pop();
    if (!['csv', 'xlsx', 'xls'].includes(fileExt || '')) {
      toast.error(t('messages.invalidFileType'));
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        let data: (string | number | boolean | null | undefined)[][] = [];
        if (fileExt === 'csv') {
          const text = String(reader.result || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
          data = text.split("\n").filter(Boolean).map(line => line.split(",").map(cell => cell.trim()));
        } else {
          const workbook = XLSX.read(reader.result, { type: 'array' });
          data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
        }

        if (data.length < 2) {
          toast.error(t('messages.fileHasNoData'));
          return;
        }

        const headers = data[0].map((h: unknown) => (h?.toString() ?? "").trim().toLowerCase());
        const STABLE_HEADERS = ['wardno', 'fromproperty', 'toproperty', 'taxzoneno'];
        const isValidHeader = headers.length === STABLE_HEADERS.length &&
          headers.every((h: string | undefined, i: number) => h === STABLE_HEADERS[i] || h === REQUIRED_HEADERS[i]);

        if (!isValidHeader) {
          toast.error(t('messages.invalidFileFormat', { ward: wardLabel ?? '', taxZone: taxZoneLabel ?? '' }));
          return;
        }

        // Fetch ALL existing records from server (grouped by ward) for accurate comparison
        const allRecordsResult = await getTaxZoningPagedAction(1, 10000, undefined, undefined, "ward");
        const allServerRecords: { wardId: number; taxZoneId: number; fromProperty: string; toProperty: string }[] = [];
        if (allRecordsResult.success && allRecordsResult.data?.items) {
          allRecordsResult.data.items.forEach(item => {
            allServerRecords.push({
              wardId: Number(item.wardId),
              taxZoneId: Number(item.taxZoneId),
              fromProperty: item.fromProperty || "",
              toProperty: item.toProperty || "",
            });
          });
        }

        const newChanges: ZoningRecord[] = [];
        const updatedRecords: ZoningRecord[] = [];
        const seenKeys = new Set<string>();

        data.slice(1).forEach((row) => {
          if (row.length < 4) return;
          const [wardNoStr, fromP, toP, taxZoneNoStr] = row.map((cell) => cell?.toString().trim() || '');
          if (!wardNoStr || !fromP || !toP || !taxZoneNoStr) return;

          const wardData = wardsData.items.find((w: Ward) => w.wardNo === wardNoStr);
          const taxZoneData = taxZones.items.find((z: TaxZone) => z.taxZoneNo === taxZoneNoStr);
          if (!wardData || !taxZoneData) return;

          // Use raw values from CSV - NO padding
          const fromProperty = fromP;
          const toProperty = toP;
          if (Number(fromProperty) > Number(toProperty)) return;

          const key = `${wardData.id}_${fromProperty}_${toProperty}`;
          if (seenKeys.has(key)) return;
          seenKeys.add(key);

          // Compare against ALL server records, not just current page
          const existing = allServerRecords.find(r =>
            r.wardId === wardData.id &&
            r.fromProperty === fromProperty &&
            r.toProperty === toProperty
          );

          if (existing && existing.taxZoneId !== taxZoneData.id) {
            // TaxZone changed → mark for update
            updatedRecords.push({ taxZoneId: taxZoneData.id, taxZoneNo: taxZoneNoStr, wardId: wardData.id, wardNo: wardNoStr, fromProperty, toProperty, status: "Updated" });
          } else if (!existing) {
            // New record
            newChanges.push({ taxZoneId: taxZoneData.id, taxZoneNo: taxZoneNoStr, wardId: wardData.id, wardNo: wardNoStr, fromProperty, toProperty, status: "New" });
          }
          // else: no change, skip
        });

        const allChanges = [...updatedRecords, ...newChanges];
        if (!allChanges.length) {
          toast.warning(t('messages.noNewOrChangedRecords'));
          return;
        }

        setImportedChanges(allChanges);
        setHasImportedData(true);

        const parts: string[] = [];
        if (updatedRecords.length > 0) parts.push(`${updatedRecords.length} ${t('messages.updatesReadyToImport')}`);
        if (newChanges.length > 0) parts.push(`${newChanges.length} ${t('messages.newRecordsReadyToImport')}`);
        toast.success(parts.join(', '));
      } catch (_err) {
        toast.error(t('messages.fileProcessingError'));
      }
    };
    reader.onerror = () => toast.error(t('messages.fileReadError'));
    if (fileExt === 'csv') reader.readAsText(file); else reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const handleClearImported = () => {
    setImportedChanges([]);
    setHasImportedData(false);
    toast.info(t('messages.importedDataCleared'));
  };

  return { importedChanges, hasImportedData, handleExportCSV, handleImportFile, handleClearImported, setImportedChanges, setHasImportedData };
};
