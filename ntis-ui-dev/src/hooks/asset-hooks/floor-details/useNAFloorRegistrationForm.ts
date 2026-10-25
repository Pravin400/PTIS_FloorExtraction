/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { blankFloorFormState } from '@/lib/utils/asset-utils/new-add-new-asset/floor-details/floor-registration-utils';
import { fetchSubFloorAction, fetchSubUseTypesAction } from '@/app/[locale]/assets/municipal-Asset/new-add-new-asset/floor-details/actions';

// NA = NewAddNewAsset copy of useFloorRegistrationForm
export function useNAFloorRegistrationForm(
  _dropdownOptions: any,
  initialSubUseTypeMap: Record<string, any[]> = {},
  initialSubFloorOptions: any[] = [],
  initialSubUseTypeOptions: any[] = []
) {
  const [subFloorOptions, setSubFloorOptions] = useState<any[]>(initialSubFloorOptions);
  const [subUseTypeOptions, setSubUseTypeOptions] = useState<any[]>(initialSubUseTypeOptions);
  const [subUseTypeMap, setSubUseTypeMap] = useState<Record<string, any[]>>(initialSubUseTypeMap);
  const [formState, setFormState] = useState<any>(() => blankFloorFormState());
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    setTimeout(() => { setSubUseTypeMap(initialSubUseTypeMap); }, 0);
  }, [initialSubUseTypeMap]);

  // Load sub-floor options client-side when floor selection changes
  useEffect(() => {
    if (!formState.floor) {
      setTimeout(() => { setSubFloorOptions([]); }, 0);
      return;
    }
    let cancelled = false;
    const floorId = Number(formState.floor);
    if (!isNaN(floorId)) {
      fetchSubFloorAction(floorId).then((res) => {
        if (cancelled) return;
        const data = res.data;
        if (res.success && Array.isArray(data)) {
          setTimeout(() => { setSubFloorOptions(data); }, 0);
          setFormState((prev: any) => {
            const hasCurrent = data.some((o: any) => String(o.value) === String(prev.subFloor));
            if (prev.subFloor && hasCurrent) {
              return prev;
            }
            return { ...prev, subFloor: '' };
          });
        } else {
          setTimeout(() => { setSubFloorOptions([]); }, 0);
        }
      });
    }
    return () => {
      cancelled = true;
    };
  }, [formState.floor]);

  // Load sub-use-type options client-side when use-type selection changes
  useEffect(() => {
    if (!formState.useType) {
      setTimeout(() => { setSubUseTypeOptions([]); }, 0);
      return;
    }
    let cancelled = false;
    const useTypeId = Number(formState.useType);
    if (!isNaN(useTypeId)) {
      fetchSubUseTypesAction(useTypeId).then((res) => {
        if (cancelled) return;
        const data = res.data;
        if (res.success && Array.isArray(data)) {
          setTimeout(() => { setSubUseTypeOptions(data); }, 0);
          setFormState((prev: any) => {
            if (data.length > 0) {
              const hasCurrent = data.some((o: any) => String(o.value) === String(prev.subUseType));
              if (prev.subUseType && hasCurrent) {
                return prev;
              }
              return { ...prev, subUseType: '' };
            }
            return prev.subUseType ? { ...prev, subUseType: '' } : prev;
          });
        } else {
          setTimeout(() => { setSubUseTypeOptions([]); }, 0);
        }
      });
    }
    return () => {
      cancelled = true;
    };
  }, [formState.useType]);

  const [isDuplicateFloorMode, setIsDuplicateFloorMode] = useState<boolean>(false);
  const [sourceFloor, setSourceFloor] = useState<any | null>(null);

  return {
    subFloorOptions,
    subUseTypeOptions,
    subUseTypeMap,
    formState,
    setFormState,
    editingId,
    setEditingId,
    isDuplicateFloorMode,
    setIsDuplicateFloorMode,
    sourceFloor,
    setSourceFloor,
  };
}
