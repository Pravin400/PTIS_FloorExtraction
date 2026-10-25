/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from "react";
import { InventoryType, InventoryForm } from "@/types/asset/furniture-fixture.types";
import { inventoryMeta } from "@/lib/utils/asset-utils/new-add-new-asset/furniture-fixture/FurnitureFixtureConstants";
import type { InventoryItemCategory, InventoryItemCondition, InventoryItemName, InventoryItemModel } from "@/lib/api/asset/municipal-Asset/new-add-new-asset/inventory.service";

export function useFurnitureFixtureOptions(
  categories: InventoryItemCategory[],
  conditions: InventoryItemCondition[],
  itemNames: InventoryItemName[],
  itemModels: InventoryItemModel[],
  form: InventoryForm,
  editForm: InventoryForm
) {
  // Derive depreciation rates from categories array: { "Furniture": 0.1, "Electronics": 0.1, ... }
  const dynamicRates = useMemo(() => {
    if (categories.length === 0) return {};
    const rates: Record<string, number> = {};
    categories.forEach(c => {
      rates[c.typeName] = c.depreciationRate;
      if (c.typeName === "Electronics") {
        rates["Electronic Fixtures"] = c.depreciationRate;
      }
    });
    return rates;
  }, [categories]);

  // Derive condition factors from conditions array: { "New": 1.0, "Good": 1.0, ... }
  const dynamicConditions = useMemo(() => {
    if (conditions.length === 0) return {};
    const factors: Record<string, number> = {};
    conditions.forEach(c => {
      const cat = categories.find(cat => cat.id === c.inventoryItemCategoryId);
      if (cat) {
        factors[`${cat.typeName.toLowerCase()}_${c.conditionName.toLowerCase()}`] = c.conditionFactor;
        if (cat.typeName === "Electronics") {
          factors[`electronic fixtures_${c.conditionName.toLowerCase()}`] = c.conditionFactor;
        }
      }
      factors[c.conditionName.toLowerCase()] = c.conditionFactor;
      factors[c.conditionName] = c.conditionFactor;
    });
    return factors;
  }, [conditions, categories]);

  // Build Type dropdown options from actual categories
  const dynamicCategoryOptions = useMemo(() => {
    if (categories.length > 0) {
      return categories.map(c => ({ label: c.typeName, value: c.typeName }));
    }
    return [];
  }, [categories]);

  // Build Item Name dropdown options — filtered by selected category
  const dynamicItemNameOptions = useMemo(() => {
    if (itemNames.length > 0) {
      const selectedCat = categories.find(c => String(c.typeName).toLowerCase() === String(form.category).toLowerCase());
      if (selectedCat) {
        return itemNames
          .filter(n => String(n.inventoryItemCategoryId) === String(selectedCat.id))
          .map(n => ({ label: n.subTypeName, value: n.subTypeName }));
      }
    }
    // Fallback to hardcoded inventoryMeta names
    const meta = form.category ? inventoryMeta[form.category as InventoryType] : undefined;
    return meta?.names || [];
  }, [itemNames, categories, form.category]);

  // Build Model dropdown options — filtered by selected item name
  const dynamicModelOptions = useMemo(() => {
    if (itemModels.length > 0 && itemNames.length > 0) {
      const selectedItem = itemNames.find(n => String(n.subTypeName).toLowerCase() === String(form.itemName).toLowerCase());
      if (selectedItem) {
        return itemModels
          .filter(m => String(m.inventoryItemNameId) === String(selectedItem.id))
          .map(m => ({ label: m.modelName, value: m.modelName }));
      }
    }
    // Fallback to hardcoded inventoryMeta modelMap
    const meta = form.category ? inventoryMeta[form.category as InventoryType] : undefined;
    return meta?.modelMap?.[form.itemName] ?? [];
  }, [itemModels, itemNames, form.category, form.itemName]);

  // Build Condition dropdown options — filtered by selected category
  const dynamicConditionOptions = useMemo(() => {
    if (conditions.length > 0) {
      const selectedCat = categories.find(c => c.typeName === form.category);
      if (selectedCat) {
        return conditions
          .filter(c => c.inventoryItemCategoryId === selectedCat.id || (c as any).categoryId === selectedCat.id)
          .map(c => ({ label: c.conditionName, value: c.conditionName }));
      }
      // Fallback: show all unique conditions
      const unique = new Map<string, string>();
      conditions.forEach(c => unique.set(c.conditionName, c.conditionName));
      return Array.from(unique.values()).map(name => ({ label: name, value: name }));
    }
    return [];
  }, [conditions, categories, form.category]);

  // Build Edit Item Name dropdown options — filtered by selected category
  const dynamicEditItemNameOptions = useMemo(() => {
    if (itemNames.length > 0) {
      const selectedCat = categories.find(c => String(c.typeName).toLowerCase() === String(editForm.category).toLowerCase());
      if (selectedCat) {
        return itemNames
          .filter(n => String(n.inventoryItemCategoryId) === String(selectedCat.id))
          .map(n => ({ label: n.subTypeName, value: n.subTypeName }));
      }
    }
    // Fallback to hardcoded inventoryMeta names
    const meta = editForm.category ? inventoryMeta[editForm.category as InventoryType] : undefined;
    return meta?.names || [];
  }, [itemNames, categories, editForm.category]);

  // Build Edit Model dropdown options — filtered by selected item name
  const dynamicEditModelOptions = useMemo(() => {
    if (itemModels.length > 0 && itemNames.length > 0) {
      const selectedItem = itemNames.find(n => String(n.subTypeName).toLowerCase() === String(editForm.itemName).toLowerCase());
      if (selectedItem) {
        return itemModels
          .filter(m => String(m.inventoryItemNameId) === String(selectedItem.id))
          .map(m => ({ label: m.modelName, value: m.modelName }));
      }
    }
    // Fallback to hardcoded inventoryMeta modelMap
    const meta = editForm.category ? inventoryMeta[editForm.category as InventoryType] : undefined;
    return meta?.modelMap?.[editForm.itemName] ?? [];
  }, [itemModels, itemNames, editForm.category, editForm.itemName]);

  // Build Edit Condition dropdown options — filtered by selected category
  const dynamicEditConditionOptions = useMemo(() => {
    if (conditions.length > 0) {
      const selectedCat = categories.find(c => c.typeName === editForm.category);
      if (selectedCat) {
        return conditions
          .filter(c => c.inventoryItemCategoryId === selectedCat.id || (c as any).categoryId === selectedCat.id)
          .map(c => ({ label: c.conditionName, value: c.conditionName }));
      }
      // Fallback: show all unique conditions
      const unique = new Map<string, string>();
      conditions.forEach(c => unique.set(c.conditionName, c.conditionName));
      return Array.from(unique.values()).map(name => ({ label: name, value: name }));
    }
    return [];
  }, [conditions, categories, editForm.category]);

  return {
    dynamicRates,
    dynamicConditions,
    dynamicCategoryOptions,
    dynamicConditionOptions,
    dynamicItemNameOptions,
    dynamicModelOptions,
    dynamicEditItemNameOptions,
    dynamicEditModelOptions,
    dynamicEditConditionOptions,
  };
}
