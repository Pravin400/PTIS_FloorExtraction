"use client"
import { useOldTaxationForm } from "@/hooks/ptis/QuickDataEntry/Olddetails/useOldTaxationForm";
import { ReceiptText } from "lucide-react";

// Import refactored components
import { PropertyDetailsFields } from "./components/PropertyDetailsFields";
import { AreaDetailsFields } from "./components/AreaDetailsFields";
import { TaxDetailsFields } from "./components/TaxDetailsFields";
import { OldTaxationFormProps } from "@/types/OldDetails/property-old-floor-info.types";
import { UpdateButton } from "@/components/common/ActionButtons";

/**
 * OldTaxationForm - Main Component
 * Orchestrates old taxation data entry and management
 * Delegates field groups to focused sub-components for better maintainability
 */
export default function OldTaxationForm({
  propertyOldDetails = null,
}: OldTaxationFormProps) {

  const {
    formData,
    isSubmitting,
    showError,
    handleUpdate,
    handleInputChange,
    isChanged,
    isRequiredFieldsValid,
    t
  } = useOldTaxationForm(propertyOldDetails);

  // Type-safe wrapper for field changes
  const handleFieldChange = (field: string, value: string | number) => {
    handleInputChange(field as keyof typeof formData, value);
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4">
      <div className="bg-white rounded-xl border border-blue-100 shadow-xs p-5">
        <div className="-mx-5 mb-5 px-5 pb-3 border-b border-blue-100 flex items-center gap-2">
          <ReceiptText className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-blue-700">
            {t("oldDetails.title")}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3">
          {/* Property Identification Fields */}
          <PropertyDetailsFields
            t={t}
            formData={{
              oldZoneNo: formData.oldZoneNo,
              oldWardNo: formData.oldWardNo,
              oldPropertyNo: formData.oldPropertyNo,
              oldPartitionNo: formData.oldPartitionNo,
              oldEgovNo: formData.oldEgovNo
            }}
            showError={showError}
            onFieldChange={handleFieldChange}
          />

          {/* Area Fields */}
          <AreaDetailsFields
            t={t}
            formData={{
              oldPlotArea: formData.oldPlotArea,
              oldPlotNo: formData.oldPlotNo,
              oldConstructionArea: formData.oldConstructionArea
            }}
            showError={showError}
            onFieldChange={handleFieldChange}
          />

          {/* Tax Fields */}
          <TaxDetailsFields
            t={t}
            formData={{
              oldRV: formData.oldRV,
              oldALV: formData.oldALV,
              oldGeneralTax: formData.oldGeneralTax,
              oldTotalTax: String(formData.oldTotalTax)
            }}
            showError={showError}
            onFieldChange={handleFieldChange}
          />
        </div>

        <div className="mt-6 flex justify-end border-t border-gray-100 pt-4">
          <UpdateButton
            label={isSubmitting ? t('footer.saving') : t('commonbuttonmessages.UpdateChanges')}
            type="submit"
            onClick={handleUpdate}
            isLoading={isSubmitting}
            disabled={isSubmitting || !isChanged || !isRequiredFieldsValid}
          />
        </div>
      </div>
    </div>
  );
}
