/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback } from 'react';
import { toast } from 'sonner';
import type { PoolUnit } from '@/types/asset/floor-details.types';
import {
  bulkGenerateAcrossFloorsAction,
  fetchFloorsByAsset,
    fetchFloorDropdownOptions,
  getSubUnitsByAssetAction,
} from '@/app/[locale]/assets/municipal-Asset/new-add-new-asset/floor-details/actions';
import { useUnitPoolGenerationForm } from './useUnitPoolGenerationForm';
import { validateGenerationForm, resolveFloorRange, buildGeneratedPoolUnits } from '@/lib/utils/asset-utils/new-add-new-asset/floor-details/unit-pool-generation.utils';
import { useNAAssetForm } from '@/components/modules/assets/municipal-Asset/NewAddNewAsset/NAAssetFormContext';
import { mapSubUnitsToFloors } from '@/lib/utils/asset-utils/new-add-new-asset/floor-details/direct-room-mapper.utils';

interface UseNAUnitPoolGenerationProps {
  dropdownOptions: any | null;
  formData: any;
  t: (key: string, values?: any) => string;
  setPool: React.Dispatch<React.SetStateAction<PoolUnit[]>>;
  setParentFloors: React.Dispatch<React.SetStateAction<any[]>>;
}

// NA = NewAddNewAsset copy of useUnitPoolGeneration
export function useNAUnitPoolGeneration({
  dropdownOptions,
  formData,
  t,
  setPool,
  setParentFloors,
}: UseNAUnitPoolGenerationProps) {
  const { updateFormData } = useNAAssetForm();
  const form = useUnitPoolGenerationForm(dropdownOptions, t);
  const {
    genType, genFromFloor, genToFloor, genCountPerFloor, isGenerating: _isGenerating, setIsGenerating,
    genConYear, genConType, genUseType, genSubUseType, dynamicSubUseTypes, resetGeneratorFields,
  } = form;

  const handleGenerate = useCallback(async () => {
    const validationError = validateGenerationForm(
      { genType, genFromFloor, genToFloor, genCountPerFloor, genConYear, genConType, genUseType },
      t
    );
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const unitsPerFloor = Number(genCountPerFloor);
    const { floorsInRange, valid } = resolveFloorRange(dropdownOptions, genFromFloor, genToFloor);
    if (!valid) {
      toast.error(t('floorDetails.invalidFloorRangeMsg') || 'Invalid floor range selected.');
      return;
    }
    const totalCount = floorsInRange.length * unitsPerFloor;

    const urlParams =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search)
        : new URLSearchParams();
    const rawId = Number(formData.id || urlParams.get('id') || urlParams.get('assetId'));
    const parentAssetId = isNaN(rawId) || rawId <= 0 ? 0 : rawId;

    if (!parentAssetId) {
      toast.error(
        t('floorDetails.buildingNotSavedMsg') ||
          'Building not saved yet. Complete Basic Info step first.'
      );
      return;
    }

    setIsGenerating(true);
    const loadingToast = toast.loading(
      t('floorDetails.generatingUnitsMsg', { count: totalCount, genType }) ||
        `Generating ${totalCount} ${genType} unit(s) in database…`
    );

    try {
      const resolvedSubUseTypeId = genSubUseType && Number(genSubUseType) > 0 ? Number(genSubUseType) : 0;
      let resolvedSubUseTypeName = '';

      if (resolvedSubUseTypeId > 0) {
        const found =
          dynamicSubUseTypes?.find((o: any) => Number(o.value) === resolvedSubUseTypeId) ||
          (dropdownOptions?.subUseTypes || []).find((o: any) => Number(o.value) === resolvedSubUseTypeId);
        resolvedSubUseTypeName = found?.label || '';
      }

      const res = await bulkGenerateAcrossFloorsAction({
        parentAssetId,
        type: genType,
        floorIds: floorsInRange.map((f: any) => Number(f.value)),
        unitsPerFloor,
        constructionYear: genConYear,
        constructionTypeId: Number(genConType),
        typeOfUseId: Number(genUseType),
        subTypeOfUseId: resolvedSubUseTypeId > 0 ? resolvedSubUseTypeId : null,
      });

      if (res.success && res.data?.generatedAssets?.length) {
        const successfulUnits = buildGeneratedPoolUnits(
          res.data.generatedAssets,
          floorsInRange,
          unitsPerFloor,
          genType,
          genConYear,
          genConType,
          genUseType,
          resolvedSubUseTypeId,
          resolvedSubUseTypeName
        );

        const existRes = await fetchFloorsByAsset(parentAssetId);
        if (existRes.success && Array.isArray(existRes.data)) {
          setParentFloors(existRes.data);
        }

        // Sync context formData.floors immediately so that the Floor Snapshot table on the main page updates at the same time
        try {
          const typeId = Number(formData.typeId) || 0;
          if (parentAssetId > 0 && typeId > 0) {
            const [dropdownsRes, subUnitsRes, floorsRes] = await Promise.all([
              fetchFloorDropdownOptions(typeId),
              getSubUnitsByAssetAction(parentAssetId),
              fetchFloorsByAsset(parentAssetId),
            ]);
            
            if (dropdownsRes.success && subUnitsRes.success && floorsRes.success) {
              const mapped = mapSubUnitsToFloors(
                subUnitsRes.data || [], 
                floorsRes.data || [], 
                dropdownsRes.data
              );
              updateFormData({ floors: mapped });
            }
          }
        } catch (syncErr) {
          console.error("Failed to sync floor snapshot in generation hook:", syncErr);
        }

        // Merge by dbId to prevent duplicate rows if Generate is clicked repeatedly
        setPool((prev) => {
          const existingDbIds = new Set(prev.filter((p) => p.dbId != null).map((p) => p.dbId));
          const newUnits = successfulUnits.filter((u) => !existingDbIds.has(u.dbId));
          return [...prev, ...newUnits];
        });

        const count = successfulUnits.length;
        const unitText = count === 1 ? `${genType} unit` : `${genType} units`;

        toast.success(
          t('floorDetails.generateSuccessMsg', { count, unitText }) ||
            `${count} ${unitText} generated and configured successfully.`,
          { id: loadingToast }
        );

        resetGeneratorFields();
      } else {
        const errMsg = res.data?.errors?.join(', ') || res.error || 'Generation failed';
        toast.error(errMsg, { id: loadingToast });
      }
    } catch (err: any) {
      toast.error(err.message || 'Generation failed.', { id: loadingToast });
    } finally {
      setIsGenerating(false);
    }
  }, [
    genType,
    genFromFloor,
    genToFloor,
    genCountPerFloor,
    dropdownOptions,
    formData.id,
    formData.typeId,
    t,
    genConYear,
    genConType,
    genUseType,
    genSubUseType,
    dynamicSubUseTypes,
    resetGeneratorFields,
    setIsGenerating,
    setParentFloors,
    setPool,
    updateFormData,
  ]);

  return {
    ...form,
    handleGenerate,
  };
}
