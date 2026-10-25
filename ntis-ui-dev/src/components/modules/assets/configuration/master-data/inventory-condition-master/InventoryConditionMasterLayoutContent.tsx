"use client";

import { useTranslations } from "next-intl";
import TableHeader from "@/components/common/TableHeader";
import { InventoryConditionMasterToolbar } from "./InventoryConditionMasterToolbar";
import { useInventoryConditionMasterError } from "./InventoryConditionMasterErrorContext";

export function InventoryConditionMasterLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations("inventoryCondition.configuration.header");
  const tMaster = useTranslations("asset.masterNames");
  const { hasError } = useInventoryConditionMasterError();

  return (
    <div className="space-y-6">
      {!hasError && (
        <TableHeader
          title={tMaster("inventory-condition-master")}
          subtitle={t("subtitle")}
          icon="layers"
          rightContent={<InventoryConditionMasterToolbar />}
        />
      )}

      <div className={hasError ? "" : "mt-0"}>
        {children}
      </div>
    </div>
  );
}
