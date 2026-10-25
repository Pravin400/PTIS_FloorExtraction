import React from "react";
import { AssetFieldDefinitionForm } from "@/components/modules/assets/configuration/master-data/asset-field-definition-master";
import { getAssetCategoriesAction, getAssetTypesByCategoryAction, getAssetFieldGroupsAction } from "../action";

interface AddPageProps {
  searchParams: Promise<{
    assetCategoryId?: string;
  }>;
}

export default async function AddPage({ searchParams }: AddPageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const assetCategoryId = Number(params.assetCategoryId);
  const selectedCategoryId = Number.isFinite(assetCategoryId) && assetCategoryId > 0 ? assetCategoryId : undefined;

  const [categories, fieldGroups] = await Promise.all([
    getAssetCategoriesAction(),
    getAssetFieldGroupsAction(),
  ]);

  const types = selectedCategoryId ? await getAssetTypesByCategoryAction(selectedCategoryId) : [];

  return (
    <AssetFieldDefinitionForm
      id={null}
      initialData={undefined}
      categories={categories.map((c) => ({ id: c.id, name: c.categoryName }))}
      types={types.map((t) => ({ id: t.id, name: t.typeName }))}
      fieldGroups={fieldGroups}
    />
  );
}
