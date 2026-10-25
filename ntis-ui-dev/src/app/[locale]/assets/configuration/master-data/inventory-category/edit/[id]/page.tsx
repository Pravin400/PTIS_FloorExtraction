import { setRequestLocale } from "next-intl/server";
import { InventoryCategoryForm } from "@/components/modules/assets/configuration/master-data/inventory-category-master";
import { getInventoryCategoryByIdAction, getAssetCategoriesForInventoryAction } from "../../actions";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}

export default async function EditPage({ params }: PageProps) {
  const { id, locale } = await params;
  setRequestLocale(locale);

  const [initialData, categoriesResult] = await Promise.all([
    getInventoryCategoryByIdAction(id).catch(() => null),
    getAssetCategoriesForInventoryAction(),
  ]);

  if (!initialData) {
    notFound();
  }

  const groups = categoriesResult.success && categoriesResult.data
    ? categoriesResult.data
      .filter((r) => r.status === "Active" || String(r.id) === String(initialData.group))
      .map((r) => ({
        id: String(r.id),
        name: String(r.name),
        status: String(r.status),
      }))
    : [];

  return (
    <InventoryCategoryForm initialData={initialData as never} groups={groups as never} />
  );
}
