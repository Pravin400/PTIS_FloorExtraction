"use client";

import { useRef, useMemo, useEffect } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/common/Card";
import { Input } from "@/components/common/Input";
import { DownloadButton, ImportButton, ApplyButton, CancelButton, IconOnlyActionButton } from "@/components/common/ActionButtons";
import { MasterTable, Column } from "@/components/common/MasterTable";
import { BulkTaxZoningRangeRow } from "@/types/taxZoningRange.types";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

type BulkRow = BulkTaxZoningRangeRow & Record<string, unknown>;

interface BulkUpdateDrawerProps {
  onClose: () => void;
  onDownloadTemplate: () => void;
  onImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileName: string | null;
  rows: BulkTaxZoningRangeRow[];
  hasValidRows: boolean;
  hasInvalidRows: boolean;
  importing: boolean;
  saving: boolean;
  onApply: () => void;
}

export default function BulkUpdateDrawer({
  onClose,
  onDownloadTemplate,
  onImportFile,
  fileName,
  rows,
  hasValidRows,
  hasInvalidRows,
  importing,
  saving,
  onApply,
}: BulkUpdateDrawerProps) {
  const tUi = useTranslations("taxZoningRange.ui.bulk");
  const tRoot = useTranslations("taxZoningRange");
  const wardLabel = useAliasLabel("Ward", tRoot("aliasFallback.ward"));
  const taxZoneLabel = useAliasLabel("Tax Zone", tRoot("aliasFallback.taxZone"));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollBodyRef = useRef<HTMLDivElement>(null);
  const step3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (rows.length > 0 && scrollBodyRef.current && step3Ref.current) {
      const container = scrollBodyRef.current;
      const target = step3Ref.current;
      const containerRect = container.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const scrollOffset = targetRect.top - containerRect.top + container.scrollTop - 16;
      container.scrollTo({ top: scrollOffset, behavior: "smooth" });
    }
  }, [rows.length]);

  const activeStep = useMemo(() => {
    if (rows.length > 0) return 3;
    if (fileName) return 3;
    return fileName ? 2 : 1;
  }, [rows.length, fileName]);

  const steps = [
    { num: 1, title: tUi("stepIndicator1Title"), subtitle: tUi("stepIndicator1Subtitle") },
    { num: 2, title: tUi("stepIndicator2Title"), subtitle: tUi("stepIndicator2Subtitle") },
    { num: 3, title: tUi("stepIndicator3Title"), subtitle: tUi("stepIndicator3Subtitle") },
  ];

  const columns: Column<BulkRow>[] = [
    { key: "wardNo", label: tUi("colWard", { ward: wardLabel }) },
    { key: "fromPropertyNo", label: tUi("colFrom") },
    { key: "toPropertyNo", label: tUi("colTo") },
    { key: "taxZoneNo", label: tUi("colZone", { taxZone: taxZoneLabel }) },
    {
      key: "status",
      label: tUi("colStatus"),
      render: (_value, row) => (
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
          row.status === "Invalid" ? "bg-[#ffe0e3] text-[#c73545]" :
          row.status === "Updated" ? "bg-[#fff4dc] text-[#9a6200]" : "bg-[#e7f8ed] text-[#16814f]"
        }`}>
          {row.status === "Invalid" ? tUi("statusInvalid") : row.status === "Updated" ? tUi("statusUpdated") : tUi("statusNew")}
        </span>
      ),
    },
    {
      key: "errors",
      label: tUi("colErrors"),
      render: (_value, row) => row.errors?.join("; ") || "-",
    },
  ];

  return (
    <div className="flex flex-col h-full bg-[#f8fafc]">
      {/* Header */}
      <div className="bg-[#1f67b2] text-white px-6 py-4 flex justify-between items-start shrink-0">
        <div>
          <h2 className="text-[19px] font-bold">{tUi("title", { taxZone: taxZoneLabel })}</h2>
          <p className="text-[13px] text-blue-100 mt-1">
            {tUi("subtitle")}
          </p>
        </div>
        <IconOnlyActionButton
          icon={X}
          variant="ghost"
          size="sm"
          aria-label="Close"
          onClick={onClose}
          className="h-auto w-auto gap-0 p-1.5 bg-transparent text-white border border-white/20 hover:bg-white/10 hover:text-white rounded-md transition-colors"
        />
      </div>

      {/* Body Content */}
      <div ref={scrollBodyRef} className="flex-1 overflow-y-auto px-6 py-6">

        {/* Step Indicators */}
        <div className="flex gap-4 mb-6">
          {steps.map((step) => (
            <div
              key={step.num}
              className={`flex-1 p-3 rounded-xl border flex gap-3 items-center ${
                activeStep === step.num
                  ? "bg-[#f1f8ff] border-[#b6d5f7]"
                  : "bg-white border-gray-200"
              }`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0 ${
                activeStep === step.num
                  ? "bg-[#dceefe] text-[#0b2f5b]"
                  : activeStep > step.num
                  ? "bg-[#e7f8ed] text-[#16814f]"
                  : "bg-[#f1f5f9] text-gray-500"
              }`}>
                {step.num}
              </div>
              <div>
                <div className={`text-[13px] font-bold ${activeStep === step.num ? "text-[#0b2f5b]" : "text-[#172033]"}`}>
                  {step.title}
                </div>
                <div className="text-[11px] text-[#667085] leading-tight mt-0.5">
                  {step.subtitle}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {/* Card 1 */}
          <Card className="shadow-sm border-gray-200 rounded-xl overflow-hidden" padding="none">
            <div className="px-5 py-4">
              <h3 className="text-[16px] font-extrabold text-[#0b2f5b]">{tUi("step1Title")}</h3>
              <p className="text-[13px] text-[#667085] mt-1.5 leading-relaxed">
                {tUi("step1Desc")}
              </p>
              <div className="mt-4">
                <DownloadButton
                  label={tUi("downloadTemplateBtn")}
                  onClick={onDownloadTemplate}
                  className="px-5 h-[38px] text-[13px] font-extrabold rounded-md shadow-sm"
                />
              </div>
            </div>
          </Card>

          {/* Card 2 */}
          <Card className="shadow-sm border-gray-200 rounded-xl overflow-hidden" padding="none">
            <div className="px-5 py-4">
              <h3 className="text-[16px] font-extrabold text-[#0b2f5b]">{tUi("step2Title")}</h3>
              <p className="text-[13px] text-[#667085] mt-1.5 leading-relaxed">
                {tUi("step2Desc")}
              </p>
              <div className="mt-4 border-2 border-dashed border-[#b6c6d8] rounded-xl bg-[#f8fafc] flex flex-col items-center justify-center p-8 gap-3">
                <Input
                  naked
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".xlsx, .xls, .csv"
                  onChange={(e) => onImportFile(e)}
                  disabled={importing}
                />
                <ImportButton
                  label={importing ? tUi("validating") : tUi("chooseExcelFileBtn")}
                  onClick={() => fileInputRef.current?.click()}
                  isLoading={importing}
                  disabled={importing}
                  className="text-[13px] font-extrabold h-[36px] px-5 rounded-md shadow-sm"
                />
                <div className="text-[12px] text-[#667085]">
                  {importing ? tUi("uploadingValidating") : fileName ? fileName : tUi("noFileSelected")}
                </div>
              </div>
            </div>
          </Card>

          {/* Card 3 */}
          <div ref={step3Ref} />
          <Card className={`shadow-sm border-gray-200 rounded-xl overflow-hidden transition-opacity duration-300 ${rows.length === 0 ? "opacity-60 pointer-events-none" : ""}`} padding="none">
            <div className="px-5 py-4">
              <h3 className="text-[16px] font-extrabold text-[#0b2f5b]">{tUi("step3Title")}</h3>
              <p className="text-[13px] text-[#667085] mt-1.5 leading-relaxed">
                {tUi("step3Desc")}
              </p>
              {rows.length > 0 && (
                <div className="mt-4">
                  <MasterTable<BulkRow>
                    columns={columns}
                    data={rows as BulkRow[]}
                    rowClassName={(row) => (row.status === "Invalid" ? "bg-[#fff5f5]" : "")}
                    maxBodyHeightClassName="max-h-[320px]"
                  />
                </div>
              )}
              {hasInvalidRows && (
                <div className="mt-3 text-[11px] font-semibold text-[#c73545]">
                  {tUi("resolveInvalid")}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 px-6 py-4 flex justify-between items-center shrink-0">
        <div className="text-[11px] font-semibold text-[#667085]">
          {tUi("footerNote")}
        </div>
        <div className="flex gap-3">
          <CancelButton
            onClick={onClose}
            className="text-[13px] h-[36px] px-5 font-extrabold shadow-sm rounded-md"
          />
          <ApplyButton
            label={saving ? tUi("applying") : tUi("validateUpdateBtn")}
            onClick={onApply}
            disabled={!hasValidRows || saving || importing}
            className="text-[13px] h-[36px] px-5 font-extrabold shadow-sm rounded-md"
          />
        </div>
      </div>
    </div>
  );
}
