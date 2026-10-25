import React from "react";
import { notFound } from "next/navigation";
import { InventoryConditionForm } from "@/components/modules/assets/configuration/master-data/inventory-condition-master";
import {
  getInventoryConditionCategoriesAction,
  getInventoryConditionByIdAction,
  getAssetCategoriesForConditionAction,
} from "../../actions";

export const dynamic = "force-dynamic";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPage({ params }: EditPageProps): Promise<React.ReactElement> {
  const { id } = await params;
  
  const [inventoryCategories, assetCategories, conditionData] = await Promise.all([
    getInventoryConditionCategoriesAction(),
    getAssetCategoriesForConditionAction(),
    getInventoryConditionByIdAction(id),
  ]);

  if (!conditionData) {
    notFound();
  }

  return (
    <InventoryConditionForm
      id={Number(id)}
      initialData={conditionData}
      inventoryCategories={inventoryCategories}
      assetCategories={assetCategories}
    />
  );
}
