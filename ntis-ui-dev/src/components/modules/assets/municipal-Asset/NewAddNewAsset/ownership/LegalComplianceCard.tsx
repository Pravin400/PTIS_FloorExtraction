import React from "react";
import { FileUp, Upload, CheckCircle2, Loader2, FileBox, AlertCircle, Trash2, Eye } from "lucide-react";
import { Button, Input, Badge, Label } from "@/components/common";
import type { DocumentUploadCardProps } from "@/types/asset/municipal-Asset/new-add-new-asset/ownership.types";

export function LegalComplianceCard({
  definition,
  state,
  onFileSelect,
  onDelete,
  onView,
  isViewing,
  fileInputRef,
  t,
}: DocumentUploadCardProps) {
  const status = state?.status || "pending";
  const inputId = `compliance-doc-${definition.id}`;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const statusConfig = {
    pending: { bg: "bg-gradient-to-r from-[#C8E1FC] via-[#DBEAFF] to-[#EDF5FF]", border: "border-[#A3CBFA]", icon: FileUp, iconColor: "text-[#1d4ed8]" },
    uploading: { bg: "bg-blue-50", border: "border-blue-200", icon: Loader2, iconColor: "text-blue-600" },
    uploaded: { bg: "bg-emerald-50/70", border: "border-emerald-200", icon: CheckCircle2, iconColor: "text-emerald-600" },
    error: { bg: "bg-red-50/70", border: "border-red-200", icon: AlertCircle, iconColor: "text-red-500" },
  }[status];

  const StatusIcon = statusConfig.icon;

  return (
    <div className={`p-3.5 rounded-xl border ${statusConfig.border} ${statusConfig.bg} transition-all duration-200 shadow-sm relative overflow-hidden group`}>
      <Input
        id={inputId}
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={definition.allowedExtensions}
        className="hidden"
      />

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          <div className="p-2 rounded-lg bg-white/80 shadow-xs shrink-0 mt-0.5">
            <StatusIcon className={`w-4 h-4 ${statusConfig.iconColor} ${status === "uploading" ? "animate-spin" : ""}`} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="text-xs font-semibold text-slate-800 leading-tight">
                {definition.documentName}
              </h4>
              {definition.isRequired && (
                <Badge variant="destructive" className="text-[10px] font-bold px-1.5 py-0.5">
                  {t("compliance.card.required") || "Required"}
                </Badge>
              )}
            </div>

            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
              {definition.description || t("compliance.card.defaultDescription")}
            </p>

            <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400 font-medium">
              <span>{t("compliance.card.maxSize", { size: definition.maxFileSizeMB }) || `Max ${definition.maxFileSizeMB}MB`}</span>
              <span>•</span>
              <span className="truncate max-w-[150px]">{t("compliance.card.allowed", { formats: definition.allowedExtensions }) || definition.allowedExtensions}</span>
            </div>

            {status === "error" && state?.error && (
              <p className="text-[11px] font-medium text-red-600 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {state.error}
              </p>
            )}

            {status === "uploaded" && (
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="outline" className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-white/80 px-2 py-0.5 rounded-md border-emerald-100">
                  <FileBox className="w-3 h-3 text-emerald-600" />
                  {state?.file?.name || ((state?.uploadedDoc as Record<string, unknown> | undefined)?.fileName as string) || t("compliance.card.fileAttached") || "File Attached"}
                </Badge>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {status === "pending" && (
            <Label
              htmlFor={inputId}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              {t("compliance.card.upload") || "Upload"}
            </Label>
          )}

          {status === "uploaded" && (
            <>
              {onView && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onView}
                  disabled={isViewing}
                  className="h-7 px-2.5 text-xs font-medium text-slate-700 hover:bg-white bg-white/80 border-slate-200"
                >
                  {isViewing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5 text-slate-600" />}
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onDelete}
                className="h-7 px-2.5 text-xs font-medium text-red-600 hover:bg-red-50 bg-white/80 border-slate-200"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </>
          )}

          {status === "error" && (
            <Label
              htmlFor={inputId}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              {t("compliance.card.retry") || "Retry"}
            </Label>
          )}
        </div>
      </div>
    </div>
  );
}
