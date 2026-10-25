"use client";

import { useTranslations } from "next-intl";
import TableHeader from "@/components/common/TableHeader";
import { InventoryNameMasterToolbar } from "./InventoryNameMasterToolbar";
import { useInventoryNameMasterError } from "./InventoryNameMasterErrorContext";

export function InventoryNameMasterLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations("asset.configuration.header");
  const tMaster = useTranslations("asset.masterNames");
  const { hasError } = useInventoryNameMasterError();

  return (
    <div className="space-y-6">
      {!hasError && (
        <TableHeader
          title={tMaster("inventory-name-master")}
          subtitle={t("subtitle")}
          icon="layers"
          rightContent={<InventoryNameMasterToolbar />}
        />
      )}

      <div className={hasError ? "" : "mt-0"}>
        {children}
      </div>
    </div>
  );
}
