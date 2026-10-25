"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { AddButton } from "@/components/common";

export function AssessmentYearRangeToolbar() {
  const router = useRouter();
  const locale = useLocale();
  const tCV = useTranslations("assetAssessmentYearRange.capitalValue");

  const base = `/${locale}/assets/configuration/master-data/assessment-year-range/capitalvalue`;

  return (
    <div className="flex items-center gap-3">
      <AddButton
        className="w-full !bg-[#0f3d8a] hover:!bg-[#0b2f6b] !text-white"
        label={tCV("form.addTitle")}
        onClick={() => router.push(`${base}/add`)}
      />
    </div>
  );
}

