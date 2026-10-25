import React from "react";
import { InventoryConditionForm } from "@/components/modules/assets/configuration/master-data/inventory-condition-master";
import { getInventoryConditionCategoriesAction, getAssetCategoriesForConditionAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function AddPage(): Promise<React.ReactElement> {
  const [inventoryCategories, assetCategories] = await Promise.all([
    getInventoryConditionCategoriesAction(),
    getAssetCategoriesForConditionAction(),
  ]);
  return <InventoryConditionForm id={undefined} initialData={undefined} inventoryCategories={inventoryCategories} assetCategories={assetCategories} />;
}
