"use client";

import { useCallback, useState } from "react";
import { useRouter, usePathname, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Drawer } from "@/components/common/Drawer";
import { SearchInput } from "@/components/common/SearchInput";
import { SearchButton, ExportButton } from "@/components/common/ActionButtons";
import WardAbstractDrawer from "./WardAbstractDrawer";
import { WardZoningAbstractRow } from "@/types/taxZoningRange.types";
import { downloadTaxZoningExport } from "@/lib/api/taxZoningRange/taxZoningRange-export.client";
import { ALPHANUMERIC_WITH_SPACES_SANITIZE } from "@/lib/utils/validation-rules";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

interface WrapperProps {
  data: WardZoningAbstractRow[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  searchTerm: string;
  zoneLabels: string[];
  ulbName: string;
  overallTotalProperties: number;
  overallCoveredProperties: number;
  overallPendingProperties: number;
  overallCoveragePercent: number;
}

export default function WardAbstractDrawerWrapper({
  data,
  pageNumber,
  pageSize,
  totalCount,
  totalPages,
  searchTerm,
  zoneLabels,
  ulbName,
  overallTotalProperties,
  overallCoveredProperties,
  overallPendingProperties,
  overallCoveragePercent,
}: WrapperProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const locale = String(params?.locale || "en");
  const basePath = `/${locale}/property-tax/taxzoningmaster`;
  const tUi = useTranslations("taxZoningRange.ui.wardAbstract");
  const tRoot = useTranslations("taxZoningRange");
  const wardLabel = useAliasLabel("Ward", tRoot("aliasFallback.ward"));
  const taxZoneLabel = useAliasLabel("Tax Zone", tRoot("aliasFallback.taxZone"));
  const [localSearch, setLocalSearch] = useState(searchTerm);

  const buildUrl = useCallback(
    (page: number, size: number, search: string) => {
      const params = new URLSearchParams({ pageNumber: String(page), pageSize: String(size) });
      if (search) params.set("search", search);
      return `${pathname}?${params}`;
    },
    [pathname]
  );

  const handleSearch = useCallback(() => {
    router.push(buildUrl(1, pageSize, localSearch));
  }, [router, buildUrl, pageSize, localSearch]);

  const handleSearchChange = useCallback(
    (value: string) => {
      const sanitized = value.replace(ALPHANUMERIC_WITH_SPACES_SANITIZE, "");
      setLocalSearch(sanitized);
      if (!sanitized) router.push(buildUrl(1, pageSize, ""));
    },
    [router, buildUrl, pageSize]
  );

  const exportParams = localSearch ? { SearchTerm: localSearch } : undefined;

  return (
    <Drawer
      open={true}
      onClose={() => router.push(basePath)}
      title={<span className="text-[17px] font-bold text-[#0b2f5b]">{tUi("title", { ward: wardLabel, taxZone: taxZoneLabel })}</span>}
      headerActions={
        <div className="flex items-center gap-2">
          <ExportButton
            label={tUi("exportExcelBtn")}
            size="sm"
            onClick={() => downloadTaxZoningExport("ward-abstract-excel", { ...exportParams, ulbName })}
          />
        </div>
      }
      width="lg"
    >
      <WardAbstractDrawer
        data={data}
        pageNumber={pageNumber}
        pageSize={pageSize}
        totalCount={totalCount}
        totalPages={totalPages}
        zoneLabels={zoneLabels}
        ulbName={ulbName}
        onPageChange={(p) => router.push(buildUrl(p, pageSize, localSearch))}
        onPageSizeChange={(s) => router.push(buildUrl(1, s, localSearch))}
        overallTotalProperties={overallTotalProperties}
        overallCoveredProperties={overallCoveredProperties}
        overallPendingProperties={overallPendingProperties}
        overallCoveragePercent={overallCoveragePercent}
        searchInput={
          <div className="flex items-center gap-2">
            <SearchInput
              value={localSearch}
              onChange={handleSearchChange}
              onEnter={handleSearch}
              placeholder={tUi("searchPlaceholder")}
              className="mb-0 w-auto flex-1"
            />
            <SearchButton size="sm" onClick={handleSearch} />
          </div>
        }
      />
    </Drawer>
  );
}
