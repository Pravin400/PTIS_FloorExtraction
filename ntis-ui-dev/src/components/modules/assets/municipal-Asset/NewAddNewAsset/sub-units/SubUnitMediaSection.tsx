'use client';
import Image from "next/image";

import { UploadCloud } from "lucide-react";
import { Card } from "@/components/common";
import { useConfirm } from "@/components/common/ConfirmProvider";
import { ALLOWED_ASSET_FILE_ACCEPT } from "@/lib/constants/asset/file-upload.constants";
import { SubUnitMediaSectionProps } from "@/types/asset/sub-units.types";

export function SubUnitMediaSection({
  photoPreview,
  planPreview,
  setPhotoPreview,
  setPlanPreview,
  setPhotoFile,
  setPlanFile,
  photoRef,
  planRef,
  handlePhotoChange,
  handlePlanChange,
  t
}: SubUnitMediaSectionProps) {
  const { confirm } = useConfirm();

  return (
    <Card variant="bordered" className="bg-white border-slate-200/80 rounded-2xl shadow-sm p-3 space-y-3.5" padding="none">
      {/* Asset Image */}
      <div className="space-y-2">
        <span className="inline-block text-[10px] font-black text-blue-700 bg-blue-50 border border-blue-100 px-2 py-1 rounded-md uppercase tracking-widest shadow-sm">{t("subunit.labels.assetImage")}</span>
        <div
          onClick={() => !photoPreview && photoRef.current?.click()}
          className={`relative h-64 rounded-xl border flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all group ${photoPreview ? 'border-slate-200' : 'border-slate-200 bg-[#e2ebf5]/30 hover:bg-[#e2ebf5]/60 hover:border-slate-300 shadow-sm'}`}
        >
          {photoPreview ? (
            <>
              <Image unoptimized width={100} height={100} src={photoPreview} alt="Asset Image" className="w-full h-full object-cover"  />
              <div className="absolute top-2 right-2 flex items-center gap-1.5 z-20">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    photoRef.current?.click();
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-slate-50 text-blue-600 rounded-full shadow-md transition-colors flex items-center justify-center text-[9px] font-black uppercase tracking-wider"
                  title="Replace Image"
                >
                  {t("buttons.replace")}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    confirm({
                      variant: "delete",
                      title: t("subunit.confirm.deleteImageTitle"),
                      description: t("subunit.confirm.deleteImageDesc"),
                      onConfirm: () => {
                        setPhotoPreview(null);
                        setPhotoFile(null);
                        if (photoRef.current) photoRef.current.value = "";
                      }
                    });
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-red-50 text-red-600 rounded-full shadow-md transition-colors flex items-center justify-center text-[9px] font-black uppercase tracking-wider"
                  title="Delete Image"
                >
                  {t("buttons.delete")}
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400 select-none p-4">
              <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-full text-blue-500 mb-2 group-hover:scale-110 transition-transform">
                <UploadCloud className="size-5" />
              </div>
              <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">{t("subunit.labels.uploadImage")}</span>
              <span className="text-[8px] text-slate-400 font-bold uppercase tracking-tight mt-1 text-center">{t("subunit.labels.browseFile")}</span>
            </div>
          )}
          {photoPreview && (
            <div className="absolute top-2.5 left-2.5 bg-[#4c8bf5] text-white text-[9px] font-black px-2 py-0.5 rounded-full tracking-wider shadow-sm select-none z-10">
              {t("subunit.labels.plusMore", { count: 1 })}
            </div>
          )}
        </div>
      </div>
      <input ref={photoRef} type="file" accept={ALLOWED_ASSET_FILE_ACCEPT} className="hidden" onChange={handlePhotoChange} />

      {/* Photo Plan */}
      <div className="space-y-2">
        <span className="inline-block text-[10px] font-black text-blue-700 bg-blue-50 border border-blue-100 px-2 py-1 rounded-md uppercase tracking-widest shadow-sm">{t("subunit.labels.assetPhotoPlan")}</span>
        <div
          onClick={() => !planPreview && planRef.current?.click()}
          className={`relative h-64 rounded-xl border flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all group ${planPreview ? 'border-slate-200' : 'border-slate-200 bg-[#e2ebf5]/30 hover:bg-[#e2ebf5]/60 hover:border-slate-300 shadow-sm'}`}
        >
          {planPreview ? (
            <>
              <Image unoptimized width={100} height={100} src={planPreview} alt="Photo Plan" className="w-full h-full object-cover"  />
              <div className="absolute top-2 right-2 flex items-center gap-1.5 z-20">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    planRef.current?.click();
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-slate-50 text-blue-600 rounded-full shadow-md transition-colors flex items-center justify-center text-[9px] font-black uppercase tracking-wider"
                  title="Replace Image"
                >
                  {t("buttons.replace")}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    confirm({
                      variant: "delete",
                      title: t("subunit.confirm.deletePlanTitle"),
                      description: t("subunit.confirm.deletePlanDesc"),
                      onConfirm: () => {
                        setPlanPreview(null);
                        setPlanFile(null);
                        if (planRef.current) planRef.current.value = "";
                      }
                    });
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-red-50 text-red-600 rounded-full shadow-md transition-colors flex items-center justify-center text-[9px] font-black uppercase tracking-wider"
                  title="Delete Image"
                >
                  {t("buttons.delete")}
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400 select-none p-4">
              <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-full text-blue-500 mb-2 group-hover:scale-110 transition-transform">
                <UploadCloud className="size-5" />
              </div>
              <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">{t("subunit.labels.uploadPhotoPlan")}</span>
              <span className="text-[8px] text-slate-400 font-bold uppercase tracking-tight mt-1 text-center">{t("subunit.labels.browseFile")}</span>
            </div>
          )}
        </div>
      </div>
      <input ref={planRef} type="file" accept={ALLOWED_ASSET_FILE_ACCEPT} className="hidden" onChange={handlePlanChange} />
    </Card>
  );
}
