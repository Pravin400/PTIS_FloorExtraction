"use client";

import { PageContainer } from "@/components/common/PageContainer";
import TableHeader from "@/components/common/TableHeader";
import { MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { MoujaMasterHeaderExtra } from "@/components/modules/property-tax/mouja-master/MoujaMasterHeader";
import { Suspense, useMemo } from "react";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

export default function MoujaMasterLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("mouja.moujaMaster");
  const moujaLabel = useAliasLabel("Mouja", t("aliasFallback.entity"));
  const values = useMemo(() => ({ mouja: moujaLabel, entity: moujaLabel }), [moujaLabel]);

  return (
    <PageContainer>
      <div className="mb-2">
        <TableHeader
          title={t("list.title", values)}
          icon={MapPin}
          subtitle={t("list.subtitle", values)}
          rightContent={
            <Suspense fallback={null}>
              <MoujaMasterHeaderExtra />
            </Suspense>
          }
        />
      </div>
      <div className="">
        {children}
      </div>
    </PageContainer>
  );
}
