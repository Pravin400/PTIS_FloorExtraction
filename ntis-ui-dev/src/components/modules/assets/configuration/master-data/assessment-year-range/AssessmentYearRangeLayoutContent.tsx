"use client";

import type React from "react";
import { CalendarRange } from "lucide-react";
import { useTranslations } from "next-intl";
import TableHeader from "@/components/common/TableHeader";
import { AssessmentYearRangeToolbar } from "./AssessmentYearRangeToolbar";
import { useAssessmentYearRangeError } from "./AssessmentYearRangeErrorContext";

interface AssessmentYearRangeLayoutContentProps {
  children: React.ReactNode;
}

export function AssessmentYearRangeLayoutContent({
  children,
}: AssessmentYearRangeLayoutContentProps) {
  const tCV = useTranslations("assetAssessmentYearRange.capitalValue");
  const { hasError } = useAssessmentYearRangeError();

  return (
    <div className="">
      {!hasError && (
        <TableHeader
          title={tCV("list.title")}
          subtitle={tCV("list.subtitle")}
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

