import { setRequestLocale } from "next-intl/server";
import { AssetTypeForm } from "@/components/modules/assets/configuration/master-data/asset-type-master";
import { getAssetMasterDataProvider } from "@/lib/api/asset-masters/asset-master-provider";
import { MASTER_IDS } from "@/types/asset-masters/master-data.types";

export default async function AddPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  // Fetch categories for the dropdown
  const categoriesResult = await getAssetMasterDataProvider(
    MASTER_IDS.CATEGORY,
    "all",
    1,
    1000,
    ""
  );

  const groups = categoriesResult.success && categoriesResult.data
    ? (categoriesResult.data.records
      ?.filter((r: Record<string, unknown>) => r.status === "Active")
      .map((r: Record<string, unknown>) => ({
        id: String(r.id),
        name: String(r.name ?? ""),
        status: "Active",
      })) || [])
    : [];
  return (
    <AssetTypeForm initialData={null} groups={groups as never} />
  );
}
