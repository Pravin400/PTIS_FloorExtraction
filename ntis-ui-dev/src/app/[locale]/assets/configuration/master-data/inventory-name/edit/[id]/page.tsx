import React from "react";
import { InventoryNameForm } from "@/components/modules/assets/configuration/master-data/inventory-name-master";
import { getInventoryNameCategoriesAction, getInventoryNameByIdAction } from "../../actions";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPage({ params }: EditPageProps): Promise<React.ReactElement> {
  const { id } = await params;
  
  const [categories, nameData] = await Promise.all([
    getInventoryNameCategoriesAction(),
    getInventoryNameByIdAction(id),
  ]);

  if (!nameData) {
    notFound();
  }

  return <InventoryNameForm id={Number(id)} initialData={nameData as unknown as import("@/types/asset-masters/inventory-name.types").InventoryNameFormModel} categories={categories} />;
}

