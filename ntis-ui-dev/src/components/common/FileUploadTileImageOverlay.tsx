'use client';
import type { FileUploadTileImageOverlayProps } from "@/types/asset/municipal-Asset/new-add-new-asset";


import { UploadCloud, Trash2 } from "lucide-react";



export function FileUploadTileImageOverlay({
  label,
  description,
  previewUrl,
  errorMessage,
  disabled,
  inputRef,
  onDelete,
  replaceLabel,
  deleteLabel,
}: FileUploadTileImageOverlayProps) {
  return (
    <div className="space-y-2">
      <div
        onClick={() => !disabled && !previewUrl && inputRef.current?.click()}
        className={`relative h-44 rounded-xl border flex flex-col items-center justify-center overflow-hidden transition-all group ${previewUrl ? "border-slate-200 cursor-default" : "border-2 border-dashed border-slate-300 hover:border-blue-400 bg-slate-50/50 cursor-pointer"
          }`}
      >
        {previewUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt={label} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                disabled={disabled}
                className="bg-white/95 text-slate-800 px-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5 hover:bg-white"
              >
                <UploadCloud className="size-4 text-blue-600" /> {replaceLabel}
              </button>
              {onDelete && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  disabled={disabled}
                  className="bg-white/95 text-red-600 px-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5 hover:bg-white"
                >
                  <Trash2 className="size-4" /> {deleteLabel}
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center text-slate-400 select-none p-4">
            <div className="bg-slate-100 p-2.5 rounded-full border border-slate-200 text-slate-400 group-hover:text-blue-500 transition-colors">
              <UploadCloud className="size-6" />
            </div>
            <h5 className="text-[10px] font-black text-slate-700 uppercase tracking-wider mt-2.5">{label}</h5>
            {description && <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight mt-1 text-center">{description}</p>}
          </div>
        )}
      </div>
      {errorMessage && <p className="text-[10px] text-red-600 font-medium">{errorMessage}</p>}
    </div>
  );
}

export default FileUploadTileImageOverlay;
