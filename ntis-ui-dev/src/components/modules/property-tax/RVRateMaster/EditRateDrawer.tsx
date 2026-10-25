"use client";

import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Building2 } from "lucide-react";
import { Drawer } from "@/components/common/Drawer";
import RateMasterForm from "./RateMasterForm";
import { EditRateDrawerProps } from "@/types/RVRateMaster";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

export default function EditRateDrawer({
  id,
  zones,
  useGroups,
  assessmentYears,
  assessmentYearRanges,
  zoneDescriptions,
  allZones,
  rateCategories,
  editData,
  bulkEditData,
  backendRates,
  filterValues,
  mode = "edit",
  paginatedZonesData,
  rateFrequencyPolicy,
  rateUnitPolicy,
  isOpenPlot = false,
}: EditRateDrawerProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("ptis_RVRateMaster");
  const zoneLabel = useAliasLabel("Zone", t("aliasFallback.zone"));
  const useLabel = useAliasLabel("Use", t("aliasFallback.use"));

  const handleClose = () => {
    const routePrefix = isOpenPlot ? 'openplot' : 'rvratemaster';
    router.push(`/${locale}/property-tax/rate-master/${routePrefix}`);
  };

  const title = mode === "delete" ? t("messages.deleteRateConfiguration") : t("messages.editRateDetails");
  const description = mode === "delete" 
    ? t("messages.deleteRateDetails", { zone: zoneLabel, use: useLabel })
    : t("messages.updateRateDetails", { zone: zoneLabel, use: useLabel });

  // Create a unique key based on filter values and backend data to force re-mount when filters change
  // This ensures the form state is reset and new data is properly loaded
  const firstRateId = backendRates?.[0]?.id || 'none';
  const formKey = `${filterValues?.zone || ''}_${filterValues?.useGroup || ''}_${filterValues?.year || ''}_${backendRates?.length || 0}_${firstRateId}`;

  return (
    <Drawer
      open={true}
      onClose={handleClose}
      title={
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md text-white">
            <Building2 size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-blue-900">
              {title}
            </h1>
            <p className="text-xs text-slate-500">
              {description}
            </p>
          </div>
        </div>
      }
      description={description}
      width="xl"
    >
      <RateMasterForm
        key={formKey}
        id={id}
        zoneOptions={zones}
        useGroupOptions={useGroups}
        assessmentYears={assessmentYears}
        assessmentYearRanges={assessmentYearRanges ?? []}
        zoneDescriptions={zoneDescriptions}
        allZones={allZones}
        rateCategories={rateCategories}
        editData={editData}
        bulkEditData={bulkEditData}
        backendRates={backendRates}
        filterValues={filterValues ? { ...filterValues, year: filterValues.year ?? "", useGroup: isOpenPlot ? "ALL" : (filterValues.useGroup ?? "") } : undefined}
        onClose={handleClose}
        mode={mode}
        paginatedZonesData={paginatedZonesData}
        rateFrequencyPolicy={rateFrequencyPolicy}
        rateUnitPolicy={rateUnitPolicy}
        isOpenPlot={isOpenPlot}
      />
    </Drawer>
  );
}
