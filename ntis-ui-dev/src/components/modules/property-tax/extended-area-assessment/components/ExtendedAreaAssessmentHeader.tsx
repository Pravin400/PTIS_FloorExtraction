"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Calculator, ListChecks } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TableHeader, type TabItem } from "@/components/common";

interface ExtendedAreaAssessmentHeaderProps {
  locale: string;
}

export function ExtendedAreaAssessmentHeader({ locale }: ExtendedAreaAssessmentHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const tSingle = useTranslations("extendedAreaAssessment.single");
  const tBulk = useTranslations("extendedAreaAssessment.bulk");
  const tLanding = useTranslations("extendedAreaAssessment.landing");

  const isBulk = pathname.includes("/bulk-update");
  const activeTab = isBulk ? "bulk" : "single";

  const title = isBulk ? tBulk("title") : tSingle("title");
  const subtitle = isBulk ? tBulk("subtitle") : tSingle("subtitle");
  const icon = isBulk ? ListChecks : Calculator;

  const base = `/${locale}/property-tax/extended-area-assesment`;

  const tabs: TabItem[] = [
    { value: "single", label: tLanding("singleTitle"), icon: Calculator, content: null },
    { value: "bulk", label: tLanding("bulkTitle"), icon: ListChecks, content: null },
  ];

  return (
    <TableHeader
      title={title}
      subtitle={subtitle}
      icon={icon}
      rightContent={
        <Tabs
          value={activeTab}
          variant="pills"
          size="sm"
          items={tabs}
          onChange={(v) => {
            if (v === "single") {
              router.push(`${base}/single-assessment`);
            } else {
              // Bulk Update is not finished yet — warn and stay put instead of navigating there.
              toast.warning(
                tLanding("bulkUnderDevelopment") ?? "This screen is not completed yet — it is under development."
              );
            }
          }}
        />
      }
    />
  );
}
