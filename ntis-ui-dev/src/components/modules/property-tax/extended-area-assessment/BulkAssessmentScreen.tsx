"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import {
  Input,
  Select,
  MasterTable,
  AddButton,
  ApplyButton,
  ExportButton,
  CancelButton,
} from "@/components/common";
import { useBulkAssessment } from "@/hooks/extendedAreaAssessment/useBulkAssessment";
import { getBulkAssessmentColumns, type BulkTableRow } from "./bulkAssessmentColumns";
import type { BulkApplyField } from "@/types/extended-area-assessment.types";

const DATE_APPLY_FIELDS = new Set<BulkApplyField>(["assessmentDate", "inclusionDate", "changeDate"]);

const BULK_FIELD_OPTIONS: BulkApplyField[] = [
  "assessmentDate",
  "inclusionDate",
  "useChanged",
  "otherChanged",
  "policyMode",
  "oldArea",
  "newArea",
  "areaThreshold",
  "areaRuleEnabled",
  "useDisqualify",
  "otherDisqualify",
  "changeDate",
];

export function BulkAssessmentScreen() {
  const t = useTranslations("extendedAreaAssessment.bulk");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
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
  } = useBulkAssessment();

  const columns = getBulkAssessmentColumns({ t, onToggle: toggleSelected, onUpdate: updateRow, onRemove: removeRow });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <AddButton label={t("toolbar.addProperty")} size="sm" onClick={addRow} />
          <ApplyButton label={t("toolbar.importCsv")} size="sm" onClick={() => fileInputRef.current?.click()} />
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) importCsv(file);
              e.target.value = "";
            }}
          />
          <ApplyButton label={t("toolbar.downloadTemplate")} size="sm" onClick={downloadTemplate} />
          <ApplyButton label={t("toolbar.calculateAll")} size="sm" onClick={calculateAll} />
          <ExportButton label={t("toolbar.exportResults")} size="sm" onClick={exportResults} />
          <CancelButton label={t("toolbar.clear")} size="sm" onClick={clearAll} />
        </div>

        <div className="flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="w-56 shrink-0">
            <Select
              label={t("applyBar.bulkUpdateField")}
              options={BULK_FIELD_OPTIONS.map((f) => ({ label: t(`applyBar.fields.${f}`), value: f }))}
              value={bulkField}
              onChange={(_e, v) => {
                setBulkField(v as BulkApplyField);
                setBulkValue("");
              }}
            />
          </div>
          <Input
            type={DATE_APPLY_FIELDS.has(bulkField) ? "date" : "text"}
            label={t("applyBar.value")}
            placeholder={DATE_APPLY_FIELDS.has(bulkField) ? undefined : t("applyBar.valuePlaceholder")}
            className="w-56"
            value={bulkValue}
            onChange={(e) => setBulkValue(e.target.value)}
          />
          <ApplyButton label={t("applyBar.applyToSelected")} size="sm" onClick={applyBulkUpdate} />
          <CancelButton label={t("applyBar.selectAll")} size="sm" onClick={() => toggleAll(true)} />
          <CancelButton label={t("applyBar.unselectAll")} size="sm" onClick={() => toggleAll(false)} />
        </div>

        <p className="text-xs text-slate-500">{t("help")}</p>

        <div className="overflow-x-auto">
          <MasterTable<BulkTableRow>
            columns={columns}
            data={rows as BulkTableRow[]}
            getRowKey={(row) => row.id}
            emptyText={t("messages.noRows")}
            tableClassName="text-xs"
            theadClassName="text-[10px] font-extrabold uppercase tracking-widest"
            rowClassName={(row) => (row.selected ? "bg-blue-50/60" : "")}
          />
        </div>
      </div>
    </div>
  );
}
