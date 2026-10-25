"use client";

import { CalendarRange } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";
import TableHeader from "@/components/common/TableHeader";
import { AssessmentYearRangeToolbar } from "./AssessmentYearRangeToolbar";
import { useAssessmentYearRangeError } from "./AssessmentYearRangeErrorContext";

interface AssessmentYearRangeLayoutContentProps {
  children: React.ReactNode;
}

export function AssessmentYearRangeLayoutContent({
  children,
}: AssessmentYearRangeLayoutContentProps) {
  const pathname = usePathname();
  const tRV = useTranslations("assessmentYearRange.rateableValue");
  const tCV = useTranslations("assessmentYearRange.capitalValue");
  const { hasError } = useAssessmentYearRangeError();

  // Detect active tab from pathname
  const isCapitalValue = pathname.includes("/capitalvalue");
  const t = isCapitalValue ? tCV : tRV;

  const assessmentLabel = useAliasLabel("Assessment", t("aliasFallback.entity"));
  const values = { assessment: assessmentLabel, entity: assessmentLabel };

  return (
    <div className="">
      {!hasError && (
        <TableHeader
          title={t("list.title", values)}
          subtitle={t("list.subtitle", values)}
          icon={CalendarRange}
          rightContent={<AssessmentYearRangeToolbar />}
        />
      )}

      <div className={hasError ? "" : "pt-6"}>
        {children}
      </div>
    </div>
  );
}
