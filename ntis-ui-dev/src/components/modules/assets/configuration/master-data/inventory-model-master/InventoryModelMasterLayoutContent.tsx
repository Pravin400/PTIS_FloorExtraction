"use client";


import { useTranslations } from "next-intl";
import TableHeader from "@/components/common/TableHeader";
import { InventoryModelMasterToolbar } from "./InventoryModelMasterToolbar";
import { useInventoryModelMasterError } from "./InventoryModelMasterErrorContext";

import type { InventoryModelMasterLayoutContentProps } from "@/types/asset-masters/inventory-model.types";

export function InventoryModelMasterLayoutContent({
  children,
}: InventoryModelMasterLayoutContentProps) {
  const t = useTranslations("inventoryModel.configuration.header");
  const tMaster = useTranslations("asset.masterNames");
  const { hasError } = useInventoryModelMasterError();

  return (
    <div className="space-y-6">
      {!hasError && (
        <TableHeader
          title={tMaster("inventory-model-master")}
          subtitle={t("subtitle")}
          icon="layers"
          rightContent={<InventoryModelMasterToolbar />}
        />
      )}

      <div className={hasError ? "" : "mt-0"}>
        {children}
      </div>
    </div>
  );
}
