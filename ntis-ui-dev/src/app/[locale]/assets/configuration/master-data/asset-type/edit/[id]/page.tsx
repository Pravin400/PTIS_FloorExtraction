import { setRequestLocale } from "next-intl/server";
import { AssetTypeForm } from "@/components/modules/assets/configuration/master-data/asset-type-master";
import { getAssetMasterDataProvider } from "@/lib/api/asset-masters/asset-master-provider";
import { getAssetTypeByIdAction } from "../../actions";
import { MASTER_IDS } from "@/types/asset-masters/master-data.types";
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

  // Fetch categories and specific asset type
  const [categoriesResult, rawRecord] = await Promise.all([
    getAssetMasterDataProvider(MASTER_IDS.CATEGORY, "all", 1, 1000, ""),
    getAssetTypeByIdAction(id),
  ]);

  if (!rawRecord) {
    notFound();
  }

  const groups = categoriesResult.success && categoriesResult.data
    ? (categoriesResult.data.records
      ?.map((r: Record<string, unknown>) => ({
        id: String(r.id),
        name: String(r.name ?? r.categoryName ?? ""),
        status: String(r.status ?? "Active"),
      })) || [])
    : [];

  let initialData = null;
  try {
    const allowUnit = rawRecord.allowUnitRegistration;
    const allowRoom = rawRecord.allowRoomRegistration;

    const rawRecordObj = rawRecord as unknown as Record<string, unknown>;
    initialData = {
      id: String(rawRecord.id),
      code: rawRecord.typeCode || (rawRecordObj.TypeCode as string) || "",
      name: rawRecord.typeName || (rawRecordObj.TypeName as string) || "",
      typeNameLocal: rawRecord.typeNameLocal || (rawRecordObj.TypeNameLocal as string) || (rawRecordObj.typeName_local as string) || "",
      group: String(rawRecordObj.assetCategoryId || rawRecordObj.AssetCategoryId || rawRecord.categoryId || rawRecordObj.CategoryId || ""),
      allowUnitRegistration: allowUnit === true || String(allowUnit).toLowerCase() === "true" || (allowUnit as unknown) === 1 || rawRecordObj.isUnitRegistration === true,
      allowRoomRegistration: allowRoom === true || String(allowRoom).toLowerCase() === "true" || (allowRoom as unknown) === 1 || rawRecordObj.isRoomRegistration === true,
      isSubUnit: rawRecord.isSubUnit === true || String(rawRecord.isSubUnit).toLowerCase() === "true" || rawRecordObj.IsSubUnit === true,
      description: rawRecord.description || (rawRecordObj.Description as string) || "",
      isActive: rawRecord.isActive ?? (rawRecordObj.IsActive as boolean) ?? true,
    };
  } catch (_error) {
    // Should not happen if data mapping is safe, error logged in action otherwise
  }

  if (!initialData) {
    return (
      <>
        {/* eslint-disable-next-line i18next/no-literal-string */}
        <div className="flex items-center justify-center h-full p-12 text-slate-500">
          Asset Type not found or error loading data.
        </div>
      </>
    );
  }

  return (
    <AssetTypeForm initialData={initialData as never} groups={groups as never} />
  );
}
