import AssetRoomTypeForm from "@/components/modules/assets/configuration/master-data/asset-room-type-master/AssetRoomTypeForm";
import { getAssetRoomTypeByIdAction, getAssetCategoriesAction, getAssetTypesByCategoryAction } from "../../action";
import { notFound } from "next/navigation";
import type { AssetRoomType } from "@/types/asset-masters/asset-room-type.types";
import { ApiError } from "@/lib/utils/api";
import { createLogger } from "@/lib/utils/server-logger";

const logger = createLogger("EditRoomTypePage");

interface PageProps {
  params: Promise<{
    roomTypeId: string;
  }>;
  searchParams: Promise<{
    assetCategoryId?: string;
  }>;
}

export default async function EditPage({ params, searchParams }: PageProps): Promise<React.ReactElement> {
  const { roomTypeId: roomTypeIdParam } = await params;
  const { assetCategoryId: assetCategoryIdQuery } = await searchParams;

  const roomTypeId = Number(roomTypeIdParam);
  if (!Number.isFinite(roomTypeId) || roomTypeId <= 0) {
    notFound();
  }

  let roomTypeData: AssetRoomType;
  try {
    roomTypeData = await getAssetRoomTypeByIdAction(roomTypeId);
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) {
      notFound();
    }
    logger.error("Failed to fetch asset room type", { roomTypeId }, error);
    throw error;
  }

  const categories = await getAssetCategoriesAction();

  // If a category has been selected in the UI, use it. Otherwise, fall back to the record's existing category ID.
  const activeCategoryId = assetCategoryIdQuery !== undefined
    ? Number(assetCategoryIdQuery)
    : roomTypeData.assetCategoryId;

  const selectedCategoryId = Number.isFinite(activeCategoryId) && activeCategoryId && activeCategoryId > 0
    ? activeCategoryId
    : undefined;

  const types = selectedCategoryId ? await getAssetTypesByCategoryAction(selectedCategoryId) : [];

  return (
    <AssetRoomTypeForm
      id={roomTypeId}
      initialData={roomTypeData}
      categories={categories.map(c => ({ id: c.id, name: c.categoryName }))}
      types={types.map(t => ({ id: t.id, name: t.typeName }))}
    />
  );
}
