import { InventoryModelForm } from "@/components/modules/assets/configuration/master-data/inventory-model-master";
import { getAssetMasterDataProvider } from "@/lib/api/asset-masters/asset-master-provider";
import { MASTER_IDS } from "@/types/asset-masters/master-data.types";

export default async function AddPage() {
  // Fetch inventory names for the dropdown
  const categoriesResult = await getAssetMasterDataProvider(
    MASTER_IDS.INVENTORY_NAME,
    "all",
    1,
    1000,
    ""
  );

  const groups = categoriesResult.success && categoriesResult.data
    ? (categoriesResult.data.records
      ?.filter((r: Record<string, unknown>) => r.status !== 'Inactive' && r.isActive !== false)
      .map((r: Record<string, unknown>) => ({
        id: String(r.id),
        name: String(r.subTypeName || r.name || r.subTypeCode || r.code || r.id),
        status: 'Active',
      })) || [])
    : [];

  return (
    <InventoryModelForm initialData={null} groups={groups as never} />
  );
}
