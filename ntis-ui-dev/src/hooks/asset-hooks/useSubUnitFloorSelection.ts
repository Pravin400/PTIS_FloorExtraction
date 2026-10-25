/* eslint-disable @typescript-eslint/no-explicit-any */
import { useSubUnitMasterDataLoad } from './useSubUnitMasterDataLoad';
import { useSubUnitDepartmentDefault, useSubUnitDropdownAutoSelect } from './useSubUnitFormDefaults';
import { useSubUnitCascades } from './useSubUnitCascades';

export function useSubUnitFloorSelection(
  unit: any,
  globalFormData: any,
  propFloors: any[],
  propDropdownOptions: any,
  formData: any,
  setFormData: React.Dispatch<React.SetStateAction<any>>
) {
  const { loading, parentFloors, dropdownOptions } = useSubUnitMasterDataLoad(
    unit,
    globalFormData,
    propFloors,
    propDropdownOptions
  );

  const departments = dropdownOptions?.departments || [];

  useSubUnitDepartmentDefault(departments, formData, unit, globalFormData, setFormData);
  useSubUnitDropdownAutoSelect(dropdownOptions, parentFloors, formData, setFormData);

  const { dynamicSubUseTypes, subFloorOptions, loadSubFloorOptions, handleUseTypeSelect } =
    useSubUnitCascades(formData, setFormData);

  const getLabel = (opts: { label: string; value: string }[], val: string | number) => {
    if (!opts) return String(val);
    return opts.find((o) => o.value === String(val))?.label || String(val);
  };

  // When user selects a floor, we don't necessarily have all factors (unless it's in parentFloors).
  // But we allow manual entry anyway.
  const handleFloorSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const floorId = Number(e.target.value);
    const selected = parentFloors.find((f: any) => {
      const fLevelId = f.floorId || f.floor;
      if (!fLevelId) return false;
      // Numeric check
      if (Number(fLevelId) === floorId || Number(f.id) === floorId) return true;
      // String label matching (e.g. "Ground" matches "Ground Floor" which has value = 1)
      const match = (dropdownOptions?.floorLevels || []).find(
        (l: any) => String(l.value) === String(floorId)
      );
      if (match && typeof fLevelId === 'string') {
        return (
          match.label.toLowerCase().includes(fLevelId.toLowerCase()) ||
          fLevelId.toLowerCase().includes(match.label.toLowerCase())
        );
      }
      return false;
    });

    const floorLabel = selected
      ? `${getLabel(dropdownOptions?.floorLevels || [], selected.floorId || selected.floor)}`
      : getLabel(dropdownOptions?.floorLevels || [], floorId);

    setFormData((prev: any) => ({
      ...prev,
      floorId,
      floorDetailsId: selected?.id || floorId,
      floorName: floorLabel,
      floorLabel: floorLabel,
      subFloorId: prev.subFloorId || '',
      // Pre-fill construction values from selected floor but user can override
      conYear: prev.conYear || selected?.constructionYear || selected?.conYear || '',
      asstYear: prev.asstYear || selected?.assessmentYear || selected?.asstYear || '',
      conType: prev.conType || selected?.constructionTypeId || selected?.conType || '',
      useType: prev.useType || selected?.typeOfUseId || selected?.useType || '',
      subUseType: prev.subUseType || '',
      sdrr: selected?.baseValue || prev.sdrr || 100000,
      floorFactor: selected?.cvFloorFactor || selected?.floorFactor || prev.floorFactor || 1.0,
      ageFactor: selected?.cvAgeFactor || selected?.ageFactor || prev.ageFactor || 1.0,
    }));
    loadSubFloorOptions(floorId);
  };

  // Build floor options for dropdown from master data
  const floorSelectOptions = [
    { label: '— Select Floor —', value: '' },
    ...(dropdownOptions?.floorLevels || []).map((f: any) => ({
      label: f.label,
      value: String(f.value),
    })),
  ];

  return {
    loading,
    parentFloors,
    dropdownOptions,
    departments,
    dynamicSubUseTypes,
    subFloorOptions,
    floorSelectOptions,
    handleFloorSelect,
    handleUseTypeSelect,
  };
}
