import { setRequestLocale } from "next-intl/server";
import { AssetCategoryForm } from "@/components/modules/assets/configuration/master-data/asset-category-master";

export default async function AddAssetCategoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AssetCategoryForm initialData={null} />;
}
