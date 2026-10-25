"use client";


import { useTranslations } from "next-intl";
import TableHeader from "@/components/common/TableHeader";
import { AssetTypeMasterToolbar } from "./AssetTypeMasterToolbar";
import { useAssetTypeMasterError } from "./AssetTypeMasterErrorContext";

import type { AssetTypeMasterLayoutContentProps } from "@/types/asset-masters/asset-type.types";

export function AssetTypeMasterLayoutContent({
  children,
}: AssetTypeMasterLayoutContentProps) {
  const t = useTranslations("asset.configuration.header");
  const tMaster = useTranslations("asset.masterNames");
  const { hasError } = useAssetTypeMasterError();

  return (
    <div className="space-y-6">
      {!hasError && (
        <TableHeader
          title={tMaster("asset-type-master")}
          subtitle={t("subtitle")}
          icon="layers"
          rightContent={<AssetTypeMasterToolbar />}
        />
      )}

      <div className={hasError ? "" : "mt-0"}>
        {children}
      </div>
    </div>
  );
}
