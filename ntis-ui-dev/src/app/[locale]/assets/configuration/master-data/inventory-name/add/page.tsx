import React from "react";
import { InventoryNameForm } from "@/components/modules/assets/configuration/master-data/inventory-name-master";
import { getInventoryNameCategoriesAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function AddPage(): Promise<React.ReactElement> {
  const categories = await getInventoryNameCategoriesAction();
  return <InventoryNameForm id={undefined} initialData={undefined} categories={categories} />;
}
