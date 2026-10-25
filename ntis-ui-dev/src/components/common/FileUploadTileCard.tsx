'use client';
import type { FileUploadTileCardProps } from "@/types/asset/municipal-Asset/new-add-new-asset";



import { Upload, Loader2, CheckCircle2, AlertCircle, FileText, Eye, Trash2 } from "lucide-react";
import { Button } from "./ActionButton";


const STATUS_CONFIG = {
  pending: { bg: "bg-gradient-to-r from-[#C8E1FC] via-[#DBEAFF] to-[#EDF5FF]", border: "border-[#A3CBFA]", icon: Upload, iconColor: "text-[#1d4ed8]" },
  uploading: { bg: "bg-blue-50", border: "border-blue-200", icon: Loader2, iconColor: "text-blue-600" },
  uploaded: { bg: "bg-emerald-50", border: "border-emerald-200", icon: CheckCircle2, iconColor: "text-emerald-600" },
  error: { bg: "bg-red-50", border: "border-red-200", icon: AlertCircle, iconColor: "text-red-500" },
} as const;



export function FileUploadTileCard({
  inputId,
  label,
  description,
  required,
  status,
  fileName,
  errorMessage,
  maxFileSizeMB,
  allowedExtensionsLabel,
  onView,
  onDelete,
  isViewing,
  labels,
}: FileUploadTileCardProps) {
  const config = STATUS_CONFIG[status];
  const StatusIcon = config.icon;

  return (
    <div className={`${config.bg} ${config.border} border rounded-xl p-3 transition-all hover:shadow-sm w-full h-full flex flex-col justify-between`}>
      <div className="flex items-start gap-3 h-full">
        <div className={`p-2 rounded-lg shrink-0 ${status === "uploaded" ? "bg-emerald-100" : status === "error" ? "bg-red-100" : "bg-white"}`}>
          <StatusIcon className={`size-5 ${config.iconColor} ${status === "uploading" ? "animate-spin" : ""}`} />
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
          <div>
            <h4 className="text-sm font-semibold text-slate-800 leading-tight">
              {label}
              {required && <span className="text-red-500 font-bold ml-1">*</span>}
            </h4>
            {description && <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{description}</p>}
            {status === "uploaded" && fileName ? (
              <div className="mt-2 flex items-center gap-1.5 text-emerald-700">
                <FileText className="size-3 shrink-0" />
                <span className="text-[10px] font-medium truncate">{fileName}</span>
              </div>
            ) : (
              <p className="mt-2 text-[10px] text-slate-400">
                {maxFileSizeMB ? `Max ${maxFileSizeMB}MB • ` : ""}{allowedExtensionsLabel}
              </p>
            )}
            {status === "error" && errorMessage && <p className="mt-2 text-[10px] text-red-600 font-medium">{errorMessage}</p>}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <label
              htmlFor={inputId}
              className={`w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all ${status === "uploaded" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200"
                  : status === "uploading" ? "bg-blue-100 text-blue-600 border border-blue-200 cursor-wait"
                    : status === "error" ? "bg-red-100 text-red-700 hover:bg-red-200 border border-red-200"
                      : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                }`}
            >
              {status === "uploading" ? <><Loader2 className="size-3 animate-spin" /> {labels.uploading}</>
                : status === "uploaded" ? <><Upload className="size-3" /> {labels.replace}</>
                  : <><Upload className="size-3" /> {labels.upload}</>}
            </label>
            {status === "uploaded" && (
              <>
                {onView && (
                  <Button variant="secondary" type="button" onClick={onView} disabled={isViewing} className="p-1.5 text-slate-600 rounded-lg" title={labels.view}>
                    {isViewing ? <Loader2 className="size-3.5 animate-spin text-blue-600" /> : <Eye className="size-3.5" />}
                  </Button>
                )}
                {onDelete && (
                  <Button variant="ghost" type="button" onClick={onDelete} className="p-1.5 border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all" title={labels.delete}>
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FileUploadTileCard;
