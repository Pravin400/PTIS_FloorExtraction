import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  getGisDepartmentKpiMappingByIdAction,
  getGisKpiByIdAction,
  fetchAvailableDepartmentsAction,
  fetchGisDepartmentKpiMappingsAction,
} from "../../../action";
import { GisDepartmentMappingEditDrawer } from "@/components/modules/configuration-settings/gis-master/gis-kpi-master";

interface PageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "gisKpiMaster" });
  return {
    title: `${t("mapping.editDrawerTitle")} | NTIS`,
    description: t("mapping.editDrawerSubtitle"),
  };
}

export default async function EditDepartmentMappingPage({
  params,
}: PageProps): Promise<React.ReactElement> {
  const { locale, id: idParam } = await params;
  setRequestLocale(locale);
  const mappingId = Number(idParam);

  if (!Number.isFinite(mappingId) || mappingId <= 0) {
    notFound();
  }

  const mapping = await getGisDepartmentKpiMappingByIdAction(mappingId);
  if (!mapping) {
    notFound();
  }

  // Fetch KPI data, available departments, and existing mappings in parallel on the server
  const [kpiData, departments, allMappings] = await Promise.all([
    getGisKpiByIdAction(mapping.kpiMasterId),
    fetchAvailableDepartmentsAction(),
    fetchGisDepartmentKpiMappingsAction(),
  ]);

  const existingForKpi = allMappings.filter(
    (m) => Number(m.kpiMasterId) === Number(mapping.kpiMasterId)
  );

  return (
    <GisDepartmentMappingEditDrawer
      open={true}
      kpi={kpiData}
      mapping={mapping}
      departments={departments}
      existingMappings={existingForKpi}
    />
  );
}
