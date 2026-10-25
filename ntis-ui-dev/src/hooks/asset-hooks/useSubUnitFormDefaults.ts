/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from 'react';

/** When departments list loads asynchronously: if formData.departmentId is
 * still empty, seed it from the unit or global parent form data. Also
 * resolves the label name. */
export function useSubUnitDepartmentDefault(
  departments: any[],
  formData: any,
  unit: any,
  globalFormData: any,
  setFormData: React.Dispatch<React.SetStateAction<any>>
) {
  useEffect(() => {
    if (departments.length === 0) return; // options not loaded yet
    const targetId = String(
      formData.departmentId ||
        unit.departmentId ||
        globalFormData?.departmentId ||
        globalFormData?.owningDepartmentId ||
        ''
    );
    if (!targetId) return; // nothing to default
    const matched = departments.find((d: any) => String(d.value) === targetId);
    setFormData((prev: any) => ({
      ...prev,
      departmentId: targetId,
      departmentName: matched
        ? matched.label
        : prev.departmentName && isNaN(Number(prev.departmentName))
          ? prev.departmentName
          : '',
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departments.length]);
}

/** Enriches floor details for floorId if present, but never auto-selects first value. */
export function useSubUnitDropdownAutoSelect(
  dropdownOptions: any,
  parentFloors: any[],
  formData: any,
  setFormData: React.Dispatch<React.SetStateAction<any>>
) {
  useEffect(() => {
    if (!dropdownOptions || !formData.floorId) return;
    setFormData((prev: any) => {
      if (!prev.floorId) return prev;
      const matched = parentFloors.find(
        (f: any) =>
          Number(f.floorId || f.floor) === Number(prev.floorId)
      );
      if (matched && !prev.floorDetailsId) {
        return {
          ...prev,
          floorDetailsId: matched.id,
          conYear: prev.conYear || matched.constructionYear || matched.conYear || '',
          asstYear: prev.asstYear || matched.assessmentYear || matched.asstYear || '',
          conType: prev.conType || matched.constructionTypeId || matched.conType || '',
          useType: prev.useType || matched.typeOfUseId || matched.useType || '',
          subUseType: prev.subUseType || '',
        };
      }
      return prev;
    });
  }, [dropdownOptions, parentFloors, formData.floorId, setFormData]);
}
