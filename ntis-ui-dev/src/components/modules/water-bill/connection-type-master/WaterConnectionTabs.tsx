"use client";

import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Tabs } from "@/components/common";

type TabKey = "connection-type" | "tap-size" | "connection-category";

export function WaterConnectionTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("waterConnectionMaster");

  const base = `/${locale}/water-bill/connection-type-master`;

  const activeTab: TabKey = pathname?.includes("/tap-size")
    ? "tap-size"
    : pathname?.includes("/connection-category")
      ? "connection-category"
      : "connection-type";

  return (
    <Tabs
      className="flex items-center gap-2 mt-0 flex-row"
      value={activeTab}
      variant="pills"
      items={[
        {
          value: "connection-type",
          label: t("tabs.connectionType") || "Connection Type",
          content: null,
        },
        {
          value: "connection-category",
          label: t("tabs.connectionCategory") || "Connection Category",
          content: null,
        },
        {
          value: "tap-size",
          label: t("tabs.tapSize") || "Tap Size",
          content: null,
        },
      ]}
      onChange={(v) => router.push(`${base}/${v}`)}
    />
  );
}
