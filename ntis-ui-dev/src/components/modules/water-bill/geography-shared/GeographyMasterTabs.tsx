"use client";

import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { Tabs } from "@/components/common";

type GeographyMasterTab = "geography-type-master" | "geography-unit-master";

export function GeographyMasterTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const tType = useTranslations("geographyTypeMaster");
  const tUnit = useTranslations("geographyUnitMaster");

  const activeTab: GeographyMasterTab = pathname.includes("/geography-unit-master")
    ? "geography-unit-master"
    : "geography-type-master";

  return (
    <Tabs
      className="flex-row shrink-0"
      value={activeTab}
      variant="pills"
      items={[
        {
          value: "geography-type-master",
          label: tType("list.title"),
          content: null,
        },
        {
          value: "geography-unit-master",
          label: tUnit("list.title"),
          content: null,
        },
      ]}
      onChange={(value) => {
        router.push(`/${locale}/water-bill/${value}?page=1&pageSize=10`);
      }}
    />
  );
}
