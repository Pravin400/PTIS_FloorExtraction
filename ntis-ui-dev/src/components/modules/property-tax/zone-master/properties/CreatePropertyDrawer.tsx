"use client";

import { Building2 } from "lucide-react";
import { Drawer } from "@/components/common/Drawer";
import { CancelButton, SaveButton } from "@/components/common";
import { CreatePropertyDrawerProps } from "@/types/zone-master/properties/create-property-drawer.types";
import { useCreatePropertyForm } from "@/hooks/zoneMaster/useCreatePropertyForm";
import { useCreatePropertySubmit } from "@/hooks/zoneMaster/useCreatePropertySubmit";
import { PropertyFormFields } from "./components/PropertyFormFields";
import { BulkCreateSection } from "./components/BulkCreateSection";

import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

export default function CreatePropertyDrawer({
  isOpen,
  selectedWard,
  propertyTypes,
  propertyCategories,
  taxZones,
  nextPropertyNumber,
  onClose,
  onSuccess,
}: CreatePropertyDrawerProps) {
  // Use custom hooks
  const {
    formData,
    errors,
    isPending,
    startTransition,
    propertyTypeOptions,
    categoryOptions,
    taxZoneOptions,
    handleFieldChange,
    handleBulkToggle,
    bulkPropertyCount,
    validateForm,
    resetForm,
    t,
    tCommon,
  } = useCreatePropertyForm({
    isOpen,
    nextPropertyNumber,
    propertyTypes,
    propertyCategories,
    taxZones,
  });

  const wardAlias = useAliasLabel("Ward", t("defaults.ward"));

  const { handleSubmit, handleClose } = useCreatePropertySubmit({
    formData,
    selectedWard,
    validateForm,
    resetForm,
    onSuccess,
    onClose,
    startTransition,
    t,
  });

  if (!isOpen) return null;

  return (
    <Drawer
      open={isOpen}
      onClose={handleClose}
      width="md"
      title={
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md text-white">
            <Building2 size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-blue-900">
              {t("createProperty.title")}
            </h1>
            <p className="text-xs text-slate-500">
              {t("createProperty.subtitle", { ward: wardAlias })}
            </p>
          </div>
        </div>
      }
      footer={
        <>
          <CancelButton onClick={handleClose} disabled={isPending} label={tCommon("buttons.cancel")} />
          <SaveButton onClick={handleSubmit} isLoading={isPending} disabled={isPending || !selectedWard} label={tCommon("buttons.save")} />
        </>
      }
    >
      <div className="p-6 space-y-6">
        <PropertyFormFields
          selectedWard={selectedWard}
          formData={formData}
          errors={errors}
          propertyTypeOptions={propertyTypeOptions}
          categoryOptions={categoryOptions}
          taxZoneOptions={taxZoneOptions}
          handleFieldChange={handleFieldChange}
          t={t}
          wardAlias={wardAlias}
        />

        <BulkCreateSection
          formData={formData}
          errors={errors}
          bulkPropertyCount={bulkPropertyCount}
          categoryOptions={categoryOptions}
          handleFieldChange={handleFieldChange}
          handleBulkToggle={handleBulkToggle}
          t={t}
        />
      </div>
    </Drawer>
  );
}
