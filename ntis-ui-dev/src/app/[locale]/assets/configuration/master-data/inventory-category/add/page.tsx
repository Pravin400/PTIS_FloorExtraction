import { setRequestLocale } from "next-intl/server";
import { InventoryCategoryForm } from "@/components/modules/assets/configuration/master-data/inventory-category-master";
import { getAssetCategoriesForInventoryAction } from "../actions";

export default async function AddPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const categoriesResult = await getAssetCategoriesForInventoryAction();

  const groups = categoriesResult.success && categoriesResult.data
    ? categoriesResult.data
      .filter((r) => r.status === "Active")
      .map((r) => ({
        id: String(r.id),
        name: String(r.name),
        status: "Active",
      }))
    : [];

  return (
    <InventoryCategoryForm initialData={null} groups={groups as never} />
  );
}
