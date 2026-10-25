import AssetGrievanceRemarkForm from "@/components/modules/assets/configuration/master-data/grievance-remark-master/AssetGrievanceRemarkForm";
import { getAssetGrievanceRemarkByIdAction, getGrievanceCategoriesAction } from "../../action";
import { notFound } from "next/navigation";
import type { AssetGrievanceRemark } from "@/types/asset-masters/asset-grievance-remark.types";
import { ApiError } from "@/lib/utils/api";
import { createLogger } from "@/lib/utils/server-logger";

const logger = createLogger("EditGrievanceRemarkPage");

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditPage({ params }: PageProps): Promise<React.ReactElement> {
  const { id: remarkIdParam } = await params;
  const remarkId = Number(remarkIdParam);

  if (!Number.isFinite(remarkId) || remarkId <= 0) {
    notFound();
  }

  let remarkData: AssetGrievanceRemark;
  try {
    remarkData = await getAssetGrievanceRemarkByIdAction(remarkId);
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) {
      notFound();
    }
    logger.error("Failed to fetch asset grievance remark", { remarkId }, error);
    throw error;
  }

  const categories = await getGrievanceCategoriesAction();

  return (
    <AssetGrievanceRemarkForm
      id={remarkId}
      initialData={remarkData}
      categories={categories.map((c) => ({
        id: c.id,
        grievanceTypeName: c.grievanceTypeName,
      }))}
    />
  );
}
