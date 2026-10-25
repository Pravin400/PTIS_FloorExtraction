"use client";


import { useTranslations } from "next-intl";
import TableHeader from "@/components/common/TableHeader";
import { AssetCategoryMasterToolbar } from "./AssetCategoryMasterToolbar";
import { useAssetCategoryMasterError } from "./AssetCategoryMasterErrorContext";

import type { AssetCategoryMasterLayoutContentProps } from "@/types/asset-masters/asset-category.types";

export function AssetCategoryMasterLayoutContent({
  children,
}: AssetCategoryMasterLayoutContentProps) {
  const t = useTranslations("asset.configuration.header");
  const tMaster = useTranslations("asset.masterNames");
  const { hasError } = useAssetCategoryMasterError();

  return (
    <div className="space-y-6">
      {!hasError && (
        <TableHeader
          title={tMaster("asset-category-master")}
          subtitle={t("subtitle")}
          icon="layers"
          rightContent={<AssetCategoryMasterToolbar />}
        />
      )}

      <div className={hasError ? "" : "mt-0"}>
        {children}
      </div>
    </div>
  );
}
