"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { FileEdit, ListChecks, MapPinned } from "lucide-react";
import { PageContainer, TableHeader } from "@/components/common";

export function ExtendedAreaAssessmentLanding() {
  const t = useTranslations("extendedAreaAssessment.landing");
  const locale = useLocale();

  const cards = [
    {
      href: `/${locale}/property-tax/extended-area-assesment/single-assessment`,
      icon: FileEdit,
      title: t("singleTitle"),
      description: t("singleDescription"),
    },
    {
      href: `/${locale}/property-tax/extended-area-assesment/bulk-update`,
      icon: ListChecks,
      title: t("bulkTitle"),
      description: t("bulkDescription"),
    },
  ];

  return (
    <PageContainer className="p-4 sm:p-6">
      <div className="space-y-4">
        <TableHeader title={t("title")} subtitle={t("subtitle")} icon={MapPinned} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-cyan-300 hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
                <card.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-cyan-700">{card.title}</h3>
                <p className="mt-1 text-xs text-slate-500">{card.description}</p>
              </div>
              <span className="mt-auto text-xs font-semibold text-cyan-700">{t("open")} →</span>
            </Link>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
