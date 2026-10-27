/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { convertSqMToSqFt } from '@/lib/utils/RoomSubmission/conversions';
import {
  OpenPlotCategoryItem,
  filterOpenPlotCategories,
} from '@/lib/utils/floorSubmission/openplot-category';
import { getOpenPlotCategoryDataAction } from '@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/FloorSubmission/actions';

export interface UsePlotAreaCalculatorParams {
  t: (key: string) => string;
  onApply?: (sqFt: string, sqM: string, len?: string, wid?: string) => void;
  onLoad?: (sqFt: string, sqM: string, len?: string, wid?: string) => void;
  initialPlotArea?: {
    length?: number | string | null;
    width?: number | string | null;
    totalPlotArea?: number | string | null;
  } | null;
  onChange?: (sqFt: string, sqM: string, len?: string, wid?: string) => void;
  isLoading?: boolean;
  selectedFloorType?: 'Construction' | 'OpenPlot';
  openPlotCategories?: OpenPlotCategoryItem[];
  selectedOpenPlotCategory?: OpenPlotCategoryItem | null;
  propertyTypeId?: string | number;
}

interface PlotBaseline {
  length: string;
  width: string;
  categoryId: string;
  floorType: string;
}

export function usePlotAreaCalculator({
  t,
  onApply,
  onLoad,
  initialPlotArea,
  onChange,
  isLoading = false,
  selectedFloorType = 'Construction',
  openPlotCategories,
  selectedOpenPlotCategory,
  propertyTypeId: _propertyTypeId,
}: UsePlotAreaCalculatorParams) {
  const [length, setLength] = useState<string>(() =>
    initialPlotArea?.length != null ? String(initialPlotArea.length) : ''
  );
  const [width, setWidth] = useState<string>(() =>
    initialPlotArea?.width != null ? String(initialPlotArea.width) : ''
  );

  const lengthInputRef = useRef<HTMLInputElement | null>(null);
  const onLoadRef = useRef(onLoad);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onLoadRef.current = onLoad;
  }, [onLoad]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Focus length input on mount & floorSaved event
  useEffect(() => {
    const handleFocus = () => lengthInputRef.current?.focus();
    handleFocus();
    window.addEventListener('floorSaved', handleFocus);
    return () => window.removeEventListener('floorSaved', handleFocus);
  }, []);

  const selectedCatId = useMemo(
    () => (selectedOpenPlotCategory ? String(selectedOpenPlotCategory.id || selectedOpenPlotCategory.typeOfUseId || '') : ''),
    [selectedOpenPlotCategory]
  );

  const [savedBaseline, setSavedBaseline] = useState<PlotBaseline | null>(null);

  const initialLen = initialPlotArea?.length;
  const initialWid = initialPlotArea?.width;
  const initialTotal = initialPlotArea?.totalPlotArea;

  const prevInitialRef = useRef<{
    length?: number | string | null;
    width?: number | string | null;
    totalPlotArea?: number | string | null;
  } | null>(null);

  // Sync initial plot area & establish baseline
  useEffect(() => {
    const isSameAsPrev =
      prevInitialRef.current &&
      prevInitialRef.current.length === initialLen &&
      prevInitialRef.current.width === initialWid &&
      prevInitialRef.current.totalPlotArea === initialTotal;

    if (initialPlotArea && !isSameAsPrev) {
      prevInitialRef.current = {
        length: initialLen,
        width: initialWid,
        totalPlotArea: initialTotal,
      };

      const len = initialLen != null ? String(initialLen) : '0';
      const wid = initialWid != null ? String(initialWid) : '0';
      const totalArea = initialTotal != null ? Number(initialTotal) : 0;

      setLength(len);
      setWidth(wid);
      setSavedBaseline({
        length: len,
        width: wid,
        categoryId: selectedCatId,
        floorType: selectedFloorType,
      });

      const sqFt = convertSqMToSqFt(totalArea);
      onLoadRef.current?.(
        sqFt > 0 ? sqFt.toFixed(2) : '0.00',
        totalArea > 0 ? totalArea.toFixed(2) : '0.00',
        len,
        wid
      );
    } else if (savedBaseline === null) {
      setSavedBaseline({
        length,
        width,
        categoryId: selectedCatId,
        floorType: selectedFloorType,
      });
    } else if (savedBaseline.categoryId === '' && selectedCatId !== '') {
      setSavedBaseline((prev) => (prev ? { ...prev, categoryId: selectedCatId } : null));
    }
  }, [initialPlotArea, initialLen, initialWid, initialTotal, selectedCatId, selectedFloorType, savedBaseline, length, width]);

  // Derived state: area calculations
  const { totalSqFt, totalSqM, numericSqM } = useMemo(() => {
    const l = parseFloat(length) || 0;
    const w = parseFloat(width) || 0;
    const sqM = l * w;
    const sqFt = convertSqMToSqFt(sqM);

    return {
      totalSqFt: sqFt > 0 ? sqFt.toFixed(2) : '0.00',
      totalSqM: sqM > 0 ? sqM.toFixed(2) : '0.00',
      numericSqM: sqM,
    };
  }, [length, width]);

  useEffect(() => {
    onChangeRef.current?.(totalSqFt, totalSqM, length, width);
  }, [totalSqFt, totalSqM, length, width]);

  // Categories loading & dropdown options
  const [categories, setCategories] = useState<OpenPlotCategoryItem[]>(
    () => openPlotCategories || []
  );
  const [isCategoryLoading, setIsCategoryLoading] = useState<boolean>(false);

  useEffect(() => {
    if (openPlotCategories && openPlotCategories.length > 0) {
      setCategories(openPlotCategories);
    }
  }, [openPlotCategories]);

  const handleOpenPlotCategoryFocus = useCallback(async () => {
    if (isCategoryLoading) return;
    setIsCategoryLoading(true);
    try {
      const data = await getOpenPlotCategoryDataAction();
      if (Array.isArray(data) && data.length > 0) {
        const mapped = filterOpenPlotCategories(data);
        if (mapped.length > 0) {
          setCategories(mapped);
        }
      }
    } catch (_err) {
      // ignore
    } finally {
      setIsCategoryLoading(false);
    }
  }, [isCategoryLoading]);

  // Automatically ensure categories are loaded on mount if empty
  useEffect(() => {
    if (!categories || categories.length === 0) {
      handleOpenPlotCategoryFocus();
    }
  }, [categories, handleOpenPlotCategoryFocus]);

  const categoryList = useMemo(
    () => (categories?.length ? categories : (openPlotCategories?.length ? openPlotCategories : [])),
    [categories, openPlotCategories]
  );

  const openPlotCategoryOptions = useMemo(
    () =>
      categoryList.map((item, idx) => ({
        label: `${item.typeOfUseCode} - ${item.description}`,
        value: String(item.id || item.typeOfUseId || `cat-${idx}`),
      })),
    [categoryList]
  );

  // Check if form differs from saved baseline
  const hasChanged = useMemo(() => {
    if (!savedBaseline) return true;
    return (
      length !== savedBaseline.length ||
      width !== savedBaseline.width ||
      selectedCatId !== savedBaseline.categoryId ||
      selectedFloorType !== savedBaseline.floorType
    );
  }, [length, width, selectedCatId, selectedFloorType, savedBaseline]);

  const handleApply = useCallback(() => {
    if (selectedFloorType === 'OpenPlot' && !selectedOpenPlotCategory?.id) {
      return;
    }
    if (onApply && numericSqM > 0) {
      onApply(totalSqFt, totalSqM, length, width);
      setSavedBaseline({
        length,
        width,
        categoryId: selectedCatId,
        floorType: selectedFloorType,
      });
      lengthInputRef.current?.focus();
    }
  }, [onApply, numericSqM, totalSqFt, totalSqM, length, width, selectedFloorType, selectedOpenPlotCategory, selectedCatId]);

  const isButtonDisabled = useMemo(
    () =>
      !hasChanged ||
      !length ||
      !width ||
      parseFloat(length) <= 0 ||
      parseFloat(width) <= 0 ||
      isLoading ||
      (selectedFloorType === 'OpenPlot' && !selectedOpenPlotCategory?.id),
    [hasChanged, length, width, isLoading, selectedFloorType, selectedOpenPlotCategory]
  );

  const handleInputChange = useCallback(
    (val: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
      const cleaned = val.replace(/[^0-9.]/g, '');
      const parts = cleaned.split('.');

      let beforeDecimal = parts[0] || '';
      if (beforeDecimal.length > 6) {
        beforeDecimal = beforeDecimal.slice(0, 6);
      }

      if (parts.length > 1) {
        const afterDecimal = parts.slice(1).join('').slice(0, 2);
        setter(`${beforeDecimal}.${afterDecimal}`);
      } else {
        setter(beforeDecimal);
      }
    },
    []
  );

  const getTranslation = useCallback(
    (key: string, fallback: string) => {
      if (!t) return fallback;
      try {
        if (typeof (t as any).has === 'function' && !(t as any).has(key)) {
          return fallback;
        }
        const res = t(key);
        if (!res || typeof res !== 'string' || res.startsWith('quickDataEntry.') || res === key) {
          return fallback;
        }
        return res;
      } catch {
        return fallback;
      }
    },
    [t]
  );

  return {
    length,
    setLength,
    width,
    setWidth,
    lengthInputRef,
    totalSqFt,
    totalSqM,
    categoryList,
    openPlotCategoryOptions,
    handleApply,
    isButtonDisabled,
    handleInputChange,
    getTranslation,
    isLoading,
    handleOpenPlotCategoryFocus,
    isCategoryLoading,
  };
}
