"use client";

import type React from "react";
import { useTranslations } from "next-intl";
import TableHeader from "@/components/common/TableHeader";
import { OwnershipTypeMasterToolbar } from "./OwnershipTypeMasterToolbar";
import { useOwnershipTypeMasterError } from "./OwnershipTypeMasterErrorContext";

export function OwnershipTypeMasterLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations("asset.configuration.header");
  const tMaster = useTranslations("asset.masterNames");
  const { hasError } = useOwnershipTypeMasterError();

  return (
    <div className="space-y-6">
      {!hasError && (
        <TableHeader
          title={tMaster("ownership-type-master")}
          subtitle={t("subtitle")}
          icon="layers"
          rightContent={<OwnershipTypeMasterToolbar />}
        />
      )}

      <div className={hasError ? "" : "mt-0"}>
        {children}
      </div>
    </div>
  );
}
