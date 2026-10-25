import React from "react";
import { AssetDocumentDefinitionForm } from "@/components/modules/assets/configuration/master-data/asset-document-definition-master";
import { getAssetDocumentDefinitionByIdAction, getAssetCategoriesAction, getAssetTypesByCategoryAction } from "../../action";
import { notFound } from "next/navigation";
import type { AssetDocumentDefinition } from "@/types/asset-masters/asset-document-definition.types";
import { ApiError } from "@/lib/utils/api";
import { createLogger } from "@/lib/utils/server-logger";

const logger = createLogger("EditDocumentDefinitionPage");

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

  let docData: AssetDocumentDefinition;
  try {
    docData = await getAssetDocumentDefinitionByIdAction(id);
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) {
      notFound();
    }
    logger.error("Failed to fetch asset document definition", { id }, error);
    throw error;
  }

  const hasCategoryParam = resolvedSearchParams.assetCategoryId !== undefined;
  const categoryIdFromQuery = Number(resolvedSearchParams.assetCategoryId);
  const selectedCategoryId = hasCategoryParam
    ? (Number.isFinite(categoryIdFromQuery) && categoryIdFromQuery > 0 ? categoryIdFromQuery : 0)
    : (docData.assetCategoryId ?? 0);

  const [categories, types] = await Promise.all([
    getAssetCategoriesAction(),
    selectedCategoryId > 0 ? getAssetTypesByCategoryAction(selectedCategoryId) : Promise.resolve([]),
  ]);

  return (
    <AssetDocumentDefinitionForm
      id={id}
      initialData={docData}
      categories={categories.map((c) => ({ id: c.id, name: c.categoryName }))}
      types={types.map((t) => ({ id: t.id, name: t.typeName }))}
    />
  );
}
