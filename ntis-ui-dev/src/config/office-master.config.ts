/**
 * Configuration and constants for Office Master module
 */

export const OFFICE_TYPE_OPTIONS = [
  { label: "Main Office", value: "Main Office", translationKey: "form.fields.type.options.mainOffice" },
  { label: "Zonal Office", value: "Zonal Office", translationKey: "form.fields.type.options.zonalOffice" },
  { label: "Department Office", value: "Department Office", translationKey: "form.fields.type.options.departmentOffice" },
  { label: "Ward Office", value: "Ward Office", translationKey: "form.fields.type.options.wardOffice" },
  { label: "Sub Office", value: "Sub Office", translationKey: "form.fields.type.options.subOffice" },
  { label: "Head Office", value: "Head Office", translationKey: "form.fields.type.options.headOffice" },
  { label: "Regional Office", value: "Regional Office", translationKey: "form.fields.type.options.regionalOffice" },
  { label: "Branch Office", value: "Branch Office", translationKey: "form.fields.type.options.branchOffice" },
];

/**
 * Helper to get translated office type options
 * @param t - Translation function from office namespace
 */
export const getOfficeTypeOptions = (t: (key: string) => string) => {
  return OFFICE_TYPE_OPTIONS.map(opt => ({
    label: t(opt.translationKey) || opt.label,
    value: opt.value
  }));
};
