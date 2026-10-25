import React from "react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { GisKpiForm } from "@/components/modules/configuration-settings/gis-master/gis-kpi-master";
import type { GisKpiMaster } from "@/types/gis-master/gis-kpi-master.types";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "gisKpiMaster" });
  return {
    title: `${t("form.addTitle")} | NTIS`,
    description: t("form.subtitle"),
  };
}

export default async function AddPage({ params }: PageProps): Promise<React.ReactElement> {
  const { locale } = await params;
  setRequestLocale(locale);

  const initialData: GisKpiMaster = {
    id: 0,
    kpiCode: "",
    defaultTitle: "",
    defaultIcon: "fa-building",
    defaultColor: "#2563EB",
    isActive: true,
    createdDate: new Date().toISOString(),
    updatedDate: null,
  };

  return <GisKpiForm id={null} initialData={initialData} />;
}
