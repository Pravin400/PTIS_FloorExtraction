"use client";


import { useTranslations } from "next-intl";
import TableHeader from "@/components/common/TableHeader";
import { InventoryCategoryMasterToolbar } from "./InventoryCategoryMasterToolbar";
import { useInventoryCategoryMasterError } from "./InventoryCategoryMasterErrorContext";

import type { InventoryCategoryMasterLayoutContentProps } from "@/types/asset-masters/inventory-category.types";

export function InventoryCategoryMasterLayoutContent({
  children,
}: InventoryCategoryMasterLayoutContentProps) {
  const t = useTranslations("inventoryCategory.configuration.header");
  const tMaster = useTranslations("asset.masterNames");
  const { hasError } = useInventoryCategoryMasterError();

  return (
    <div className="space-y-6">
      {!hasError && (
        <TableHeader
          title={tMaster("inventory-category-master")}
          subtitle={t("subtitle")}
          icon="layers"
          rightContent={<InventoryCategoryMasterToolbar />}
        />
      )}

      <div className={hasError ? "" : "mt-0"}>
        {children}
      </div>
    </div>
  );
}
