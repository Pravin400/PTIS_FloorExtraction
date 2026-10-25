"use client";

import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { AddButton, Tabs } from "@/components/common";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

type TabKey = "rateablevalue" | "capitalvalue";

export function AssessmentYearRangeToolbar() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const tShared = useTranslations("assessmentYearRange.shared");
  const tRV = useTranslations("assessmentYearRange.rateableValue");
  const tCV = useTranslations("assessmentYearRange.capitalValue");

  const base = `/${locale}/property-tax/assessment-year-range`;

  // Detect active tab from pathname
  const activeTab: TabKey = pathname.includes("/capitalvalue") ? "capitalvalue" : "rateablevalue";
  const t = activeTab === "rateablevalue" ? tRV : tCV;

  const assessmentLabel = useAliasLabel("Assessment", t("aliasFallback.entity"));
  const values = { assessment: assessmentLabel, entity: assessmentLabel };

  return (
    <div className="flex items-center gap-3">
      <Tabs
        className="flex items-center gap-3 flex-row"
        value={activeTab}
        variant="pills"
        items={[
          { value: "rateablevalue", label: tShared("tabs.rateableValue"), content: null },
          { value: "capitalvalue", label: tShared("tabs.capitalValue"), content: null }
        ]}
        onChange={(v) => router.push(`${base}/${v}`)}
      />

      <AddButton
        className="w-full"
        label={t("form.addTitle", values)}
        onClick={() => router.push(`${base}/${activeTab}/add`)}
      />
    </div>
  );
}
