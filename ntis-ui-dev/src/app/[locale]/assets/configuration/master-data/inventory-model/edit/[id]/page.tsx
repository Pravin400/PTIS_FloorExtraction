import { InventoryModelForm } from "@/components/modules/assets/configuration/master-data/inventory-model-master";
import { getAssetMasterDataProvider } from "@/lib/api/asset-masters/asset-master-provider";
import { getInventoryModelByIdAction } from "../../actions";
import { MASTER_IDS } from "@/types/asset-masters/master-data.types";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditPage({ params }: PageProps) {
  const { id } = await params;

  const [categoriesResult, initialData] = await Promise.all([
    getAssetMasterDataProvider(MASTER_IDS.INVENTORY_NAME, "all", 1, 1000, ""),
    getInventoryModelByIdAction(id),
  ]);

  if (!initialData) {
    notFound();
  }

  const groups = categoriesResult.success && categoriesResult.data
    ? (categoriesResult.data.records
      ?.filter((r: Record<string, unknown>) => r.status !== 'Inactive' && r.isActive !== false)
      .map((r: Record<string, unknown>) => ({
        id: String(r.id),
        name: String(r.subTypeName || r.name || r.subTypeCode || r.code || r.id),
        status: 'Active',
      })) || [])
    : [];

  return <InventoryModelForm initialData={initialData as never} groups={groups as never} />;
}
