import { setRequestLocale } from "next-intl/server";
import { AssetCategoryForm } from "@/components/modules/assets/configuration/master-data/asset-category-master";
import { getAssetCategoryByIdAction } from "../../actions";
import { notFound } from "next/navigation";

export default async function EditAssetCategoryPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const resolvedParams = await params;
  setRequestLocale(resolvedParams.locale);
  let initialData = null;

  try {
    initialData = await getAssetCategoryByIdAction(resolvedParams.id);
  } catch (_error) {
    // Error is handled and logged in the action itself
  }

  if (!initialData) {
    notFound();
  }

  return <AssetCategoryForm initialData={initialData as never} />;
}
