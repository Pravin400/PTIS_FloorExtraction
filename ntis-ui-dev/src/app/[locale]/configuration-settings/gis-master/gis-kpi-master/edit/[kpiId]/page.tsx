import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { GisKpiForm } from "@/components/modules/configuration-settings/gis-master/gis-kpi-master";
import { getGisKpiByIdAction } from "../../action";
import type { GisKpiMaster } from "@/types/gis-master/gis-kpi-master.types";
import { ApiError } from "@/lib/utils/api";
import { logger } from "@/lib/utils/logger";

interface PageProps {
  params: Promise<{
    locale: string;
    kpiId: string;
  }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "gisKpiMaster" });
  return {
    title: `${t("form.editTitle")} | NTIS`,
    description: t("form.editSubtitle"),
  };
}

export default async function EditPage({ params }: PageProps): Promise<React.ReactElement> {
  const { locale, kpiId: kpiIdParam } = await params;
  setRequestLocale(locale);

  const kpiId = Number(kpiIdParam);
  if (!Number.isFinite(kpiId) || kpiId <= 0) {
    notFound();
  }

  let kpiData: GisKpiMaster;
  try {
    kpiData = await getGisKpiByIdAction(kpiId);
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) {
      notFound();
    }
    logger.error("Failed to fetch GIS KPI master", {
      error: error instanceof Error ? error : new Error(String(error)),
    });
    throw error;
  }

  return <GisKpiForm id={kpiId} initialData={kpiData} />;
}
