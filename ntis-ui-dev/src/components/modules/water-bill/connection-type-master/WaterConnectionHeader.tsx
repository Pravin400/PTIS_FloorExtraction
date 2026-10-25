"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import TableHeader from "@/components/common/TableHeader";
import { WaterConnectionTabs } from "./WaterConnectionTabs";

export function WaterConnectionHeader() {
  const pathname = usePathname() || "";
  const tConn = useTranslations("connectionTypeMaster.connectionType");
  const tTap = useTranslations("tapSizeMaster.tapSize");
  const tCat = useTranslations("connectionCategoryMaster.connectionCategory");

  let title = tConn("title");
  let subtitle = tConn("description");

  if (pathname.includes("/tap-size")) {
    title = tTap("title");
    subtitle = tTap("description");
  } else if (pathname.includes("/connection-category")) {
    title = tCat("title");
    subtitle = tCat("description");
  }

  return (
    <TableHeader
      title={title}
      subtitle={subtitle}
      icon="database"
      rightContent={<WaterConnectionTabs />}
    />
  );
}
