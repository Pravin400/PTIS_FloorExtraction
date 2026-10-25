"use client";

import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Tabs } from "@/components/common";
import TableHeader from "@/components/common/TableHeader";
import { Calculator, LandPlot } from "lucide-react";

import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

export function RateTabsNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("ptis_RVRateMaster");
  const constructionTypeLabel = useAliasLabel("Construction_Type", t("aliasFallback.constructionType"));
  const zonesLabel = useAliasLabel("Zones", t("aliasFallback.zones"));
  const useLabel = useAliasLabel("Use", t("aliasFallback.use"));
  const assessmentLabel = useAliasLabel("Assessment", t("aliasFallback.assessment"));

  // Determine active tab from pathname
  // Only show Rateable Value tab until Capital Value is implemented
  const tabConfig = [
    {
      value: "rvratemaster",
      label: t("header.rateableTab", { constructionType: constructionTypeLabel }),
      icon: Calculator,
      headerTitle: t("header.rateableTitle"),
      headerSubtitle: t("header.rateableDescription", { zones: zonesLabel, use: useLabel, assessment: assessmentLabel }),
    },
    {
      value: "openplot",
      label: t("header.openplotTab"),
      icon: LandPlot,
      headerTitle: t("header.openplotTitle"),
      headerSubtitle: t("header.openplotDescription", { zones: zonesLabel, use: useLabel, assessment: assessmentLabel }),
    }

  ];

  const activeValue = tabConfig.find(tab => pathname.includes(`/${tab.value}`))?.value || "rvratemaster";
  const activeTab = tabConfig.find(tab => tab.value === activeValue) || tabConfig[0];

  return (
    <div className="mb-2">
      <TableHeader
        title={activeTab.headerTitle}
        icon={activeTab.icon}
        subtitle={activeTab.headerSubtitle}
        rightContent={
          <Tabs
            value={activeValue}
            items={tabConfig.map(({ value, label, icon }) => ({ value, label, icon, content: null }))}
            variant="pills"
            onChange={(v: string | number) => {
              const tab = tabConfig.find(item => item.value === v);
              if (tab) router.push(`/${locale}/property-tax/rate-master/${tab.value}`);
            }}
          />
        }
      />
    </div>
  );
}
