import React from "react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { GisKpiMaster } from "@/components/modules/configuration-settings/gis-master/gis-kpi-master";
import {
  fetchGisKpiPagedServerAction,
  fetchGisDepartmentKpiMappingsAction,
  fetchAvailableDepartmentsAction,
} from "./action";
import type { GisKpiMaster as GisKpiMasterType } from "@/types/gis-master/gis-kpi-master.types";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    q?: string;
    sortBy?: string;
    sortOrder?: string;
    departmentId?: string;
  }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "gisKpiMaster" });
  return {
    title: `${t("list.title")} | NTIS`,
    description: t("list.subtitle"),
  };
}

const ALLOWED_SORT_COLUMNS = ["kpiCode", "defaultTitle"] as const;
const ALLOWED_SORT_ORDERS = ["asc", "desc"] as const;

const MIN_PAGE = 1;
const MAX_PAGE = 10_000;
const MIN_PAGE_SIZE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

function sanitizeParams(raw: Awaited<PageProps["searchParams"]>) {
  const rawPage = parseInt(raw.page ?? "", 10);
  const pageNumber = Number.isFinite(rawPage)
    ? Math.min(Math.max(rawPage, MIN_PAGE), MAX_PAGE)
    : MIN_PAGE;

  const rawPageSize = parseInt(raw.pageSize ?? "", 10);
  const pageSize = Number.isFinite(rawPageSize)
    ? Math.min(Math.max(rawPageSize, MIN_PAGE_SIZE), MAX_PAGE_SIZE)
    : DEFAULT_PAGE_SIZE;

  const searchTerm = raw.q?.trim() || undefined;

  const sortByRaw = raw.sortBy?.trim() ?? "";
  const sortBy = (ALLOWED_SORT_COLUMNS as readonly string[]).includes(sortByRaw)
    ? (sortByRaw as (typeof ALLOWED_SORT_COLUMNS)[number])
    : undefined;

  const sortOrderRaw = raw.sortOrder?.trim().toLowerCase() ?? "";
  const sortOrder = (ALLOWED_SORT_ORDERS as readonly string[]).includes(sortOrderRaw)
    ? (sortOrderRaw as (typeof ALLOWED_SORT_ORDERS)[number])
    : undefined;

  const rawDept = raw.departmentId?.trim();
  const departmentId =
    rawDept && rawDept !== "all" && !isNaN(Number(rawDept))
      ? Number(rawDept)
      : undefined;

  return { pageNumber, pageSize, searchTerm, sortBy, sortOrder, departmentId };
}

export default async function Page({ params, searchParams }: PageProps): Promise<React.ReactElement> {
  const { locale } = await params;
  setRequestLocale(locale);

  const searchParamValues = await searchParams;
  const { pageNumber, pageSize, searchTerm, sortBy, sortOrder, departmentId } = sanitizeParams(searchParamValues);

  // Parallel fetch available departments and all mappings
  const [departments, allDepartmentMappings] = await Promise.all([
    fetchAvailableDepartmentsAction(),
    fetchGisDepartmentKpiMappingsAction(),
  ]);

  // When a specific department is selected, filter by department mappings
  if (departmentId !== undefined) {
    // Calls GET /api/GisDepartmentKpiMapping?DepartmentId={departmentId}
    const [deptSpecificMappings, allKpisResult] = await Promise.all([
      fetchGisDepartmentKpiMappingsAction(departmentId),
      fetchGisKpiPagedServerAction(1, 100),
    ]);

    const allMasterKpis = allKpisResult.items;

    // Collect distinct KPIs mapped to this department
    const uniqueKpiIds = new Set<number>();
    const matchingItems: GisKpiMasterType[] = [];

    deptSpecificMappings.forEach((m) => {
      if (m.isActive === false) return;

      const kId = Number(m.kpiMasterId);
      if (uniqueKpiIds.has(kId)) return;

      const master = allMasterKpis.find(
        (k) =>
          Number(k.id) === kId ||
          (Boolean(k.kpiCode) &&
            Boolean(m.kpiCode) &&
            k.kpiCode.toLowerCase() === m.kpiCode?.toLowerCase())
      );

      if (master && master.isActive === false) return;

      uniqueKpiIds.add(kId);

      matchingItems.push({
        id: kId || master?.id || m.id,
        kpiCode: master?.kpiCode || m.kpiCode || "",
        defaultTitle: master?.defaultTitle || m.defaultTitle || m.customTitle || "",
        defaultIcon: master?.defaultIcon || m.customIcon || "",
        defaultColor: master?.defaultColor || m.customColor || "#2563EB",
        isActive: true,
        createdDate: master?.createdDate || m.createdDate || "",
        updatedDate: master?.updatedDate || m.updatedDate || null,
        mappedDepartments: allDepartmentMappings.filter((dm) => {
          const idMatches = Number(dm.kpiMasterId) === kId;
          const codeMatches =
            Boolean(dm.kpiCode) &&
            Boolean(m.kpiCode) &&
            String(dm.kpiCode).trim().toLowerCase() === String(m.kpiCode).trim().toLowerCase();
          return (idMatches || codeMatches) && dm.isActive !== false;
        }),
      });
    });

    // Apply search filter if present
    let filtered = matchingItems;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.kpiCode?.toLowerCase().includes(term) ||
          item.defaultTitle?.toLowerCase().includes(term)
      );
    }

    // Apply sort if present
    if (sortBy) {
      filtered.sort((a, b) => {
        const valA = (sortBy === "kpiCode" ? a.kpiCode : a.defaultTitle) || "";
        const valB = (sortBy === "kpiCode" ? b.kpiCode : b.defaultTitle) || "";
        const cmp = valA.localeCompare(valB);
        return sortOrder === "desc" ? -cmp : cmp;
      });
    }

    const totalCount = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const paginatedItems = filtered.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);

    return (
      <GisKpiMaster
        data={paginatedItems}
        departmentMappings={allDepartmentMappings}
        departments={departments}
        selectedDepartmentId={String(departmentId)}
        pageNumber={pageNumber}
        pageSize={pageSize}
        totalCount={totalCount}
        totalPages={totalPages}
        sortBy={sortBy}
        sortOrder={sortOrder}
      />
    );
  }

  // All departments view: standard paginated fetch of KPI masters
  const result = await fetchGisKpiPagedServerAction(
    pageNumber,
    pageSize,
    searchTerm,
    sortBy,
    sortOrder
  );

  const enrichedItems = result.items.map((item) => ({
    ...item,
    mappedDepartments: allDepartmentMappings.filter((m) => {
      const idMatches = Number(m.kpiMasterId) === Number(item.id);
      const codeMatches =
        Boolean(m.kpiCode) &&
        Boolean(item.kpiCode) &&
        String(m.kpiCode).trim().toLowerCase() === String(item.kpiCode).trim().toLowerCase();
      return (idMatches || codeMatches) && m.isActive !== false;
    }),
  }));

  return (
    <GisKpiMaster
      data={enrichedItems}
      departmentMappings={allDepartmentMappings}
      departments={departments}
      selectedDepartmentId={undefined}
      pageNumber={result.pageNumber || pageNumber}
      pageSize={result.pageSize || pageSize}
      totalCount={result.totalCount}
      totalPages={
        result.totalPages ||
        Math.max(1, Math.ceil(result.totalCount / (result.pageSize || pageSize)))
      }
      sortBy={sortBy}
      sortOrder={sortOrder}
    />
  );
}