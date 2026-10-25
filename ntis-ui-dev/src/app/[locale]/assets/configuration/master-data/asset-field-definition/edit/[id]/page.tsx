import React from "react";
import { AssetFieldDefinitionForm } from "@/components/modules/assets/configuration/master-data/asset-field-definition-master";
import {
  getAssetFieldDefinitionByIdAction,
  getAssetCategoriesAction,
  getAssetTypesByCategoryAction,
  getAssetFieldGroupsAction,
} from "../../action";
import { notFound } from "next/navigation";
import type { AssetFieldDefinition } from "@/types/asset-masters/asset-field-definition.types";
import { ApiError } from "@/lib/utils/api";
import { createLogger } from "@/lib/utils/server-logger";

const logger = createLogger("EditFieldDefinitionPage");

interface PageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    assetCategoryId?: string;
  }>;
}

export default async function EditPage({ params, searchParams }: PageProps): Promise<React.ReactElement> {
  const { id: idParam } = await params;
  const resolvedSearchParams = await searchParams;

  const id = Number(idParam);
  if (!Number.isFinite(id) || id <= 0) {
    notFound();
  }

  let fieldData: AssetFieldDefinition;
  try {
    fieldData = await getAssetFieldDefinitionByIdAction(id);
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) {
      notFound();
    }
    logger.error("Failed to fetch asset field definition", { id }, error);
    throw error;
  }

  const hasCategoryParam = resolvedSearchParams.assetCategoryId !== undefined;
  const categoryIdFromQuery = Number(resolvedSearchParams.assetCategoryId);
  const selectedCategoryId = hasCategoryParam
    ? (Number.isFinite(categoryIdFromQuery) && categoryIdFromQuery > 0 ? categoryIdFromQuery : 0)
    : fieldData.assetCategoryId;

  const [categories, types, fieldGroups] = await Promise.all([
    getAssetCategoriesAction(),
    selectedCategoryId > 0 ? getAssetTypesByCategoryAction(selectedCategoryId) : Promise.resolve([]),
    getAssetFieldGroupsAction(),
  ]);

  return (
    <AssetFieldDefinitionForm
      id={id}
      initialData={fieldData}
      categories={categories.map((c) => ({ id: c.id, name: c.categoryName }))}
      types={types.map((t) => ({ id: t.id, name: t.typeName }))}
      fieldGroups={fieldGroups}
    />
  );
}
