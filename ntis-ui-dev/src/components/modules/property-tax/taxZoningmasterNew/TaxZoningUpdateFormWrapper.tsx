"use client";

import { useCallback } from "react";
import { useRouter, usePathname, useSearchParams, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Drawer } from "@/components/common/Drawer";
import { ClearButton, SaveButton } from "@/components/common/ActionButtons";
import TaxZoningUpdateForm from "./TaxZoningUpdateForm";
import { useTaxZoningRangeForm, comparePropertyNo } from "@/hooks/taxZoningRange/useTaxZoningRange";
import { useTaxZoningRangeActions } from "@/hooks/taxZoningRange/useTaxZoningRangeActions";
import { PagedResponse } from "@/types/common.types";
import { TaxZone, TaxZoningRange, Ward } from "@/types/taxZoningRange.types";
import { SearchSelectOption } from "@/components/common/SearchSelect";


interface WrapperProps {
  id: string;
  wardsData: PagedResponse<Ward>;
  taxZones: PagedResponse<TaxZone>;
  initialRange: TaxZoningRange | null;
  propertyOptions: SearchSelectOption[];
}

export default function TaxZoningUpdateFormWrapper({ id, wardsData, taxZones, initialRange, propertyOptions }: WrapperProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeParams = useParams();
  const locale = String(routeParams?.locale || "en");
  const basePath = `/${locale}/property-tax/taxzoningmaster`;
  const t = useTranslations("taxZoningRange");
  const tUi = useTranslations("taxZoningRange.ui.form");
  const isEditMode = id !== "0";

  const {
    form,
    setWardIds,
    setTaxZoneId,
    setFromPropertyNo,
    setToPropertyNo,
    setZoneDescription,
    resetForm,
    submitted,
    setSubmitted,
    isMultiWard,
    isWardValid,
    isZoneValid,
    isDescriptionValid,
    isRangeValid,
    isFormValid,
  } = useTaxZoningRangeForm(initialRange);

  const { saving, handleSave } = useTaxZoningRangeActions(t);

  // When a single ward is selected, push wardId to URL so server refetches property list
  const handleWardChange = useCallback((ids: number[]) => {
    setWardIds(ids);
    const params = new URLSearchParams(searchParams.toString());
    if (ids.length === 1) {
      params.set("wardId", String(ids[0]));
    } else {
      params.delete("wardId");
    }
    router.replace(`${pathname}?${params.toString()}`);
  }, [setWardIds, searchParams, router, pathname]);

  // Clear toPropertyNo if fromPropertyNo moves past it
  const handleFromPropertyChange = useCallback((val: string) => {
    setFromPropertyNo(val);
    if (form.toPropertyNo && val && comparePropertyNo(val, form.toPropertyNo) > 0) {
      setToPropertyNo("");
    }
  }, [setFromPropertyNo, setToPropertyNo, form.toPropertyNo]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!isFormValid) return;
    handleSave(form, () => router.push(basePath));
  };

  const handleClear = () => {
    resetForm();
    const params = new URLSearchParams(searchParams.toString());
    params.delete("wardId");
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <Drawer
      open={true}
      onClose={() => router.push(basePath)}
      title={<span className="text-[17px] font-bold text-[#0b2f5b]">{isEditMode ? tUi("updateTitle") : tUi("addTitle")}</span>}
      width="sm"
      footer={
        <>
          <ClearButton label={tUi("resetFormBtn")} onClick={handleClear} type="button" />
          <SaveButton
            label={saving ? tUi("savingBtn") : tUi("saveBtn")}
            type="submit"
            form="tax-zoning-form"
            isLoading={saving}
            disabled={saving}
          />
        </>
      }
    >
      <TaxZoningUpdateForm
        wardsData={wardsData?.items || []}
        taxZones={taxZones?.items || []}
        selectedWards={form.wardIds}
        setSelectedWards={handleWardChange}
        propertyFrom={form.fromPropertyNo}
        setPropertyFrom={handleFromPropertyChange}
        propertyTo={form.toPropertyNo}
        setPropertyTo={setToPropertyNo}
        description={form.zoneDescription}
        setDescription={setZoneDescription}
        selectedZone={form.taxZoneId === "" ? "" : String(form.taxZoneId)}
        setSelectedZone={(val) => setTaxZoneId(val ? Number(val) : "")}
        propertyOptions={propertyOptions}
        isMultiWard={isMultiWard}
        isEditMode={isEditMode}
        submitted={submitted}
        isWardValid={isWardValid}
        isZoneValid={isZoneValid}
        isDescriptionValid={isDescriptionValid}
        isRangeValid={isRangeValid}
        onSubmit={handleSubmit}
      />
    </Drawer>
  );
}
