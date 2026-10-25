/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback, useEffect, useRef } from 'react';
import {
  fetchSubUseTypesAction,
  fetchSubFloorAction,
} from '@/app/[locale]/assets/municipal-Asset/new-add-new-asset/floor-details/actions';

export function useSubUnitCascades(formData: any, setFormData: React.Dispatch<React.SetStateAction<any>>) {
  const [dynamicSubUseTypes, setDynamicSubUseTypes] = useState<any[]>([]);
  const [subFloorOptions, setSubFloorOptions] = useState<any[]>([]);

  const loadSubUseTypes = useCallback(async (typeIdInput?: number | string) => {
    const typeId = typeIdInput ? Number(typeIdInput) : 0;
    if (!typeId) {
      setDynamicSubUseTypes([]);
      return;
    }
    const res = await fetchSubUseTypesAction(typeId);
    if (res.success && res.data) {
      const opts = res.data || [];
      setDynamicSubUseTypes(opts);
      setFormData((prev: any) => {
        if (opts.length > 0) {
          const hasCurrent = opts.some((o: any) => String(o.value) === String(prev.subUseType));
          if (prev.subUseType && hasCurrent) {
            return prev;
          }
          return { ...prev, subUseType: '' };
        }
        return prev.subUseType ? { ...prev, subUseType: '' } : prev;
      });
    }
  }, [setFormData]);

  const loadSubFloorOptions = useCallback(async (floorIdInput?: number | string) => {
    const floorId = floorIdInput ? Number(floorIdInput) : undefined;
    const res = await fetchSubFloorAction(floorId);
    if (res.success && res.data) {
      const opts = res.data || [];
      setSubFloorOptions(opts);
      setFormData((prev: any) => {
        const hasCurrent = opts.some((o: any) => String(o.value) === String(prev.subFloorId));
        if (prev.subFloorId && hasCurrent) {
          return prev;
        }
        return { ...prev, subFloorId: '' };
      });
    }
  }, [setFormData]);

  const handleUseTypeSelect = useCallback((typeId: string) => {
    setFormData((prev: any) => ({ ...prev, useType: typeId, subUseType: '' }));
    loadSubUseTypes(typeId);
  }, [setFormData, loadSubUseTypes]);

  const lastFloorIdRef = useRef<any>(undefined);
  useEffect(() => {
    const currentFloor = formData?.floorId ?? formData?.floor ?? undefined;
    if (currentFloor !== lastFloorIdRef.current) {
      lastFloorIdRef.current = currentFloor;
      loadSubFloorOptions(currentFloor);
    }
  }, [formData?.floorId, formData?.floor, loadSubFloorOptions]);

  const lastUseTypeRef = useRef<any>(undefined);
  useEffect(() => {
    const currentUseType = formData?.useType ?? undefined;
    if (currentUseType !== lastUseTypeRef.current) {
      lastUseTypeRef.current = currentUseType;
      loadSubUseTypes(currentUseType);
    }
  }, [formData?.useType, loadSubUseTypes]);

  return { dynamicSubUseTypes, subFloorOptions, loadSubFloorOptions, handleUseTypeSelect };
}
