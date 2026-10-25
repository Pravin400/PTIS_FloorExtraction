/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo, useCallback } from "react";
import { useMovableValuation } from "./useMovableValuation";

const INFRASTRUCTURE_TYPES = ["Road", "Bridge", "Subway", "Bridge/Subway", "Water Tank", "Water Tank/Reservoir"];

export function useValuationData(
  _assetId: number | undefined,
  formData: any,
  updateFormData: (data: any) => void,
  setIsDataLoading?: (loading: boolean) => void,
  initialCategories: any[] = [],
  initialConditions: any[] = [],
  initialValuationData?: any
) {
  const assetType: string = formData.assetType || "";
  const valuationType: string = formData.valuationType || "";

  const isBuilding = valuationType ? valuationType === "BUILDING" : formData.hasFloorDetails === true;
  const isLand = valuationType ? valuationType === "LAND" : (!formData.hasFloorDetails && !formData.isMovableCategory && !INFRASTRUCTURE_TYPES.some(t => assetType === t));
  const isInfrastructure = valuationType ? valuationType === "INFRASTRUCTURE" : INFRASTRUCTURE_TYPES.some(t => assetType === t);

  const categories = useMemo(() => {
    const assetCatId = Number(formData.categoryId || 0);
    if (assetCatId > 0) {
      return initialCategories.filter((c: any) => {
        const catAssetCatId = Number(c.assetCategoryId);
        if (!isNaN(catAssetCatId) && catAssetCatId > 0) {
          return catAssetCatId === assetCatId;
        }
        return true; // Allow categories with missing or 0 (unmapped/global) assetCategoryId
      });
    }
    return initialCategories;
  }, [initialCategories, formData.categoryId]);
  const conditions = useMemo(() => initialConditions, [initialConditions]);

  const mapFloors = useCallback((floors: any[]) => floors.map((f: any) => {
    const floorDetailsId = f.floorDetailsId ?? f.FloorDetailsId ?? f.id ?? f.Id ?? 0;
    const assetIdVal = f.assetId ?? f.AssetId ?? 0;
    const contextFloor = formData.floors?.find((cf: any) => cf.id === floorDetailsId || cf.floor === String(f.floorId || f.FloorId));
    const finalCapitalValue = f.CapitalValue ?? f.capitalValue ?? f.baseValue ?? f.BaseValue ?? f.marketValue ?? f.MarketValue ?? contextFloor?.finalCapitalValue ?? contextFloor?.baseValue ?? 0;
    const builtUpArea = f.builtUpAreaSqFeet ?? f.BuiltUpAreaSqFeet ?? f.builtUpAreaSqMeter ?? f.BuiltUpAreaSqMeter ?? f.carpetAreaSqFeet ?? f.CarpetAreaSqFeet ?? contextFloor?.builtUpAreaSqFt ?? contextFloor?.builtUpAreaSqM ?? 0;
    const carpetArea = f.carpetAreaSqFeet ?? f.CarpetAreaSqFeet ?? f.carpetAreaSqMeter ?? f.CarpetAreaSqMeter ?? contextFloor?.carpetAreaSqFt ?? contextFloor?.carpetAreaSqM ?? 0;
    return {
      id: floorDetailsId || contextFloor?.id || 0,
      floorDetailsId: floorDetailsId || contextFloor?.id || 0,
      assetId: assetIdVal || contextFloor?.assetId || 0,
      floor: String(f.floorId ?? f.FloorId ?? contextFloor?.floor ?? ""),
      constructionYear: String(f.constructionYear ?? f.ConstructionYear ?? contextFloor?.conYear ?? ""),
      assessmentYear: String(f.assessmentYear ?? f.AssessmentYear ?? contextFloor?.asstYear ?? ""),
      noOfRooms: Number(f.noOfRooms ?? f.NoOfRooms ?? contextFloor?.rooms ?? 0),
      carpetAreaSqFt: Number(carpetArea),
      carpetAreaSqM: Number(f.carpetAreaSqMeter ?? f.CarpetAreaSqMeter ?? contextFloor?.carpetAreaSqM ?? 0),
      builtUpAreaSqFt: Number(builtUpArea),
      builtUpAreaSqM: Number(f.builtUpAreaSqMeter ?? f.BuiltUpAreaSqMeter ?? contextFloor?.builtUpAreaSqM ?? 0),
      baseValue: Number(f.baseValue ?? f.BaseValue ?? contextFloor?.baseValue ?? 0),
      floorFactorValue: Number(f.cvFloorFactor ?? f.CvFloorFactor ?? contextFloor?.floorFactorValue ?? 1),
      ageFactorValue: Number(f.cvAgeFactor ?? f.CvAgeFactor ?? contextFloor?.ageFactorValue ?? 1),
      ntbFactorValue: Number(f.cvNatureFactor ?? f.CvNatureFactor ?? contextFloor?.ntbFactorValue ?? 1),
      useFactorValue: Number(f.cvUseFactor ?? f.CvUseFactor ?? contextFloor?.useFactorValue ?? 1),
      finalCapitalValue: String(finalCapitalValue),
      cvCalculationFormula: String(f.cvCalculationFormula ?? ""),
      isCalculated: Boolean(f.isCalculated ?? false),
      calculationMessage: String(f.calculationMessage ?? ""),
      floorDescription: String(f.floorDescription ?? ""),
      subFloorDescription: String(f.subFloorDescription ?? ""),
      constructionTypeDescription: String(f.constructionTypeDescription ?? ""),
      typeOfUseDescription: String(f.typeOfUseDescription ?? ""),
      subTypeOfUseDescription: String(f.subTypeOfUseDescription ?? ""),
    };
  }), [formData.floors]);

  const ssrFloors = useMemo(() => {
    const raw = initialValuationData?.floors;
    return Array.isArray(raw) && raw.length > 0 ? mapFloors(raw) : [];
  }, [initialValuationData?.floors, mapFloors]);

  const ssrInventories: any[] = useMemo(() => initialValuationData?.inventories ?? [], [initialValuationData?.inventories]);
  const ssrBuildingCV: any = useMemo(() => initialValuationData?.buildingCV ?? null, [initialValuationData?.buildingCV]);
  const ssrPlotCV: any = useMemo(() => initialValuationData?.plotCV ?? null, [initialValuationData?.plotCV]);
  const ssrCvRollup: any = useMemo(() => initialValuationData?.cvRollup ?? null, [initialValuationData?.cvRollup]);

  const [dynamicFloors] = useState<any[]>(ssrFloors);
  const [rawInventories] = useState<any[]>(ssrInventories);
  const [buildingCV] = useState<any>(ssrBuildingCV);
  const [plotCV] = useState<any>(ssrPlotCV);
  const [cvRollup] = useState<any>(ssrCvRollup);

  useEffect(() => {
    if (ssrFloors.length > 0) updateFormData({ floors: ssrFloors });
    if (ssrBuildingCV || ssrPlotCV) updateFormData({ ...(ssrBuildingCV ? { capitalValue: String(ssrBuildingCV.totalBuildingCapitalValue ?? 0) } : {}) });
  }, [ssrBuildingCV, ssrFloors, ssrPlotCV, updateFormData]);

  const inventoryState = useMemo(() => {
    const furniture: any[] = [];
    const it: any[] = [];
    const electronic: any[] = [];
    const vehicle: any[] = [];

    rawInventories.forEach((batch: any) => {
      // InventoryBatchDetailDto (the actual shape of GET /asset-management/AssetInventory/batches/{assetId})
      // nests type/name/model/condition under `names`, not top-level — check both.
      const names = batch.names ?? batch.Names ?? {};
      const batchId = batch.batchId ?? batch.BatchId ?? 0;
      const itemName = batch.itemName ?? batch.ItemName ?? names.itemName ?? names.ItemName ?? "";
      const modelBrand = batch.modelBrand ?? batch.ModelBrand ?? names.modelBrand ?? names.ModelBrand ?? "";
      const purchaseDate = batch.purchaseDate ?? batch.PurchaseDate ?? "";
      const condition = batch.condition ?? batch.Condition ?? names.condition ?? names.Condition ?? "";
      const quantity = batch.quantity ?? batch.Quantity ?? 0;
      const unitValue = batch.unitValue ?? batch.UnitValue ?? 0;
      const totalBatchCV = batch.totalBatchCV ?? batch.TotalBatchCV ?? batch.totalBatchValue ?? batch.TotalBatchValue ?? 0;
      const specifications = batch.specifications ?? batch.Specifications ?? "";
      const rawType = String(batch.inventoryType ?? batch.InventoryType ?? names.inventoryType ?? names.InventoryType ?? "").toLowerCase().trim();
      const item = {
        id: String(batchId), itemName, equipmentName: itemName, typeModel: modelBrand, brandModel: modelBrand, purchaseDate,
        condition, status: condition, quantity, unitValue, totalValue: totalBatchCV, specifications,
      };
      if (rawType.includes("furniture") || rawType.includes("furn")) furniture.push(item);
      else if (rawType.includes("it-equipment") || rawType.includes("it_equipment") || rawType.includes("it-equip") || rawType === "it" || rawType.includes("computer")) it.push(item);
      else if (rawType.includes("electronic") || rawType.includes("elect") || rawType.includes("fixture")) electronic.push(item);
      else if (rawType.includes("vehicle") || rawType.includes("veh") || rawType.includes("car")) vehicle.push(item);
      else furniture.push(item);
    });
    return { furnitureItems: furniture, itEquipmentItems: it, electronicFixtures: electronic, vehicles: vehicle };
  }, [rawInventories]);

  useEffect(() => {
    if (setIsDataLoading) setIsDataLoading(true);
    if (initialValuationData?.asset) {
      const asset = initialValuationData.asset;
      const attributes: Record<string, any> = {};
      if (asset.fieldValues && Array.isArray(asset.fieldValues)) {
        asset.fieldValues.forEach((fv: any) => {
          if (fv.fieldName) attributes[fv.fieldName] = fv.numberValue ?? fv.textValue ?? fv.booleanValue ?? fv.dateValue;
        });
      }
      updateFormData({
        id: asset.id, assetId: asset.id, assetCode: asset.assetNo || asset.assetCode || "", assetName: asset.assetName || "",
        landArea: asset.landAreaSqMeter || attributes.landArea || formData.landArea || "", landRate: attributes.landRate || formData.landRate || "",
        developmentCost: attributes.developmentCost || formData.developmentCost || "", marketAppreciation: attributes.marketAppreciation || formData.marketAppreciation || "",
        grossValue: asset.purchaseValue || "", currentBookValue: asset.currentBookValue || "", marketValue: asset.marketValue || "",
        capitalValue: asset.capitalValue || "", attributes: { ...formData.attributes, ...attributes }
      });
    }
    if (setIsDataLoading) setIsDataLoading(false);
  }, [
    initialValuationData?.asset,
    updateFormData,
    setIsDataLoading,
    formData.attributes,
    formData.developmentCost,
    formData.landArea,
    formData.landRate,
    formData.marketAppreciation,
  ]);

  const { scheduleRecalc } = useMovableValuation(formData, updateFormData, conditions, isBuilding, isLand);

  return { isLoading: false, dynamicFloors, categories, conditions, rawInventories, plotCV, buildingCV, cvRollup, inventoryState, isBuilding, isLand, isInfrastructure, scheduleRecalc };
}
