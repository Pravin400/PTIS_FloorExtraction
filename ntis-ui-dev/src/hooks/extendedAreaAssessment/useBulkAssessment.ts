"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  BULK_TEMPLATE_HEADERS,
  calcBulkPropertyCurrent,
  downloadCsv,
  parseBulkCsv,
  toCsv,
  yn,
} from "@/lib/utils/section129a";
import type { BulkApplyField, BulkPropertyRow } from "@/types/extended-area-assessment.types";

let nextId = 1;

function sampleRows(): BulkPropertyRow[] {
  nextId = 3;
  return [
    {
      id: 1,
      upic: "TMC-EXT-000124",
      oldGpNo: "GP-33/A/3",
      owner: "Conditional Sample",
      inclusionDate: "2024-04-01",
      assessmentDate: "2026-04-01",
      oldTax: 349,
      fullTax: 1402.34,
      policyMode: "conditional",
      oldArea: 500,
      newArea: 1100,
      areaThreshold: 200,
      areaRuleEnabled: "yes",
      useChanged: "no",
      otherChanged: "no",
      useDisqualify: "yes",
      otherDisqualify: "yes",
      changeDate: "2025-08-01",
      selected: false,
    },
    {
      id: 2,
      upic: "TMC-EXT-000125",
      oldGpNo: "GP-33/A/4",
      owner: "Unconditional Sample",
      inclusionDate: "2022-04-01",
      assessmentDate: "2026-04-01",
      oldTax: 900,
      fullTax: 1600,
      policyMode: "unconditional",
      oldArea: 600,
      newArea: 1400,
      areaThreshold: 200,
      areaRuleEnabled: "yes",
      useChanged: "yes",
      otherChanged: "no",
      useDisqualify: "yes",
      otherDisqualify: "yes",
      changeDate: "",
      selected: false,
    },
  ];
}

const YES_NO_FIELDS = new Set<BulkApplyField>([
  "areaRuleEnabled",
  "useChanged",
  "otherChanged",
  "useDisqualify",
  "otherDisqualify",
]);

const DATE_FIELDS = new Set<BulkApplyField>(["assessmentDate", "inclusionDate", "changeDate"]);
const NUMBER_FIELDS = new Set<BulkApplyField>(["oldArea", "newArea", "areaThreshold"]);
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Owns the Section 129A bulk-update table — every row is edited/added
 *  directly in the grid (no backend list), with CSV import/export and a
 *  "bulk apply a field to every selected row" toolbar, matching the
 *  reference bulk calculator. */
export function useBulkAssessment() {
  const t = useTranslations("extendedAreaAssessment.bulk");
  const [rows, setRows] = useState<BulkPropertyRow[]>(sampleRows);
  const [bulkField, setBulkField] = useState<BulkApplyField>("assessmentDate");
  const [bulkValue, setBulkValue] = useState("");

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: nextId++,
        upic: "",
        oldGpNo: "",
        owner: "",
        inclusionDate: "",
        assessmentDate: "",
        oldTax: 0,
        fullTax: 0,
        policyMode: "conditional",
        oldArea: 0,
        newArea: 0,
        areaThreshold: 200,
        areaRuleEnabled: "yes",
        useChanged: "no",
        otherChanged: "no",
        useDisqualify: "yes",
        otherDisqualify: "yes",
        changeDate: "",
        selected: false,
      },
    ]);
  };

  const removeRow = (id: number) => setRows((prev) => prev.filter((r) => r.id !== id));

  const updateRow = <K extends keyof BulkPropertyRow>(id: number, key: K, value: BulkPropertyRow[K]) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
  };

  const toggleSelected = (id: number) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r)));
  };

  const toggleAll = (selected: boolean) => setRows((prev) => prev.map((r) => ({ ...r, selected })));

  const applyBulkUpdate = () => {
    if (!bulkValue.trim()) {
      toast.error(t("messages.enterBulkValue"));
      return;
    }
    const selectedCount = rows.filter((r) => r.selected).length;
    if (selectedCount === 0) {
      toast.error(t("messages.noRowsSelected"));
      return;
    }
    if (DATE_FIELDS.has(bulkField) && !DATE_PATTERN.test(bulkValue.trim())) {
      toast.error(t("messages.invalidDate"));
      return;
    }

    const value: BulkPropertyRow[keyof BulkPropertyRow] = YES_NO_FIELDS.has(bulkField)
      ? yn(bulkValue)
      : NUMBER_FIELDS.has(bulkField)
        ? Number(bulkValue) || 0
        : bulkValue.trim();
    setRows((prev) => prev.map((r) => (r.selected ? { ...r, [bulkField]: value } : r)));
  };

  const calculateAll = () => {
    toast.success(t("messages.calculated", { count: rows.length }));
  };

  const clearAll = () => {
    if (typeof window !== "undefined" && !window.confirm(t("messages.clearConfirmDescription"))) return;
    setRows([]);
    toast.success(t("messages.cleared"));
  };

  const importCsv = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseBulkCsv(String(reader.result ?? ""));
      if (parsed.length === 0) {
        toast.error(t("messages.noDataInCsv"));
        return;
      }
      setRows(parsed.map((r) => ({ ...r, id: nextId++, selected: false })));
      toast.success(t("messages.imported", { count: parsed.length }));
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    downloadCsv(
      "Section_129A_Bulk_Template.csv",
      `${BULK_TEMPLATE_HEADERS.join(",")}\nTMC-001,GP-001,Sample Owner,2024-04-01,2026-04-01,500,2500,Conditional,500,900,200,Yes,No,No,Yes,Yes,`
    );
  };

  const exportResults = () => {
    const header = [...BULK_TEMPLATE_HEADERS, "Current FY", "Stage", "Applicable Tax"];
    const body = rows.map((r) => {
      const c = calcBulkPropertyCurrent(r);
      return [
        r.upic,
        r.oldGpNo,
        r.owner,
        r.inclusionDate,
        r.assessmentDate,
        r.oldTax,
        r.fullTax,
        r.policyMode,
        r.oldArea,
        r.newArea,
        r.areaThreshold,
        r.areaRuleEnabled,
        r.useChanged,
        r.otherChanged,
        r.useDisqualify,
        r.otherDisqualify,
        r.changeDate,
        c.fy,
        c.stage,
        c.tax,
      ];
    });
    downloadCsv("Section_129A_Bulk_Assessment_Results.csv", toCsv([header, ...body]));
  };

  return {
    rows,
    bulkField,
    setBulkField,
    bulkValue,
    setBulkValue,
    addRow,
    removeRow,
    updateRow,
    toggleSelected,
    toggleAll,
    applyBulkUpdate,
    calculateAll,
    clearAll,
    importCsv,
    downloadTemplate,
    exportResults,
  };
}

export type UseBulkAssessment = ReturnType<typeof useBulkAssessment>;
