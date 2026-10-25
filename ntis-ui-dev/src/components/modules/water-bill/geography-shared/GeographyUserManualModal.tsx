"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Tag, MapPin, ArrowRight } from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { OkButton } from "@/components/common/ActionButtons";

export function GeographyUserManualModal() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("geographyShared.userManual");

  const isOpen = searchParams.get("showUserManual") === "true";

  const onClose = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("showUserManual");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  return (
    <Modal open={isOpen} onClose={onClose} title={t("title")} maxWidth="lg">
      <div className="flex flex-col gap-6">
        <p className="text-sm font-medium leading-relaxed text-slate-700">{t("intro")}</p>

        {/* Relationship diagram */}
        <div className="flex flex-col items-center gap-3 rounded-xl border border-[#DCEAFF] bg-slate-50 p-5 sm:flex-row sm:justify-center">
          <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
            <Tag size={18} className="text-blue-600" />
            <div>
              <div className="text-sm font-bold text-blue-900">{t("diagram.typeLabel")}</div>
              <div className="text-xs text-slate-500">{t("diagram.typeExample")}</div>
            </div>
          </div>
          <ArrowRight size={20} className="rotate-90 text-slate-400 sm:rotate-0" />
          <div className="flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-4 py-3">
            <MapPin size={18} className="text-teal-600" />
            <div>
              <div className="text-sm font-bold text-teal-900">{t("diagram.unitLabel")}</div>
              <div className="text-xs text-slate-500">{t("diagram.unitExample")}</div>
            </div>
          </div>
        </div>

        <div className="space-y-3 text-sm font-medium leading-relaxed text-slate-700">
          <div className="flex gap-2">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
              1
            </span>
            <p>{t("steps.step1")}</p>
          </div>
          <div className="flex gap-2">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
              2
            </span>
            <p>{t("steps.step2")}</p>
          </div>
          <div className="flex gap-2">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
              3
            </span>
            <p>{t("steps.step3")}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
          <span>{t("note")}</span>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <OkButton onClick={onClose} />
        </div>
      </div>
    </Modal>
  );
}
