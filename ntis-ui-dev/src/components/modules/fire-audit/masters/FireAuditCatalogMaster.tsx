"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { MasterTable, PageContainer, StatusBadge } from "@/components/common";
import { FireAuditMasterChrome } from "./FireAuditMasterChrome";
import type { FireAuditCatalogId, FireAuditCatalogRow } from "@/types/fire-audit/catalog.types";

interface FireAuditCatalogMasterProps {
  catalogId: FireAuditCatalogId;
  viewOnly?: boolean;
  data?: FireAuditCatalogRow[];
}

export function FireAuditCatalogMaster({
  catalogId,
  viewOnly = false,
  data = [],
}: FireAuditCatalogMasterProps) {
  const t = useTranslations(`fireAudit.masters.${catalogId}`);
  const tMasters = useTranslations("fireAudit.masters");
  const tCommon = useTranslations("common");
  const [search, setSearch] = useState("");

  return (
    <PageContainer className="!bg-transparent">
      <FireAuditMasterChrome
        kicker={tMasters("kicker")}
        title={t("title")}
        subtitle={t("subtitle")}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("search")}
        addLabel={viewOnly ? undefined : tMasters("add")}
        onAdd={viewOnly ? undefined : () => undefined}
        viewOnlyNote={viewOnly ? tMasters("viewOnly") : undefined}
      >
        <MasterTable<FireAuditCatalogRow>
          containerClassName="!border-0 !bg-transparent !shadow-none"
          theadClassName="!bg-[rgba(18,59,74,0.06)] !bg-none [&_*]:!text-[#586E7C]"
          columns={[
            { key: "code", label: t("columns.code") },
            { key: "name", label: t("columns.name") },
            { key: "detail", label: t("columns.detail") },
            {
              key: "isActive",
              label: t("columns.active"),
              isStatus: true,
              render: (value) => <StatusBadge value={Boolean(value)} />,
            },
          ]}
          data={data}
          loading={false}
          height="lg"
          emptyText={t("empty")}
          paginationConfig={{ enabled: false }}
          actionLabel={tCommon("table.columns.actions")}
        />
      </FireAuditMasterChrome>
    </PageContainer>
  );
}
