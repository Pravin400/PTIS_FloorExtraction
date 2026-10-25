import AssetGrievanceCategoryForm from "@/components/modules/assets/configuration/master-data/grievance-category-master/AssetGrievanceCategoryForm";
import { getAssetGrievanceCategoryByIdAction } from "../../action";
import { notFound } from "next/navigation";
import type { AssetGrievanceCategory } from "@/types/asset-masters/asset-grievance-category.types";
import { ApiError } from "@/lib/utils/api";
import { createLogger } from "@/lib/utils/server-logger";

const logger = createLogger("EditGrievanceCategoryPage");

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditPage({ params }: PageProps): Promise<React.ReactElement> {
  const { id: categoryIdParam } = await params;
  const categoryId = Number(categoryIdParam);

  if (!Number.isFinite(categoryId) || categoryId <= 0) {
    notFound();
  }

  let categoryData: AssetGrievanceCategory;
  try {
    categoryData = await getAssetGrievanceCategoryByIdAction(categoryId);
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) {
      notFound();
    }
    logger.error("Failed to fetch asset grievance category", { categoryId }, error);
    throw error;
  }

  return (
    <AssetGrievanceCategoryForm
      id={categoryId}
      initialData={categoryData}
    />
  );
}
