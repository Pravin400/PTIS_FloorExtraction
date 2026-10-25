import { IndianRupee } from "lucide-react";
import { Input, SearchSelect, Card, CardContent, CardHeader, CardTitle } from "@/components/common";
import { SubUnitRentSectionProps } from "@/types/asset/sub-units.types";
import { withSelectPlaceholder } from "@/lib/utils/asset-utils/new-add-new-asset/dropdown-placeholder.utils";

export function SubUnitRentSection({ formData, setFormData, errors, handleChange, selectOnFocus, t, inpClass }: SubUnitRentSectionProps) {
  return (
    <Card variant="bordered" padding="sm" className="shadow-sm border-slate-200/80 bg-white rounded-2xl">
      <CardHeader className="flex items-center gap-2 bg-gradient-to-r from-[#C8E1FC] via-[#DBEAFF] to-[#EDF5FF] border border-[#A3CBFA] rounded-xl py-1 px-2.5 mb-2.5 shadow-sm">
        <div className="bg-[#1d4ed8] p-1 rounded-lg text-white shadow-sm flex items-center justify-center shrink-0">
          <IndianRupee className="size-3.5 text-white" />
        </div>
        <CardTitle className="text-xs font-bold text-[#1d4ed8] uppercase tracking-widest">{t("subunit.sections.rentInfo")}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-2 items-start">
        <SearchSelect
          label={t("subunit.fields.rentType")}
          name="rentType"
          value={formData.rentType || ""}
          onChange={(_name, val) => setFormData((prev: Record<string, unknown>) => ({ ...prev, rentType: val }))}
          options={withSelectPlaceholder([
            { label: t("subunit.fields.rentTypeOptions.rent", "Rent"), value: "Rent" },
            { label: t("subunit.fields.rentTypeOptions.lease", "Lease"), value: "Lease" },
            { label: t("subunit.fields.rentTypeOptions.license", "License Fee"), value: "License Fee" },
            { label: t("subunit.fields.rentTypeOptions.deposit", "Deposit"), value: "Deposit" },
          ])}
          placeholder="--Select--"
        />
        <Input
          label={t("subunit.fields.rentAgreementNo")}
          name="rentAgreementNo"
          value={formData.rentAgreementNo || ""}
          onChange={handleChange}
          className={inpClass}
        />
        <Input
          label={t("subunit.fields.rentPayerName")}
          name="rentPayerName"
          value={formData.rentPayerName || ""}
          onChange={handleChange}
          className={inpClass}
        />
        <Input
          label={t("subunit.fields.rentPayerContact")}
          name="rentPayerContact"
          value={formData.rentPayerContact || ""}
          onChange={handleChange}
          className={inpClass}
        />
        <Input
          label={t("subunit.fields.rentPayerAddress")}
          name="rentPayerAddress"
          value={formData.rentPayerAddress || ""}
          onChange={handleChange}
          className={inpClass}
        />
        <Input
          label={t("subunit.fields.rentStartDate")}
          name="rentStartDate"
          type="date"
          value={formData.rentStartDate || ""}
          onChange={handleChange}
          className={inpClass}
        />
        <Input
          label={t("subunit.fields.rentEndDate")}
          name="rentEndDate"
          type="date"
          value={formData.rentEndDate || ""}
          onChange={handleChange}
          className={inpClass}
        />
        <Input
          label={t("subunit.fields.calculatedRentRate")}
          name="calculatedRentRate"
          value={formData.calculatedRentRate || ""}
          readOnly
          className={`${inpClass} bg-slate-100 text-slate-500 italic`}
        />
        <SearchSelect
          label={t("subunit.fields.rentFrequency")}
          name="rentFreq"
          value={formData.rentFreq || ""}
          onChange={(_name, val) => setFormData((prev: Record<string, unknown>) => ({ ...prev, rentFreq: val }))}
          options={withSelectPlaceholder([
            { label: t("subunit.fields.rentFreqOptions.monthly", "Monthly"), value: "Monthly" },
            { label: t("subunit.fields.rentFreqOptions.yearly", "Yearly"), value: "Yearly" },
          ])}
          placeholder="--Select--"
        />
        <Input
          label={`${t("subunit.fields.rentAmount")}${formData.rentType ? " *" : ""}`}
          name="rentAmount"
          error={errors?.rentAmount}
          onFocus={selectOnFocus}
          value={String(formData.rentAmount || "")}
          onChange={handleChange}
          className={`${inpClass} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
        />
        <Input
          label={t("subunit.fields.securityDeposit")}
          name="securityDeposit"
          type="number"
          onFocus={selectOnFocus}
          min={0}
          value={formData.securityDeposit || ""}
          onChange={handleChange}
          className={`${inpClass} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
        />
        <SearchSelect
          label={t("subunit.fields.depositType")}
          name="depositType"
          value={formData.depositType || ""}
          onChange={(_name, val) => setFormData((prev: Record<string, unknown>) => ({ ...prev, depositType: val }))}
          options={withSelectPlaceholder([
            { label: t("subunit.fields.depositTypeOptions.refundable", "Refundable"), value: "Refundable" },
            { label: t("subunit.fields.depositTypeOptions.nonRefundable", "Non-Refundable"), value: "Non-Refundable" }
          ])}
          placeholder="--Select--"
        />
      </CardContent>
    </Card>
  );
}
