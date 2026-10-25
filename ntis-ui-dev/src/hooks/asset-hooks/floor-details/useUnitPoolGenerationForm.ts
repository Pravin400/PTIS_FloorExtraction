/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { fetchSubUseTypesAction } from '@/app/[locale]/assets/municipal-Asset/new-add-new-asset/floor-details/actions';

/** Owns the bulk-generator form state (unit type, floor range, count,
 * construction classification) and initialized empty defaults. */
export function useUnitPoolGenerationForm(dropdownOptions: any, t: (key: string, values?: any) => string) {
  const [genType, setGenType] = useState('');
  const [genFromFloor, setGenFromFloor] = useState('');
  const [genToFloor, setGenToFloor] = useState('');
  const [genCountPerFloor, setGenCountPerFloor] = useState<number | ''>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genConYear, setGenConYear] = useState('');
  const [genConType, setGenConType] = useState('');
  const [genUseType, setGenUseType] = useState('');
  const [genSubUseType, setGenSubUseType] = useState('');
  const [dynamicSubUseTypes, setDynamicSubUseTypes] = useState<any[]>([]);
  const [isSubUseTypesLoading, setIsSubUseTypesLoading] = useState(false);

  const tHas = (t as any).has;
  const TYPE_OPTIONS = [
    { label: (tHas && !tHas('floorDetails.flat') ? 'Flat' : t('floorDetails.flat')) || 'Flat', value: 'Flat' },
    { label: (tHas && !tHas('floorDetails.shop') ? 'Shop' : t('floorDetails.shop')) || 'Shop', value: 'Shop' },
    { label: (tHas && !tHas('floorDetails.office') ? 'Office' : t('floorDetails.office')) || 'Office', value: 'Office' },
  ];

  // Load dynamic sub-use types whenever genUseType changes
  useEffect(() => {
    if (!genUseType) {
      setTimeout(() => {
        setDynamicSubUseTypes([]);
        setGenSubUseType('');
      }, 0);
      return;
    }

    let isMounted = true;
    setTimeout(() => { setIsSubUseTypesLoading(true); }, 0);

    const staticList = (dropdownOptions?.subUseTypes || []).filter(
      (o: any) => String(o.typeOfUseId) === String(genUseType)
    );

    if (staticList.length > 0) {
      setTimeout(() => { setDynamicSubUseTypes(staticList); }, 0);
      setTimeout(() => { setGenSubUseType((prev) => {
        const has = staticList.some((o: any) => String(o.value) === String(prev));
        return has ? prev : '';
      }); }, 0);
    }

    fetchSubUseTypesAction(Number(genUseType))
      .then((res) => {
        if (!isMounted) return;
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          const items = res.data;
          setDynamicSubUseTypes(items);
          setTimeout(() => { setGenSubUseType((prev) => {
            const has = items.some((o: any) => String(o.value) === String(prev));
            return has ? prev : '';
          }); }, 0);
        } else if (staticList.length === 0) {
          setDynamicSubUseTypes([]);
          setGenSubUseType('');
        }
      })
      .catch((err) => {
        console.error('Failed to fetch dynamic sub-use types:', err);
      })
      .finally(() => {
        if (isMounted) setIsSubUseTypesLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [genUseType, dropdownOptions?.subUseTypes]);

  // Reset To Floor if it becomes lower than From Floor
  useEffect(() => {
    if (genFromFloor && genToFloor && dropdownOptions?.floorLevels) {
      const floorLevels = dropdownOptions.floorLevels;
      const fromIdx = floorLevels.findIndex((f: any) => String(f.value) === String(genFromFloor));
      const toIdx = floorLevels.findIndex((f: any) => String(f.value) === String(genToFloor));
      if (fromIdx !== -1 && toIdx !== -1 && toIdx < fromIdx) {
      setTimeout(() => { setGenToFloor(''); }, 0);
    }
    }
  }, [genFromFloor, genToFloor, dropdownOptions?.floorLevels]);

  const resetGeneratorFields = () => {
    setGenType('');
    setGenFromFloor('');
    setGenToFloor('');
    setGenCountPerFloor(1);
    setGenConYear('');
    setGenConType('');
    setGenUseType('');
    setGenSubUseType('');
  };

  return {
    genType, setGenType,
    genFromFloor, setGenFromFloor,
    genToFloor, setGenToFloor,
    genCountPerFloor, setGenCountPerFloor,
    isGenerating, setIsGenerating,
    genConYear, setGenConYear,
    genConType, setGenConType,
    genUseType, setGenUseType,
    genSubUseType, setGenSubUseType,
    dynamicSubUseTypes, setDynamicSubUseTypes,
    isSubUseTypesLoading,
    TYPE_OPTIONS,
    resetGeneratorFields,
  };
}
